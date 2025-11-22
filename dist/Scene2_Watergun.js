import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
export class Scene2_Watergun {
    constructor(renderer) {
        this.renderer = renderer;
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x113355);
        // Camera
        this.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
        this.camera.position.set(6, 4, 8);
        this.camera.lookAt(0, 2, 0);
        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 2, 0);
        this.controls.update();
        // Lights
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dir = new THREE.DirectionalLight(0xffffff, 1);
        dir.position.set(5, 10, 5);
        dir.castShadow = true;
        this.scene.add(dir);
        // Load the Blender stand
        this.loadWatergunStand("/assets/models/WatergunStand.glb");
    }
    loadWatergunStand(path) {
        const loader = new GLTFLoader();
        loader.load(path, (gltf) => {
            const model = gltf.scene;
            this.stand = model;
            model.position.set(0, 0, 0);
            model.scale.setScalar(1);
            model.traverse((child) => {
                if (child.isMesh) {
                    const mesh = child;
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                }
            });
            this.scene.add(model);
            console.log("Watergun stand loaded");
        }, undefined, (err) => {
            console.error("Error loading WatergunStand.glb:", err);
        });
    }
    update(_delta) {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
