import * as THREE from "three";
import { ARButton } from "./ARButton.js";

document.addEventListener("DOMContentLoaded", () => {
  const initialize = async () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const gl = canvas.getContext("webgl", { xrCompatible: true });
    // 基本场景搭建
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    camera.matrixAutoUpdate = false;
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    // 圆环
    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(
      -Math.PI / 2
    );
    const reticleMaterial = new THREE.MeshBasicMaterial();
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      canvas: canvas,
      context: gl,
    });
    renderer.autoClear = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    // ARButton
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: canvas.parentElement },
    });
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(arButton);

    const controller = renderer.xr.getController(0); // 0 refers to the first touching point on the screen.
    scene.add(controller);
    controller.addEventListener("select", () => {
      // 建盒
      const boxGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
      const boxMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff * Math.random(),
      });
      const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
      boxMesh.position.setFromMatrixPosition(reticle.matrix);
      boxMesh.scale.y = Math.random() * 5 + 1;
      scene.add(boxMesh);
    });

    renderer.xr.addEventListener("sessionstart", async () => {
      const session = renderer.xr.getSession();

      const viewerReferenceSpace = await session.requestReferenceSpace(
        "viewer"
      );
      const hitTestSource = await session.requestHitTestSource({
        space: viewerReferenceSpace,
      });

      renderer.setAnimationLoop((timestamp, frame) => {
        if (!frame) return;

        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const referenceSpace = renderer.xr.getReferenceSpace(); // original local space
          const hitPose = hit.getPose(referenceSpace);

          reticle.visible = true;
          reticle.matrix.fromArray(hitPose.transform.matrix);
        } else {
          reticle.visible = false;
        }
        renderer.render(scene, camera);
      });
    });
    renderer.xr.addEventListener("sessionend", async () => {
      console.log("session end");
    });
  };
  initialize();
});
