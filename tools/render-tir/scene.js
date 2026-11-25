// Scenă 3D: TIR Mărfuri.ro, cap tractor realist, întors ușor spre privitor.
// Unități: metri. Camionul merge spre +X; privitorul e în față-dreapta (+X, +Z).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const params = new URLSearchParams(location.search);
const W = Number(params.get("w") || 2400);
const H = Number(params.get("h") || 1100);
const CAM = (params.get("cam") || "10.6,2.2,10.2").split(",").map(Number);
const LOOK = (params.get("look") || "-3.4,2.05,0").split(",").map(Number);
const FOV = Number(params.get("fov") || 27);

// încărcăm și setul cu diacritice (Ă), altfel litera vine din alt font
await document.fonts.load('400 120px "Russo One"', "MĂRFURI.RO ăâîșț");

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; // păstrează roșul mărcii fidel
renderer.toneMappingExposure = 0.95;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);

// Studio foto: cer luminos, orizont, sol mai închis și softbox-uri -> reflexii realiste pe vopsea și geamuri
function studioEnvironment() {
  const s = new THREE.Scene();
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 1024;
  const g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 0, 1024);
  gr.addColorStop(0, "#f7f9fb");
  gr.addColorStop(0.42, "#e4e9ef");
  gr.addColorStop(0.495, "#b9c1ca");
  gr.addColorStop(0.505, "#6c727b");
  gr.addColorStop(0.6, "#4a4e55");
  gr.addColorStop(1, "#2c2f34");
  g.fillStyle = gr;
  g.fillRect(0, 0, 16, 1024);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  s.add(new THREE.Mesh(new THREE.SphereGeometry(40, 64, 32), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })));
  const soft = (w, h, intensity, x, y, z) => {
    const m = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    m.color.setRGB(intensity, intensity, intensity);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    p.position.set(x, y, z);
    p.lookAt(0, 2, 0);
    s.add(p);
  };
  soft(34, 10, 5, 0, 30, 4);
  soft(14, 9, 3.2, 26, 10, 18);
  soft(10, 12, 2.2, -20, 9, 24);
  soft(8, 14, 1.6, 30, 8, -14);
  return pmrem.fromScene(s, 0.015).texture;
}
scene.environment = studioEnvironment();
scene.environmentIntensity = 1.0;

// ---------- lumini de studio
const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(14, 20, 16);
key.castShadow = true;
key.shadow.mapSize.set(4096, 4096);
Object.assign(key.shadow.camera, { left: -18, right: 18, top: 12, bottom: -12, near: 1, far: 70 });
key.shadow.radius = 10;
key.shadow.blurSamples = 20;
key.shadow.bias = -0.0004;
scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 0.9);
rim.position.set(-10, 8, -12);
scene.add(rim);
scene.add(new THREE.HemisphereLight(0xffffff, 0xe8e6e2, 0.55));

// ---------- materiale
const M = {
  paint: new THREE.MeshPhysicalMaterial({ color: 0xc8201a, metalness: 0.05, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 }),
  blackGloss: new THREE.MeshPhysicalMaterial({ color: 0x0f1012, metalness: 0.1, roughness: 0.25, clearcoat: 0.7, clearcoatRoughness: 0.1 }),
  plastic: new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.78 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.07 }),
  alu: new THREE.MeshStandardMaterial({ color: 0xd6dade, metalness: 1, roughness: 0.3 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x1b2633, metalness: 0.0, roughness: 0.0, clearcoat: 1, clearcoatRoughness: 0.0, envMapIntensity: 1.6 }),
  tire: new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.9 }),
  rimMat: new THREE.MeshStandardMaterial({ color: 0xc4c9cf, metalness: 1, roughness: 0.22 }),
  hole: new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.6 }),
  lamp: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff1d6, emissiveIntensity: 2.2, roughness: 0.1 }),
  lens: new THREE.MeshPhysicalMaterial({ color: 0xdfe6ee, metalness: 0.3, roughness: 0.05, clearcoat: 1 }),
  amber: new THREE.MeshStandardMaterial({ color: 0xff9a2e, emissive: 0xff8a1a, emissiveIntensity: 1.6 }),
  tread: new THREE.MeshStandardMaterial({ color: 0x8d939b, metalness: 0.9, roughness: 0.45 }),
};

