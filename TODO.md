# Coordinate bullshit
- [x] fix bed
- [x] fix path
- [x] fix fence
- [x] sun angle
- [x] fix rotation bug
- [x] fix issue with top-down camera not rotating

## SUN CONTROLS
- [x] add function to editor to set azimuth/elevation relative to north
- [x] update render call to animate the sun
- [x] set sun position sun based on time
- [x] set directional lighting based on time
- [x] set light intensity/color based on time
- [x] add directional and ambient lighting to the grass

- [x] add function to editor to set north
- [x] import suncalc
- [x] add sun control panel
- [x] set lat, lon
- [x] get timezone from lat/lon
- [x] set date and time
- [x] update sun position from widget

- [x] need to redo the entire coordinate system

- [ ] set north from angle
- [ ] draw pointer to north UI object

- [ ] ~~steal~~ copy shademap timeline widget

### Grass Shader Improvements
- [ ] grass occlusion
- [ ] add directional lighting to grass shader
- [ ] read about shaders, get grass shader working three js
- [ ] depth masking for grass three js
- [ ] apply different colors to grass with perlin noise
- [ ] add perlin noise to grass displacement

- [ ] configure params until this feels right

#### Visual Improvements
- [ ] fence UVs causing texture issues
- [ ] if shadows disabled, chain link fense. Shadows enabled, picket.
- [ ] switch to a textured grid
https://bgolus.medium.com/the-best-darn-grid-shader-yet-727f9278b9d8

# QOL
- [ ] draw angle between lines, not angle between north for line editor
- [ ] allow user to edit each vertex from the UI in vertex edit mode
- [ ] ESC = cancel for line editor/object editor modes
- [ ] show all objects when bed editing

- [ ] let user hide objects from object panel

- [ ] draw pointer to north as rotating UI element

## SAVING
- [ ] saving configurations as json
    - [ ] autosave feature
    - [ ] load from web storage
    - [ ] export to json
    - [ ] load from json
    - [ ] save a preview image from the canvas

# BUGS
- [ ] bed panel does not hide when bed is deselected from scene panel
- [ ] fix bug where path props are not being populated properly
- [ ] bug when editing fence

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

## MORE UTILITIES

# Garden Design Utilities
- [ ] panel UI with pre-built models for drag and drop
    - [ ] create a panel for 3D models the same way we have for plants

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

