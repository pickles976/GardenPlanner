# Stuff

https://www.suncalc.org/#/30.3402,-97.7628,3/2025.06.30/18:31/1/3

https://thebookofshaders.com/01/
https://learnopengl.com/Getting-started/Shaders

https://pictogrammers.com/library/mdi/

[Rust: sun or astro-rust](https://github.com/mourner/suncalc)
[Three.js editor](https://github.com/mrdoob/three.js/tree/master/editor)
[Transform Controls](https://threejs.org/docs/#examples/en/controls/TransformControls)
[Mitt](https://www.npmjs.com/package/mitt)

## Mesh Generation
https://github.com/Tencent-Hunyuan/Hunyuan3D-2

For GPU with less than 16GB VRAM:
https://github.com/cocktailpeanut/Hunyuan3D-2GP
How to fix missing GLIBC bug
https://askubuntu.com/questions/1418016/glibcxx-3-4-30-not-found-in-conda-environment
```
conda update libstdcxx-ng
ln -sf /usr/lib/x86_64-linux-gnu/libstdc++.so.6 ${CONDA_PREFIX}/lib
```

```
conda activate Hunyuan3D-2GP
python gradio_app.py --profile 5
```

Blender decimate geometry
https://github.com/wjakob/instant-meshes

Removing anti-aliasing
https://discourse.threejs.org/t/reducing-moire-effect-on-certain-angles/11037/7

WebGL
https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram


- timeline?
- animations?

### Grass Displacement Shader

1. Ortho camera looking up from under the ground
2. Render to depth texture
3. Load depth texture into grass vertexShader
4. Use depth to set grass height

# Deployment Steps

1. Clone
2. `npm run build`

# Event Propagation

![](./event_propagation.drawio.png)

Events are filtered down from the window to editors and sidebars. The events are passed down to different sub-handlers based on the mode that editors are in.

`main.ts`
```typescript
window.addEventListener('keydown', (event) => handleKeyDown(event, editor, sidebar, menubar));
window.addEventListener('keyup', (event) => handleKeyUp(event, editor, sidebar, menubar));

editor.canvas.addEventListener('mousemove', (event) => handleMouseMove(event, editor));
editor.canvas.addEventListener('mouseout', (event) => handleMouseMove(event, editor));
editor.canvas.addEventListener('mouseleave', (event) => handleMouseMove(event, editor));
editor.canvas.addEventListener('mousedown', (event) => handleMouseClick(event, editor));
```

`EventHandlers.ts`
```typescript
export function handleKeyDown(event, editor: Editor, sidebar: Sidebar, menuBar: Menubar) {
    menuBar.handleKeyDown(event)
    sidebar.handleKeyDown(event)
    editor.handleKeyDown(event)
}
```