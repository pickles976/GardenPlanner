Layers 
NO_RAYCAST // not raycastable
WORLD // raycastable but not selectable
OBJECTS // raycast + selectable 
VERTEX // raycastable only in line editor mode
PLANT // like object but with different properties

#### RULER
- [x] make ruler not a separate object, but just something that can be placed instantly
    - [x] click + shift - place point (p1, p2)
    - [x] shift release, clear ruler state

- [ ] Refactor ruler
    - [ ] add ruler sub-object to editor
- [ ] refactor event handlers to live in editor where it makes sense

# BUGS
- [ ] bug with path placement
- [ ] bug with fence placement 
- [ ] bug where bed is not visible immediately after placement

### REFACTOR!!!
- [ ] rename editors to have similar methods
- [ ] make props a typed object!!!
- [ ] come up with conventions for importing stuff from three (always use THREE.Object instead of `import { Object } from "three"`)

# Garden Design Utilities
- [ ] panel UI with pre-built models for drag and drop
    - [ ] create a panel for 3D models the same way we have for plants

#### Erika Feedback
Have Erika plan a garden

#### Visual Improvements

- [ ] draw pointer to north as rotating UI element

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

- [ ] grass
https://codesandbox.io/p/sandbox/grass-shader-forked-okub75?file=%2Fsrc%2FGrass.js
https://smythdesign.com/blog/stylized-grass-webgl/
- [ ] sky view

- [ ] add a 5'10 human model to the world

## SUN CONTROLS
- [ ] lat/lon entry
- [ ] absolute time entry
- [ ] suncalc
- [ ] position sun based on time
- [ ] ~~steal~~ copy shademap timeline widget

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

# BUGS
- [ ] bed panel does not hide when bed is deselected from scene panel

# REFACTOR

Write up about 
- design philosophy
- event flow/propagation
- modularity
- what else?

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