import * as THREE from "https://esm.sh/three@0.172.0";
import { OrbitControls } from "https://esm.sh/three@0.172.0/examples/jsm/controls/OrbitControls.js";

export class Scene3_MilkToss {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;

  constructor(private renderer: THREE.WebGLRenderer) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x331144);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      innerWidth / innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(3, 3, 5);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Cube
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    this.scene.add(cube);

    // Lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 5, 5);
    this.scene.add(dir);
  }

  update(_delta: number) {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
