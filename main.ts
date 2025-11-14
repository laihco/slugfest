import * as THREE from "https://esm.sh/three@0.172.0";
import { OrbitControls } from "https://esm.sh/three@0.172.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://esm.sh/three@0.172.0/examples/jsm/loaders/GLTFLoader.js";

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
camera.position.set(3, 3, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);
globalThis.document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
dirLight.position.set(5, 8, 4);
scene.add(dirLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Load Blender model
let model: THREE.Object3D; // Declare outside loader so animate() can access it
const loader = new GLTFLoader();
loader.load(
  "./assets/models/TestModel.glb",
  (gltf) => {
    model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.set(0, -3, 0);
    scene.add(model);
  },
  (xhr) => {
    console.log(`Model ${(xhr.loaded / xhr.total * 100).toFixed(1)}% loaded`);
  },
  (error) => {
    console.error("Error loading model:", error);
  }
);

// Animation loop
function animate() {
  globalThis.requestAnimationFrame(animate);

  // Rotate the model if it's loaded
  if (model) {
    model.rotation.y += 0.01; // Rotate around Y axis
    // Optional: rotate around X or Z
    // model.rotation.x += 0.005;
    // model.rotation.z += 0.005;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();


// Resize
globalThis.addEventListener("resize", () => {
  camera.aspect = globalThis.innerWidth / globalThis.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);
});

