- [x] clean up plant selection styles a bit

- [x] switch from tabs, to panels
- [x] hide panels when not active
    - [x] bed
        - [x] get rid of create button
    - [x] plant
    - [x] object

- [ ] on plant selection, populate panel
    - [x] when plant selected, emit something
    - [x] set name
    - [ ] set size
    - [ ] what else?

- [ ] remove redundant shit from object panel

- [ ] draw state diagram and figure out states
- [ ] re-think our object system
    - selectables
        - beds
        - plants
        - objects
    - non-selectables
        - ground
        - handles
        - visualizers

- [ ] clean up code

#### OBJECT EDITOR
- [ ] swap between meters and inches on ui panel
- [ ] draw a fence
- [ ] create a ruler object
- [ ] controls specific features of geometry in UI panel
    - [ ] figure out a way to set the editable features from UI. Use proxies?
    - [ ] specify radius in inches/ft/meters for sphere
    - [ ] specify radius/height for cylinder

#### Feedback
- [ ] rotation in simple transform mode (use Q/E to snap 90 degrees)
- [ ] jump to selected object in scene w/ double click
- [ ] type to set length of line in pen mode
- [ ] esc to reset line
- [ ] put a crosshair at bed editor path start to make closing easier
- [ ] draw angle on completed line segments
- [ ] shift+click to select multiple
- [ ] fix polygon drawing bug
- [ ] bug with clicking on line segments
- [ ] let user set rotation from typing?
- [ ] allow user to group things and edit the group

#### Measurement Tools
- [ ] placeable ruler
- [ ] pen tool for area calculation
- [ ] draw pointer to north as rotating UI element

#### Visual Improvements

##### Textures
https://gamedevnexus.com/resources/assets/
- [ ] dirt
- [ ] stone
- [ ] wood
- [ ] chain link

- [ ] grass
https://codesandbox.io/p/sandbox/grass-shader-forked-okub75?file=%2Fsrc%2FGrass.js
https://smythdesign.com/blog/stylized-grass-webgl/
- [ ] sky view

- [ ] add a 5'10 human model to the world

Write up about 
- design philosophy
- event flow/propagation
- modularity
- what else?

# Garden Design Utilities
- [ ] panel UI with pre-built models for drag and drop
- [ ] load mesh resources, create thumbnails for them

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
    
## DATA AND STUFF
- [ ] in-browser sqlite engine for plants and stuff
- [ ] allow users to create their own plants

- [ ] complete web client

## REFACTORING
- [ ] try refactor bed editor to use scene graph better

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