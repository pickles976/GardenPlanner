import { Editor } from './Editor';

let renderRequested = false;

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
    renderRequested = false;

    editor.currentCameraControls.update()

    // fix buffer size
    if (resizeRendererToDisplaySize(editor.renderer)) {
        const canvas = editor.renderer.domElement;
        editor.currentCamera.aspect = canvas.clientWidth / canvas.clientHeight;
        editor.currentCamera.updateProjectionMatrix();
    }

    // fix aspect ratio
    const canvas = editor.renderer.domElement;
    editor.currentCamera.aspect = canvas.clientWidth / canvas.clientHeight;
    editor.currentCamera.updateProjectionMatrix();

    editor.renderer.render(editor.scene, editor.currentCamera);
}

export function requestRenderIfNotRequested(editor: Editor) {
  if (!renderRequested) {
    renderRequested = true;
    requestAnimationFrame(() => render(editor));
  }
}
