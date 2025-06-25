#### Improvements
- [ ] radius/height in object panel
    - [ ] get size of box from geometry and save as userData
    - [ ] use this + scale to figure out the actual size of the model
    - [ ] figure out a way to get this controllable from the UI
    - [ ] specify radius in inches/ft/meters for sphere
    - [ ] specify radius/height for cylinder

- [ ] drawing utilities
    - [ ] create a ruler object
    - [ ] fence drawing utility
    - [ ] path drawing utility?

- [ ] Bed editor improvements
    - [ ] type to set length of line in pen mode (Bed Editor)
    - [ ] esc to reset line
    - [ ] put a crosshair at bed editor path start to make closing easier
    - [ ] draw angle on completed line segments
    - [ ] bug with clicking on line segments

- [ ] create group-editing workflow?
    - [ ] create a group
    - [ ] add multiple objects to the group
    - [ ] move the entire group
    - [ ] remove objects from the group

#### Visual Improvements

- [ ] draw pointer to north as rotating UI element

##### Textures
https://gamedevnexus.com/resources/assets/
- [ ] dirt
- [ ] mulch
- [ ] stone
- [ ] wood
- [ ] chain link

- [ ] grass
https://codesandbox.io/p/sandbox/grass-shader-forked-okub75?file=%2Fsrc%2FGrass.js
https://smythdesign.com/blog/stylized-grass-webgl/
- [ ] sky view

- [ ] add a 5'10 human model to the world

# Garden Design Utilities
- [ ] panel UI with pre-built models for drag and drop
    - [ ] create a panel for 3D models the same way we have for plants
- [ ] add ability to set textures for 3D models from object panels

## SUN CONTROLS
- [ ] lat/lon entry
- [ ] absolute time entry
- [ ] suncalc
- [ ] position sun based on time
- [ ] ~~steal~~ copy shademap timeline widget

## SAVING
- [ ] saving configurations as json
    - [ ] autosave feature
    - [ ] export
    - [ ] load

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


#### Erika Feedback
Have Erika plan a garden

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