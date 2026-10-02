import * as THREE from "three";
import { drawBody, drawFace, Expr, FACE_PX } from "./face";

/**
 * Das Maskottchen: eine kleine Ton-Figur in 3D (Three.js), die anschließend
 * durch einen Halbton-Shader läuft – derselbe Look wie die Figur im
 * Referenzvideo, aber mit Kompass-Emblem auf dem Pulli.
 *
 * Ein einziger WebGL-Kontext für das ganze Video: Die Leinwand ist so groß wie
 * das Bild (1080×1920), Position und Größe der Figur werden in Pixeln gesetzt.
 */

export type Pose = {
  /** Kopfmitte in Bildpixeln */
  x: number;
  y: number;
  /** 1 = Kopfdurchmesser ≈ 430 px */
  scale: number;
  yaw: number;
  pitch: number;
  roll: number;
  /** Squash & Stretch: >1 gestreckt, <1 gestaucht */
  stretch: number;
  /** Körper sichtbar (0 = nur Kopf, z. B. für Logo-Szene) */
  body: number;
  /** Requisiten 0..1 */
  laptop: number;
  mug: number;
};

export type Look = {
  /** Halbton-Zellgröße in Pixeln */
  cell: number;
  ink: [number, number, number];
  paper: [number, number, number];
  /** Deckkraft der Figur gesamt */
  opacity: number;
};

const FOV = 16;
const CAM_Z = 40;

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const frag = /* glsl */ `
precision highp float;
uniform sampler2D tSrc;
uniform vec2 res;
uniform float cell;
uniform vec3 ink;
uniform vec3 paper;
uniform float opacity;
varying vec2 vUv;

// Helligkeit (wahrnehmungsnah) gewichtet mit Deckung: Ränder übernehmen die
// Helligkeit der Figur statt der des leeren Hintergrunds.
vec4 tap(vec2 px) {
  vec4 s = texture2D(tSrc, px / res);
  float l = dot(s.rgb / max(s.a, 1e-4), vec3(0.2126, 0.7152, 0.0722));
  l = pow(max(l, 0.0), 1.0 / 2.2);
  return vec4(l * s.a, 0.0, 0.0, s.a);
}

void main() {
  vec2 px = vUv * res;
  float ang = 0.785398; // 45°
  float c = cos(ang), s = sin(ang);
  mat2 rot = mat2(c, -s, s, c);
  mat2 inv = mat2(c, s, -s, c);
  vec2 rp = rot * px;
  vec2 ci = floor(rp / cell);
  vec2 ccR = (ci + 0.5) * cell;
  vec2 cc = inv * ccR;
  float h = cell * 0.3;
  vec4 acc = vec4(0.0);
  acc += tap(cc) * 2.0;
  acc += tap(cc + vec2(h, 0.0));
  acc += tap(cc - vec2(h, 0.0));
  acc += tap(cc + vec2(0.0, h));
  acc += tap(cc - vec2(0.0, h));
  float l = acc.w > 1e-3 ? acc.x / acc.w : 1.0;
  // Kontrastkurve: Lichter sauber weiß, Tiefen satt
  l = smoothstep(0.08, 0.93, l);
  float dark = 1.0 - l;
  float rad = sqrt(dark) * cell * 0.74;
  float d = length(rp - ccR);
  float dotv = 1.0 - smoothstep(rad - 0.75, rad + 0.75, d);
  if (dark > 0.97) dotv = 1.0;
  vec4 here = texture2D(tSrc, vUv);
  // Gesichtszüge (reines Schwarz/Weiß) bleiben gestochen scharf statt gerastert
  float lp = pow(max(dot(here.rgb / max(here.a, 1e-4), vec3(0.2126, 0.7152, 0.0722)), 0.0), 1.0 / 2.2);
  dotv = max(dotv, 1.0 - smoothstep(0.1, 0.2, lp));
  dotv *= 1.0 - smoothstep(0.955, 0.985, lp);
  float a = here.a * opacity;
  vec3 col = mix(paper, ink, dotv);
  gl_FragColor = vec4(col * a, a);
}
`;

const seeded = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

export class MascotRenderer {
  readonly w: number;
  readonly h: number;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private rt: THREE.WebGLRenderTarget;
  private post: THREE.Mesh;
  private postScene = new THREE.Scene();
  private postCam = new THREE.Camera();
  private uniforms: Record<string, THREE.IUniform>;
  private root = new THREE.Group();
  private headPivot = new THREE.Group();
  private bodyGroup = new THREE.Group();
  private laptop = new THREE.Group();
  private laptopLid = new THREE.Group();
  private mug = new THREE.Group();
  private faceCanvas: HTMLCanvasElement;
  private faceCtx: CanvasRenderingContext2D;
  private faceTex: THREE.CanvasTexture;
  readonly pxPerUnit: number;

  constructor(canvas: HTMLCanvasElement, w: number, h: number) {
    this.w = w;
    this.h = h;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(w, h, false);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(FOV, w / h, 1, 100);
    this.camera.position.set(0, 0, CAM_Z);
    this.pxPerUnit = h / (2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180));

