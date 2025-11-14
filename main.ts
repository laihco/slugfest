import * as THREE from "https://esm.sh/three@0.172.0";
import { OrbitControls } from "https://esm.sh/three@0.172.0/examples/jsm/controls/OrbitControls.js";

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  globalThis.innerWidth / globalThis.innerHeight,
  0.1,
  1000,
);
camera.position.set(3, 2, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);
globalThis.document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
dirLight.position.set(5, 8, 4);
scene.add(dirLight);

// Cube
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff8800 }),
);
scene.add(box);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Resize
globalThis.addEventListener("resize", () => {
  camera.aspect = globalThis.innerWidth / globalThis.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);
});

// Animation
function animate() {
  globalThis.requestAnimationFrame(animate);
  box.rotation.y += 0.01;
  controls.update();
  renderer.render(scene, camera);
}

animate();
