## SAVING
- [ ] saving configurations as json
    - [ ] try to serialize and de-serialize a scene
        - [x] ignore grass
        - [x] export to json
        - [x] load from json
        - [x] get this working
    - [x] config object
        - [x] metric system
        - [x] lat/lon
        - [x] time
    - [x] update grid helper
    - [x] update sun ui

    - [x] rotation is broken
    - [x] get `onSelect` and `onDeselect` working with serialization 
        - [x] vertices not saving properly
    - [ ] panel UI broken

    - [ ] save to web storage
    - [ ] load from web storage
        - [ ] create web storage browser widget
        - [ ] save a preview image from the canvas

    - [ ] get "new" button working
    - [ ] hide "import" button
    - [ ] get "clone" and "delete" menu buttons working
    - [ ] hide "center" and "redo" buttons

    - [ ] enable autosave
        - [ ] save the scene by default to storage
    
    - [ ] clean up help bar

# Plants
- [ ] get plant generation from text working

# Sun Timeline
- [ ] get source code from suncalc website

MVP finished!
- [ ] deploy
- [ ] digitalocean

## USER FEEDBACK
- [ ] friends and family
- [ ] community gardens network in Austin
- [ ] r/austingardens

## MORE UTILITIES

# Performance
- [x] get a more performant anime girl model
- [ ] downscale plant textures

# REFACTOR
Write up about 
- [x] event flow/propagation
- [ ] design philosophy
- [ ] modularity
- [ ] improve the logic for CTRL + Z command pattern in the vertex editing mode of the line editor
- [ ] serialize commands? https://github.com/mrdoob/three.js/blob/dev/editor/js/commands/SetPositionCommand.js#L72


### Grass Shader Improvements
- [x] grass occlusion
- [ ] add directional lighting to grass shader
- [ ] read about shaders, get grass shader working three js
- [ ] apply different colors to grass with perlin noise
- [ ] configure params until this feels right

# More Plants
- [ ] revisit plant model pipeline
    - [ ] find photographers locally
- [ ] create more plants

# Garden Design Utilities
- [ ] panel UI with pre-built models for drag and drop
    - [ ] create a panel for 3D models the same way we have for plants

#### GROUPS
- [ ] create group-editing workflow?
    - [ ] select multiple
    - [ ] add multiple objects to the group
    - [ ] move the entire group
    - [ ] remove objects from the group when done

## PLANT EDITOR KEYFRAMING
- [ ] set height and radius
- [ ] enter height and radius at different time points
- [ ] animate plant according to different time points

- [ ] ~~steal~~ copy shademap timeline widget??

- [ ] complete web client

# Further features
- [ ] user login backend
- [ ] garden concept browser?
- [ ] batch processing for sun location
- [ ] payment system and stuff

## DATA AND STUFF
- [ ] in-browser sqlite engine for plants and stuff
- [ ] allow users to create their own plants

## Optimization

# HELP FOR USERS
- [ ] press "m" to move objects
- [ ] shift + click to place down rulers
- [ ] change transform modes (R, T, S)
- [ ] g to show/hide grass
- [ ] esc to cancel editor