    this.rt = new THREE.WebGLRenderTarget(w, h, {
      samples: 4,
      type: THREE.UnsignedByteType,
      colorSpace: THREE.SRGBColorSpace,
    });

    this.uniforms = {
      tSrc: { value: this.rt.texture },
      res: { value: new THREE.Vector2(w, h) },
      cell: { value: 7 },
      ink: { value: new THREE.Vector3(0.04, 0.05, 0.06) },
      paper: { value: new THREE.Vector3(1, 1, 1) },
      opacity: { value: 1 },
    };
    this.post = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        premultipliedAlpha: true,
      }),
    );
    this.postScene.add(this.post);

    this.faceCanvas = document.createElement("canvas");
    this.faceCanvas.width = FACE_PX;
    this.faceCanvas.height = FACE_PX;
    this.faceCtx = this.faceCanvas.getContext("2d")!;
    this.faceTex = new THREE.CanvasTexture(this.faceCanvas);
    this.faceTex.colorSpace = THREE.SRGBColorSpace;
    this.faceTex.anisotropy = 4;

    this.build();
    this.light();
  }

  private build() {
    const skin = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.62, metalness: 0 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.62, metalness: 0 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7 });

    // Kopf
    const head = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 72), skin);
    head.scale.set(1.04, 0.97, 0.98);
    head.castShadow = true;
    head.receiveShadow = true;
    this.headPivot.add(head);

    // Gesicht als Textur auf einem Kugelausschnitt
    const facePatch = new THREE.Mesh(
      new THREE.SphereGeometry(1.004, 64, 64, Math.PI / 2 - 1, 2, Math.PI / 2 - 1, 2),
      new THREE.MeshBasicMaterial({
        map: this.faceTex,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    );
    facePatch.receiveShadow = true;
    head.add(facePatch);

    // Nase
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 24), skin);
    nose.position.set(0, -0.08, 0.99);
    nose.scale.set(1.1, 0.9, 0.8);
    nose.castShadow = true;
    this.headPivot.add(nose);

    // Ohren
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 24), skin);
      ear.position.set(s * 1.02, -0.08, -0.02);
      ear.scale.set(0.55, 1, 0.8);
      ear.castShadow = true;
      ear.receiveShadow = true;
      this.headPivot.add(ear);
    }

    // Locken: Kugelhaufen auf Oberkopf, Seiten und Hinterkopf
    const rnd = seeded(7);
    const n = 260;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const curlGeo = new THREE.SphereGeometry(1, 28, 20);
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      const d = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
      const front = d.z;
      const keep =
        (d.y > 0.5 && !(front > 0.55 && d.y < 0.72)) ||
        (front < 0.35 && d.y > 0.05) ||
        (front < -0.1 && d.y > -0.45) ||
        (Math.abs(d.x) > 0.8 && d.y > -0.1 && front < 0.4);
      if (!keep) continue;
      if (rnd() < 0.55) continue;
      const lift = d.y > 0.55 ? 0.12 + rnd() * 0.08 : 0.04 + rnd() * 0.05;
      const curl = new THREE.Mesh(curlGeo, hairMat);
      const rad = 0.21 + rnd() * 0.12;
      curl.scale.setScalar(rad);
      curl.position.copy(d.clone().multiplyScalar(1 + lift - rad * 0.35));
      curl.castShadow = true;
      curl.receiveShadow = true;
      this.headPivot.add(curl);
    }

    // Kragen (Rollkragen wie in der Referenz)
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.32, 48), dark);
    collar.position.set(0, -1.02, -0.05);
    collar.receiveShadow = true;
    this.bodyGroup.add(collar);

    // Oberkörper (Lathe-Profil: Hals → Schultern → Brust)
    const prof: THREE.Vector2[] = [];
    // von unten nach oben, damit die Normalen nach außen zeigen
    const pts: [number, number][] = [
      [1.62, -8.0],
      [1.62, -3.6],
      [1.58, -2.7],
      [1.48, -2.1],
      [1.3, -1.66],
      [1.02, -1.36],
      [0.66, -1.16],
      [0.46, -1.1],
      [0.0, -1.08],
    ];
    for (const [r, y] of pts) prof.push(new THREE.Vector2(r, y));
    const bodyCanvas = document.createElement("canvas");
    bodyCanvas.width = 1024;
    bodyCanvas.height = 512;
    drawBody(bodyCanvas.getContext("2d")!, 1024, 512);
    const bodyTex = new THREE.CanvasTexture(bodyCanvas);
    bodyTex.colorSpace = THREE.SRGBColorSpace;
    const bodyMesh = new THREE.Mesh(
      new THREE.LatheGeometry(prof, 96, Math.PI, Math.PI * 2),
      new THREE.MeshStandardMaterial({ map: bodyTex, roughness: 0.92 }),
    );
    bodyMesh.scale.set(1, 1, 0.78);
    bodyMesh.position.z = -0.05;
    bodyMesh.receiveShadow = true;
    bodyMesh.castShadow = true;
    this.bodyGroup.add(bodyMesh);

    // Laptop (vor der Figur)
    const alu = new THREE.MeshStandardMaterial({ color: 0xa9a9a9, roughness: 0.45, metalness: 0.15 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.09, 1.6), alu);
    base.position.set(0, 0, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    this.laptop.add(base);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.45, 0.07), alu);
    lid.position.set(0, 0.725, 0);
    lid.castShadow = true;
    this.laptopLid.add(lid);
    // Apfel-freies Logo: kleiner Kompass-Punkt auf dem Deckel
    const dotM = new THREE.Mesh(new THREE.CircleGeometry(0.11, 32), dark);
    dotM.position.set(0, 0.75, 0.04);
    this.laptopLid.add(dotM);
    // Bildschirm: Video-Call-Raster (Remote-Arbeit auf einen Blick)
    const sc = document.createElement("canvas");
    sc.width = 512;
    sc.height = 300;
    const sg = sc.getContext("2d")!;
    sg.fillStyle = "#1a1a1a";
    sg.fillRect(0, 0, 512, 300);
    sg.fillStyle = "#f2f2f2";
    sg.fillRect(14, 14, 484, 272);
    for (let i = 0; i < 4; i++) {
      const x = 26 + (i % 2) * 236;
      const y = 26 + Math.floor(i / 2) * 128;
      sg.fillStyle = i === 0 ? "#8a8a8a" : "#b8b8b8";
      sg.fillRect(x, y, 224, 116);
      sg.fillStyle = "#3a3a3a";
      sg.beginPath();
      sg.arc(x + 112, y + 50, 22, 0, Math.PI * 2);
      sg.fill();
      sg.beginPath();
      sg.ellipse(x + 112, y + 112, 44, 30, 0, Math.PI, 0);
      sg.fill();
    }
    const scTex = new THREE.CanvasTexture(sc);
    scTex.colorSpace = THREE.SRGBColorSpace;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.36, 1.32), new THREE.MeshBasicMaterial({ map: scTex }));
    screen.position.set(0, 0.725, 0.037);
    this.laptopLid.add(screen);
    this.laptopLid.position.set(0, 0.04, -0.78);
    this.laptop.add(this.laptopLid);
    this.laptop.position.set(-1.55, -2.35, 1.35);
    this.laptop.rotation.set(0.12, 0.95, 0);

    // Tasse
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.23, 0.55, 40), new THREE.MeshStandardMaterial({ color: 0xbdbdbd, roughness: 0.5 }));
    cup.castShadow = true;
    this.mug.add(cup);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.045, 16, 32), new THREE.MeshStandardMaterial({ color: 0xbdbdbd, roughness: 0.5 }));
    handle.position.set(0.28, 0, 0);
    this.mug.add(handle);
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.23, 32), dark);
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 0.26;
    this.mug.add(coffee);
    this.mug.position.set(1.55, -2.2, 1.6);

    this.root.add(this.bodyGroup);
    this.root.add(this.headPivot);
    this.root.add(this.laptop);
    this.root.add(this.mug);
    this.scene.add(this.root);
  }

  private light() {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.95);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 2.9);
    key.position.set(-5, 6, 9);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -5;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 30;
    key.shadow.radius = 4;
    key.shadow.bias = -0.0015;
    this.scene.add(key);
    this.scene.add(key.target);
    const rim = new THREE.DirectionalLight(0xffffff, 1.1);
    rim.position.set(6, 3, -4);
    this.scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 0.45);
    fill.position.set(4, -2, 6);
    this.scene.add(fill);
  }

  render(pose: Pose, expr: Expr, blink: number, look: Look) {
    drawFace(this.faceCtx, expr, blink);
    this.faceTex.needsUpdate = true;

    const u = this.pxPerUnit;
    const s = pose.scale * 1.08;
    this.root.position.set((pose.x - this.w / 2) / u, -(pose.y - this.h / 2) / u, 0);
    this.root.scale.set(s / Math.sqrt(pose.stretch), s * pose.stretch, s / Math.sqrt(pose.stretch));
    this.headPivot.rotation.set(pose.pitch, pose.yaw, pose.roll, "YXZ");
    this.bodyGroup.rotation.set(0, pose.yaw * 0.35, pose.roll * 0.25);
    this.bodyGroup.visible = pose.body > 0.01;
    this.bodyGroup.position.y = -(1 - pose.body) * 4;

    this.laptop.visible = pose.laptop > 0.001;
    const ls = Math.max(0.001, pose.laptop) * 0.82;
    this.laptop.scale.setScalar(ls);
    this.laptopLid.rotation.x = -0.22 - (1 - Math.min(1, pose.laptop)) * 1.3;
    this.mug.visible = pose.mug > 0.001;
    this.mug.scale.setScalar(Math.max(0.001, pose.mug));

    this.uniforms.cell.value = look.cell;
    (this.uniforms.ink.value as THREE.Vector3).set(...look.ink);
    (this.uniforms.paper.value as THREE.Vector3).set(...look.paper);
    this.uniforms.opacity.value = look.opacity;

    this.renderer.setRenderTarget(this.rt);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    this.renderer.render(this.postScene, this.postCam);
  }

  dispose() {
    this.renderer.dispose();
    this.rt.dispose();
    this.faceTex.dispose();
  }
}
