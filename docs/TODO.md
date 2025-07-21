# User Feedback
- [x] add buttons to switch transform modes in object properties panel

- [ ] should be able to click on the length and angle text to edit  it
- [ ] line segment angle should be from north or Y+
- [ ] edit vertices at the current location of the bed/fence/path object

# Improvements
- [ ] create an instruction popup
    - [ ] press "m" to move objects
    - [ ] shift + click to place down rulers
    - [ ] change transform modes (R, T, S)
    - [ ] g to show/hide grass
    - [ ] esc to cancel editor
    - [ ] CTRL + Z
    - [ ] SHIFT + D

- [ ] metric switching bug
- [ ] bug when cancelling

- [ ] allow users to edit colors of existing objects

# Models and Performance
- [ ] compass redux
- [ ] get plant generation from text working
- [ ] generate more plants

# Sun Timeline
- [ ] create sun slider

# Garden Design Utilities
- [ ] panel UI with pre-built models for drag and drop
    - [ ] create a panel for 3D models the same way we have for plants

## DONT WANNA KEEP WORKING ON THIS IF NOBODY FINDS IT USEFUL

# Annoying shit
- [ ] snapping is bad, how should I snap (idk what to do about this)
- [ ] dont exit out of menubar tabs when the mouse leaves
- [ ] scale the UI based on screen size

# Multiple-Selection and Groups
- [ ] create group-editing workflow?
    - [ ] select multiple
    - [ ] add multiple objects to the group
    - [ ] move the entire group
    - [ ] remove objects from the group when done

# REFACTOR
- [ ] improve the logic for CTRL + Z command pattern in the vertex editing mode of the line editor
- [ ] serialize commands? https://github.com/mrdoob/three.js/blob/dev/editor/js/commands/SetPositionCommand.js#L72
- [ ] clean up serialization logic
- [ ] look for patterns
- [ ] add help bar back in

### Grass Shader Improvements
- [ ] add directional lighting to grass shader
- [ ] read about shaders, get grass shader working three js
- [ ] apply different colors to grass with perlin noise
- [ ] configure params until this feels right

# More Plants
- [ ] revisit plant model pipeline
    - [ ] find photographers locally
- [ ] create more plants
- [ ] searchable plants

# Plant Growth Timeline
- [ ] select planting date
- [ ] create a list with time, height, and radius entries
- [ ] enter height and radius at different time points
- [ ] animate plant according to different time points

# Further features
- [ ] user login backend
- [ ] garden concept browser?
- [ ] batch processing for sun location
- [ ] save and load from browser
- [ ] save a preview image from the canvas

## DATA AND STUFF
- [ ] in-browser sqlite engine for plants and stuff
- [ ] allow users to create their own plants

## Optimization