const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
};
const box = (w, h, d, mat, x, y, z, rx, ry, rz) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz);
const rbox = (w, h, d, r, mat, x, y, z, rx, ry, rz) => add(new RoundedBoxGeometry(w, h, d, 6, r), mat, x, y, z, rx, ry, rz);

// ---------- roată realistă (axa pe Z)
function wheel(x, z, width = 0.31, outward = 1) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.125, 32, 96), M.tire);
  tire.scale.z = width / 0.25;
  g.add(tire);
  const tread = new THREE.Mesh(new THREE.CylinderGeometry(0.532, 0.532, width * 0.82, 96, 1, true), M.tire);
  tread.rotation.x = Math.PI / 2;
  g.add(tread);
  const rimC = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, width * 0.7, 64), M.rimMat);
  rimC.rotation.x = Math.PI / 2;
  g.add(rimC);
  const face = outward * width * 0.35;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.02, 16), M.hole);
    h.rotation.x = Math.PI / 2;
    h.position.set(Math.cos(a) * 0.215, Math.sin(a) * 0.215, face + outward * 0.002);
    g.add(h);
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 6), M.chrome);
    nut.rotation.x = Math.PI / 2;
    nut.position.set(Math.cos(a + 0.31) * 0.135, Math.sin(a + 0.31) * 0.135, face + outward * 0.01);
    g.add(nut);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.08, 32), M.chrome);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = face + outward * 0.03;
  g.add(hub);
  g.position.set(x, 0.535, z);
  g.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  scene.add(g);
}

// ---------- textura prelatei: identică cu desenul logo-ului (548 × 124 unități)
function trailerTexture() {
  const S = 4;
  const c = document.createElement("canvas");
  c.width = 548 * S;
  c.height = 124 * S;
  const x = c.getContext("2d");
  x.scale(S, S);
  x.fillStyle = "#C8201A";
  x.fillRect(0, 0, 548, 124);
  const sh = x.createLinearGradient(0, 0, 0, 124);
  sh.addColorStop(0, "rgba(255,255,255,0.18)");
  sh.addColorStop(0.25, "rgba(255,255,255,0)");
  sh.addColorStop(1, "rgba(0,0,0,0.28)");
  x.fillStyle = sh;
  x.fillRect(0, 0, 548, 124);
  x.fillStyle = "#14161A";
  x.fillRect(0, 100, 548, 5);
  x.fillRect(0, 109, 548, 2);
  const word = (text, size, left, base, width, fill, stroke) => {
    x.save();
    x.font = `${size}px "Russo One"`;
    const w0 = x.measureText(text).width;
    x.translate(left, base);
    x.scale(width / w0, 1);
    if (typeof fill === "function") fill = fill(size);
    if (stroke) {
      x.lineJoin = "round";
      x.lineWidth = 3 / (width / w0);
      x.strokeStyle = "#08090B";
      x.strokeText(text, 0, 0);
    }
    x.fillStyle = fill;
    x.fillText(text, 0, 0);
    x.restore();
  };
  // gradientul cromat, în coordonatele literei (de la vârful lui „Ă” până sub linia de bază), ca în SVG
  const chrome = (size) => {
    const ch = x.createLinearGradient(0, -size * 0.92, 0, size * 0.06);
    ch.addColorStop(0, "#FFFFFF");
    ch.addColorStop(0.45, "#C9CDD2");
    ch.addColorStop(0.5, "#5A6068");
    ch.addColorStop(0.75, "#E6E9EC");
    ch.addColorStop(1, "#9AA0A8");
    return ch;
  };
  word("MĂRFURI", 66, 84, 80, 330, chrome, true);
  word(".RO", 32, 426, 80, 74, "#FFFFFF", false);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

function decalTexture(text) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 160;
  const x = c.getContext("2d");
  x.font = '110px "Russo One"';
  x.fillStyle = "#FFFFFF";
  x.textBaseline = "middle";
  x.fillText(text, 8, 84);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function skidTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 32;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0, "rgba(20,22,26,0)");
  g.addColorStop(1, "rgba(20,22,26,0.55)");
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 32);
  return new THREE.CanvasTexture(c);
}

function softShadowTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const x = c.getContext("2d");
  x.filter = "blur(28px)";
  x.fillStyle = "rgba(0,0,0,0.55)";
  x.fillRect(70, 70, 884, 116);
  return new THREE.CanvasTexture(c);
}

// ---------- sol (doar umbre, fundal transparent)
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.22 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const contact = new THREE.Mesh(new THREE.PlaneGeometry(18.5, 3.6), new THREE.MeshBasicMaterial({ map: softShadowTexture(), transparent: true, depthWrite: false }));
contact.rotation.x = -Math.PI / 2;
contact.position.set(-3.6, 0.004, 0);
scene.add(contact);
const skidMat = new THREE.MeshBasicMaterial({ map: skidTexture(), transparent: true, depthWrite: false });
for (const [x0, len, z] of [[-7.6, 4.2, 1.0], [-0.1, 3.2, 1.0], [3.45, 2.6, 1.05]]) {
  const s = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.28), skidMat);
  s.rotation.x = -Math.PI / 2;
  s.position.set(x0 - len / 2, 0.006, z);
  scene.add(s);
}

// ======================================================= SEMIREMORCA (identică)
const TL = 12.15, TH = 2.75, TW = 2.5, TB = 1.28, TFRONT = 0.6;
const tcx = TFRONT - TL / 2;
const sideMat = new THREE.MeshPhysicalMaterial({ map: trailerTexture(), roughness: 0.35, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.08 });
box(TL, TH, TW, [M.paint, M.paint, M.paint, M.paint, sideMat, sideMat], tcx, TB + TH / 2, 0);
for (const zz of [-1, 1]) {
  box(TL, 0.06, 0.05, M.alu, tcx, TB + TH, zz * TW / 2);
  box(TL, 0.07, 0.05, M.alu, tcx, TB, zz * TW / 2);
  box(0.06, TH, 0.06, M.alu, TFRONT, TB + TH / 2, zz * TW / 2);
  box(0.06, TH, 0.06, M.alu, TFRONT - TL, TB + TH / 2, zz * TW / 2);
}
box(TL, 0.22, 2.2, M.plastic, tcx, TB - 0.11, 0);
for (const xx of [-1.7]) for (const zz of [-0.9, 0.9]) { box(0.12, 0.95, 0.12, M.plastic, xx, 0.66, zz); box(0.3, 0.05, 0.3, M.plastic, xx, 0.2, zz); }
for (const yy of [0.62, 0.92]) box(5.6, 0.07, 0.04, M.alu, -4.6, yy, 1.18);
for (const xx of [-2.4, -4.6, -6.8]) box(0.05, 0.5, 0.05, M.plastic, xx, 0.85, 1.16);
for (const xx of [-1.0, -4.0, -7.0, -10.0]) box(0.1, 0.05, 0.03, M.amber, xx, TB - 0.05, TW / 2 + 0.02);
for (const xx of [-9.78, -8.85, -7.91]) { wheel(xx, 1.02, 0.38, 1); wheel(xx, -1.02, 0.38, -1); }
box(3.2, 0.04, 0.55, M.plastic, -8.85, 1.12, 1.02);

