import * as THREE from "three"
import { DEPTH_MAP_SIZE } from './Constants';
import { Editor } from './Editor';
import { grassMaterial } from './Grass';
import { eventBus, EventEnums } from "./EventBus";

const clock = new THREE.Clock();

// Render target for depth texture
const depthRenderTarget = new THREE.WebGLRenderTarget(
  DEPTH_MAP_SIZE,
  DEPTH_MAP_SIZE,
  {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat, // Color texture format
    type: THREE.UnsignedByteType // Color texture type
  }
);

depthRenderTarget.depthTexture = new THREE.DepthTexture(
    DEPTH_MAP_SIZE,
    DEPTH_MAP_SIZE,
    THREE.UnsignedIntType, // Type for depth values (e.g., UnsignedIntType or UnsignedShortType)
    THREE.UVMapping, // Mapping
    3, // Wrap S
    3, // Wrap T
    THREE.NearestFilter, // Mag filter
    THREE.NearestFilter, // Min filter
    1, // Anisotropy
    THREE.DepthFormat // Format for depth texture
);

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

  // TODO: only render the depth buffer if stuff is moved/changed

  // Render to depth texture
  editor.renderer.setRenderTarget( depthRenderTarget );
  editor.renderer.render(editor.scene, editor.depthCamera);
  editor.renderer.setRenderTarget(null);

  // Render the Scene
  grassMaterial.uniforms.time.value = clock.getElapsedTime();
  grassMaterial.uniforms.depthTexture.value = depthRenderTarget.depthTexture;
  grassMaterial.uniformsNeedUpdate = true;

  // NORMAL RENDER
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


  eventBus.emit(EventEnums.FRAME_UPDATED)

  requestAnimationFrame(() => render(editor));

}
