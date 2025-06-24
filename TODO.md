
#### Refactor Object Panel
- [x] only render editors for the enabled fields on the model
userData:
```json
{
    "editableFields": {
        "position": true,
        "rotation": true,
        "name": true
    }
}
```
- [x] change UI panel position to use ft/meters

#### Plant Configuration

- [x] add radius and height for cylinder
    - [x] radius
    - [x] set radius
    - [x] height
    - [x] set height

- [x] nfix bug where being in non-metric causes us to be unable to set scale and rotation
- [x] switch between ft and meters radius and height

- [ ] sphere controls

- [ ] on plant selection, populate panel
    - [x] when plant selected, emit something
    - [x] set name
    - [ ] set height
    - [ ] set radius
    - [ ] what else?

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
- [ ] add ability to add plane
- [ ] create a ruler object
- [ ] fence drawing utility

#### Erika Feedback


#### Improvements
- [ ] rotation in simple transform mode (use Q/E to snap 90 degrees)
- [ ] jump to selected object in scene w/ double click
- [ ] draw pointer to north as rotating UI element
- [ ] controls specific features of geometry in UI panel
    - [ ] figure out a way to set the editable features from UI. Use proxies?
    - [ ] specify radius in inches/ft/meters for sphere
    - [ ] specify radius/height for cylinder

- [ ] type to set length of line in pen mode (Bed Editor)
- [ ] esc to reset line
- [ ] put a crosshair at bed editor path start to make closing easier
- [ ] draw angle on completed line segments
- [ ] fix polygon drawing bug
- [ ] bug with clicking on line segments

- [ ] create group-editing workflow?
    - [ ] create a group
    - [ ] add multiple objects to the group
    - [ ] move the entire group
    - [ ] remove objects from the group

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
    - [ ] create a panel for 3D models the same way we have for plants

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