// ======================================================= CAP TRACTOR
// șasiu, șa, roți motoare
for (const zz of [-0.45, 0.45]) box(5.8, 0.26, 0.1, M.plastic, 1.2, 0.95, zz);
rbox(1.2, 0.12, 1.7, 0.03, M.blackGloss, 0.05, 1.15, 0);
for (const zz of [1, -1]) { wheel(-0.2, zz * 0.86, 0.3, zz); wheel(-0.2, zz * 1.2, 0.3, zz); }
for (const zz of [1, -1]) {
  // după rotirea pe X, unghiul π cade sus: arcul acoperă partea de sus a roții
  const fg = new THREE.CylinderGeometry(0.64, 0.64, 0.72, 48, 1, true, Math.PI - Math.PI * 0.375, Math.PI * 0.75);
  add(fg, M.plastic, -0.2, 0.54, zz * 1.03, Math.PI / 2, 0, 0).material.side = THREE.DoubleSide;
  box(0.02, 0.55, 0.7, M.plastic, -0.88, 0.45, zz * 1.03);
}

// cabina
const cabGeo = new RoundedBoxGeometry(2.35, 2.75, 2.5, 12, 0.24);
{
  const p = cabGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const vx = p.getX(i), vy = p.getY(i);
    if (vx > 0 && vy > -0.1) p.setX(i, vx - (vy + 0.1) * 0.16 * (vx / 1.175));
  }
  cabGeo.computeVertexNormals();
}
add(cabGeo, M.paint, 2.88, 2.455, 0);
const rake = Math.atan(0.16);
// parbriz mare, cu ramă neagră și reflexii (urmează înclinarea feței)
box(0.02, 1.28, 2.26, M.blackGloss, 3.935, 3.18, 0, 0, 0, rake);
box(0.02, 1.16, 2.16, M.glass, 3.949, 3.19, 0, 0, 0, rake);
// parasolar lipit de cabină, cu lămpi
box(0.18, 0.05, 2.24, M.blackGloss, 3.82, 3.86, 0, 0, 0, -0.14);
for (const zz of [-0.72, -0.24, 0.24, 0.72]) box(0.04, 0.025, 0.09, M.amber, 3.9, 3.83, zz);
// deflectoare negre la colțurile din față ale cabinei
for (const zz of [1, -1]) rbox(0.16, 1.9, 0.06, 0.03, M.blackGloss, 3.86, 2.62, zz * 1.235, 0, 0, rake * 0.6);
// geamuri laterale (ambele părți)
for (const zz of [1, -1]) {
  box(0.82, 0.8, 0.012, M.blackGloss, 3.38, 3.1, zz * 1.252);
  box(0.76, 0.72, 0.014, M.glass, 3.38, 3.11, zz * 1.256);
  box(0.03, 0.72, 0.016, M.blackGloss, 3.6, 3.11, zz * 1.258, 0, 0, 0.12);
  box(0.56, 0.3, 0.012, M.blackGloss, 2.1, 3.36, zz * 1.252);
  box(0.5, 0.24, 0.014, M.glass, 2.1, 3.36, zz * 1.256);
  // îmbinări ușă, mâner, mâner vertical
  box(0.012, 2.05, 0.006, M.hole, 2.94, 2.3, zz * 1.253);
  box(0.9, 0.012, 0.006, M.hole, 3.4, 1.28, zz * 1.253);
  box(0.18, 0.045, 0.02, M.blackGloss, 3.08, 2.55, zz * 1.258);
  box(0.035, 0.75, 0.035, M.chrome, 2.86, 2.4, zz * 1.27);
  // extensia cabinei
  box(0.28, 2.4, 0.03, M.paint, 1.6, 2.45, zz * 1.255);
  // oglinzi
  box(0.42, 0.045, 0.045, M.blackGloss, 4.04, 3.15, zz * 1.42, 0, zz * 0.5, 0);
  rbox(0.13, 0.64, 0.27, 0.04, M.blackGloss, 4.16, 2.96, zz * 1.62);
  rbox(0.12, 0.22, 0.22, 0.04, M.blackGloss, 4.15, 2.5, zz * 1.58);
  box(0.01, 0.56, 0.22, M.chrome, 4.09, 2.96, zz * 1.62);
  // trepte în spatele roții din față
  box(0.55, 0.62, 0.1, M.plastic, 2.72, 0.83, zz * 1.07);
  box(0.52, 0.04, 0.22, M.tread, 2.72, 1.0, zz * 1.06);
  box(0.52, 0.04, 0.2, M.tread, 2.72, 0.62, zz * 1.05);
  // aripa roții din față
  const fg = new THREE.CylinderGeometry(0.63, 0.63, 0.42, 48, 1, true, Math.PI - Math.PI * 0.425, Math.PI * 0.85);
  add(fg, M.plastic, 3.45, 0.54, zz * 1.06, Math.PI / 2, 0, 0).material.side = THREE.DoubleSide;
  // rezervor aluminiu cu chingi
  if (zz === 1) {
    add(new THREE.CylinderGeometry(0.3, 0.3, 1.1, 48), M.alu, 1.65, 0.72, 0.98, 0, 0, Math.PI / 2);
    for (const xx of [1.35, 1.95]) add(new THREE.CylinderGeometry(0.305, 0.305, 0.05, 48), M.plastic, xx, 0.72, 0.98, 0, 0, Math.PI / 2);
  }
}
// inscripția discretă de pe ușă
const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.128), new THREE.MeshBasicMaterial({ map: decalTexture("MĂRFURI.RO"), transparent: true }));
decal.position.set(3.42, 2.08, 1.258);
scene.add(decal);
// față: grilă mare sub parbriz, cu ramă și lamele cromate
box(0.04, 0.92, 1.9, M.blackGloss, 4.055, 2.08, 0);
box(0.03, 0.035, 1.96, M.chrome, 4.08, 2.55, 0);
box(0.03, 0.035, 1.96, M.chrome, 4.08, 1.61, 0);
for (let i = 0; i < 8; i++) box(0.02, 0.02, 1.84, M.chrome, 4.08, 1.7 + i * 0.105, 0);
box(0.025, 0.09, 1.2, M.chrome, 4.085, 2.08, 0);
// faruri integrate în colțurile barei, cu lentilă și LED de zi
for (const zz of [1, -1]) {
  rbox(0.14, 0.24, 0.64, 0.05, M.blackGloss, 4.03, 1.38, zz * 0.9);
  box(0.02, 0.15, 0.2, M.lamp, 4.105, 1.39, zz * 1.04);
  box(0.02, 0.15, 0.22, M.lens, 4.105, 1.39, zz * 0.8);
  box(0.02, 0.03, 0.56, M.lamp, 4.105, 1.27, zz * 0.9);
  box(0.02, 0.045, 0.12, M.amber, 4.1, 1.49, zz * 1.12);
}
rbox(0.34, 0.36, 2.56, 0.08, M.paint, 3.97, 1.42, 0);
rbox(0.36, 0.3, 2.58, 0.06, M.plastic, 3.99, 1.1, 0);
for (const zz of [1, -1]) add(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 24), M.lamp, 4.155, 1.08, zz * 0.98, 0, 0, Math.PI / 2);
box(0.25, 0.08, 2.3, M.plastic, 4.0, 0.88, 0);
// lămpi de gabarit pe acoperiș
for (const zz of [-1.05, 1.05]) box(0.08, 0.04, 0.1, M.amber, 3.9, 3.845, zz);
// roțile din față
wheel(3.45, 1.08, 0.32, 1);
wheel(3.45, -1.08, 0.32, -1);

// ---------- cameră și randare
const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 200);
camera.position.set(...CAM);
camera.lookAt(...LOOK);
renderer.render(scene, camera);
renderer.render(scene, camera);
window.__done = true;
