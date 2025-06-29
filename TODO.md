#### Visual Improvements

- [ ] fence UVs causing texture issues
- [ ] if shadows disabled, chain link fense. Shadows enabled, picket.
- [ ] add axes helper to grid!

## SUN CONTROLS
- [ ] add function to editor to set north
- [ ] add function to editor to set azimuth/elevation relative to north
- [ ] update render call to animate the sun

- [ ] set sun position sun based on time
- [ ] set directional lighting based on time
- [ ] set light intensity/color based on time

- [ ] configure params until this feels right

- [ ] lat/lon entry
- [ ] absolute time entry
    - [ ] year
    - [ ] month
    - [ ] date
    - [ ] time
- [ ] convert to UTC time

- [ ] suncalc

- [ ] ~~steal~~ copy shademap timeline widget
- [ ] set north from angle

# QOL
- [ ] hide grass in top-down view (make grass its own layer!)
- [ ] add show/hide grass to view menubar 
- [ ] perform raycasts to figure out where to place grass

- [ ] draw angle between lines, not angle between north for line editor
- [ ] allow user to edit each vertex from the UI in vertex edit mode
- [ ] ESC = cancel for line editor/object editor modes
- [ ] show all objects when bed editing

- [ ] let user hide objects from object panel

- [ ] draw pointer to north as rotating UI element
- [ ] fix issue with ctrl + d

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

