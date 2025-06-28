#### Visual Improvements

- [x] sky view
- [x] grass
https://codesandbox.io/p/sandbox/grass-shader-forked-okub75?file=%2Fsrc%2FGrass.js
https://smythdesign.com/blog/stylized-grass-webgl/
https://freepbr.com/product/stylized-grass1/
https://marmoset.co/posts/basic-theory-of-physically-based-rendering/

- [ ] disable render-on-demand
- [ ] show/hide grass


- [ ] add FXAA pass to anti-alias grids

```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
composer.addPass(fxaaPass);

// Then use composer.render() instead of renderer.render()
```

##### Textures
https://gamedevnexus.com/resources/assets/
- [ ] dirt
- [ ] mulch
- [ ] stone
- [ ] wood
- [ ] chain link
- [ ] add ability to set textures for 3D models from object panels

- [ ] add texture configuration
    - [ ] bed/bed border
    - [ ] path
    - [ ] fence

- [ ] add a 5'10 human model to the world

# Garden Design Utilities
- [ ] panel UI with pre-built models for drag and drop
    - [ ] create a panel for 3D models the same way we have for plants
- [ ] draw angle between lines, not angle between north for line editor

## SUN CONTROLS
- [ ] lat/lon entry
- [ ] absolute time entry
- [ ] suncalc
- [ ] position sun based on time
- [ ] ~~steal~~ copy shademap timeline widget
- [ ] set north from angle

## SAVING
- [ ] saving configurations as json
    - [ ] autosave feature
    - [ ] load from web storage
    - [ ] export to json
    - [ ] load from json
    - [ ] save a preview image from the canvas

#### GROUPS
- [ ] create group-editing workflow?
    - [ ] create a group
    - [ ] add multiple objects to the group
    - [ ] move the entire group
    - [ ] remove objects from the group

## PLANT EDITOR KEYFRAMING
- [ ] set height and radius
- [ ] enter height and radius at different time points
- [ ] animate plant according to different time points
    
## DATA AND STUFF
- [ ] in-browser sqlite engine for plants and stuff
- [ ] allow users to create their own plants

- [ ] complete web client

# QOL
- [ ] draw pointer to north as rotating UI element
- [ ] let user hide objects from object panel
- [ ] in line editor mode, draw all other objects as lines?
- [ ] ESC = cancel for line editor/object editor modes
- [ ] allow user to edit each vertex from the UI in vertex edit mode
- [ ] fix issue with ctrl + d


# BUGS
- [ ] bed panel does not hide when bed is deselected from scene panel

# Fuzz Testing

# REFACTOR

Write up about 
- [x] event flow/propagation
- [ ] design philosophy
- [ ] modularity

MVP finished!

## USER FEEDBACK
- [ ] friends and family
- [ ] community gardens network in Austin
- [ ] r/austingardens


- [ ] user login backend
- [ ] garden concept browser?
- [ ] batch processing for sun location
- [ ] payment system and stuff
- [ ] texture ground with satellite view from google?

## Optimization
- [ ] isntancing
- [ ] ???

# HELP FOR USERS
- [ ] press "m" to move objects
- [ ] shift + click to place down rulers
- [ ] change transform modes (R, T, S)
