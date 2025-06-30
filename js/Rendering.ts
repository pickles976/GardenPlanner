import * as THREE from "three"
import { FRUSTUM_SIZE } from './Constants';
import { Editor } from './Editor';
import { grassMaterial } from './Grass';

const clock = new THREE.Clock();

let elevation = 0;
let azimuth = 0;

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

export async function render(editor: Editor) {

  grassMaterial.uniforms.time.value = clock.getElapsedTime();
  grassMaterial.uniformsNeedUpdate = true;

  editor.currentCameraControls.update()

  // fix buffer size
  if (resizeRendererToDisplaySize(editor.renderer) || resizeRendererToDisplaySize(editor.labelRenderer)) {
      const canvas = editor.renderer.domElement;
      const aspect = canvas.clientWidth / canvas.clientHeight;
      editor.currentCamera.aspect = aspect;

      // TODO: handle resize orthographic caemra
      // if (editor.currentCamera) {
      //   editor.currentCamera.left = FRUSTUM_SIZE * aspect / -2;
      //   editor.currentCamera.right = FRUSTUM_SIZE * aspect / 2;
      // }
      editor.currentCamera.updateProjectionMatrix();
  }

  // fix aspect ratio
  const canvas = editor.renderer.domElement;
  editor.currentCamera.aspect = canvas.clientWidth / canvas.clientHeight;
  editor.currentCamera.updateProjectionMatrix();

  editor.renderer.render(editor.scene, editor.currentCamera);
  editor.labelRenderer.render(editor.scene, editor.currentCamera);

//   elevation += 0.2;
//   azimuth += 0.1
  // editor.setSunPosition(-135, 10);

  requestAnimationFrame(() => render(editor));

}
