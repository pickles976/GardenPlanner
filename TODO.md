## EDITING FEATURES:

### Rendering and UI
- [x] basic 3D rendering scene
- [x] shadows
- [x] typescript
- [x] render on demand
- [x] allow moving cube
    - [x] select and deselect
    - [x] drag
    - [x] rotate
    - [x] scale
- [x] debug shadowmap
- [x] add commands 
    - [x] rotation
    - [x] scaling
- [x] add message bus
- [x] add UI for transform controls
    - [x] create UI (copy from editor)
    - [x] add UI that shows property of currently selected item
    - [x] add UI for viewing and selecting items from scene heirarchy like in editor program
    - [x] create sliders
    - [x] connect signals to editor
    - [x] why aren't the names of objects populating the scene heirarchy?
    - [x] disable raycasting stuff when mouse is over editor panel
    - [x] create command for adding/removing objects that goes through the editor class
    - [x] track objects? (how do we wanna do this?)
    - [x] add ability to select items from the scene panel
    - [x] refactor selector
    - [x] disable deselct when camera pan w/ right mouse
    - [x] configure 2-way binding between editor panel and object
    - [x] configure non-janky undo for actions initiated from UI controls
    - [x] selecting object should update scene panel selection
    - [x] filter certain things out of the scene panel view
    - [x] only include selectable items



- [x] reset transform controls when objects are deleted

#### BED EDITOR

- [x] add UI for bed creation
    - [x] panel with button
    - [x] change cursor
    - [x] place bed vertices
    - [x] draw polyline
    - [x] split out bedEditor

- [x] add Layers
- [x] update raycast layers based off of editor mode

- [x] disable raycasting on axes helper
- [x] allow drag and moving of vertices

- [x] clone three js editor repo to study code

- [x] close the loop
- [x] create a mesh geometry from the loop
- [ ] draw distance and angle of current mouse position
    - [x] text-drawing utility
    - [x] draw text over lines
    - [x] leave text on the ground
    - [x] clean up a bit
        - [x] make re-rendering a single function call
        - [x] make it stateless
        - [x] add a cleanup function
- [x] make lines easier to see

- [x] add isometric camera
- [x] swap cameras when going to vertex mode
- [x] swap back when done with orbit controls
- [x] top-down
- [x] WASD controls
- [ ] draw north in vertex mode

### Multiple Bed Editor Stages

#### Vertex Place Mode
- [x] create bed editing mode enums
- [x] undo place vertices
    - [x] this is gonna require statefulness which breaks some assumptions about our current thingy
- [x] add a dedicated command stack for the bed editor
- [x] update line preview when CTRL+Z


#### vertex edit mode
- [x] highlight vertices on mouse over
- [x] get vertex handles working
    - [x] movement with mouse
    - [x] update line segments when vertices are updated (redraw each frame?)
        - [x] stop using vertices, start using the vertex handles
        - [x] write a function to draw the line segments given the vertex handle locations
        - [x] call this function every time the vertex handle location is updated
- [x] change cursor on mouse over line
- [x] insert vertices
- [ ] delete selected vertex with delete key
    - [ ] create delete command
    - [ ] get deletion working
- [ ] refactor keyboard event propagation in event handler.ts
- [ ] make all actions in vertex edit mode undoable

- [ ] improve vertex appearance
- [ ] add angle text to line segments

- [ ] vertex edit mode finished!


Write up about 
- design philosophy
- event flow/propagation
- modularity
- what else?

#### Create Bed config mode
- [ ] add button to create bed? where would this live?
- [ ] mesh extrusion
- [ ] control bed height
- [ ] control border width

- [ ] create bed object

- [ ] add delete object command with undo

- [ ] show/hide grid
- [ ] enable/disable snap to grid
- [ ] toggle metric vs imperial globally

viewport.js line 99 copy

### Minor Improvements
- [ ] move more with WASD
- [x] fix aspect ratio with ortho perspective

### BUGS
- [x] get vertex drawing working
- [x] mouse cursor not changing
- [ ] finished beds are difficult to select?

#### Feedback
- [ ] try out the bed editor mode for garden beds I designed
- [ ] write down what worked well, what didn't
- [ ] make Erika repeat the same task
- [ ] get feedback on appearance
- [ ] get feedback on interactions

#### PLANT EDITOR
- [ ] add UI for placing and removing objects
    - [ ] button for creating new plant
    - [ ] plant browser UI with image preview

- [ ] add commands for placing and removing objects

- [ ] parent objects to mouse and clamp to ground with raycast (no transform controls mode)
- [ ] toggle between transform controls and free move mode

- [ ] do ghosting when adding in a new object in raycast pose mode

- [ ] Azimuth and angle sun editor

- [ ] save basic editor
- [ ] get feedback from Erika, give her a task like "design a house" and watch her interaction with the software

# Garden Design Utilities

- [ ] measurements tool
    - [ ] grid lines
    - [ ] placeable ruler
    - [ ] pen tool for area calculation
    - [ ] toggle metric/imperial

- [ ] bed creation
    - [ ] draw polylines
    - [ ] create 3D walls of bed
    - [ ] control bed height
    - [ ] auto-fill bed

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

MVP finished!

## USER FEEDBACK
- [ ] friends and family
- [ ] community gardens network in Austin
- [ ] r/austingardens


- [ ] user login backend
- [ ] garden concept browser?
- [ ] batch processing for sun location
- [ ] payment system and stuff

# Stateful representation
```json
{
    "12345": {
        "three_object": null,
        "name": "Bhut Jolokia",
        "type": "PLANT",
        "mesh": {
            "material": {},
            "geometry": {}
        },
        "transform": {
            "x_scale": 1,
            "y_scale": 1,
            "z_scale": 1,
            "x_rotation": 0,
            "y_rotation": 0,
            "z_rotation": 0
        },
        "plant_info": {
            "growth_stages": {
                "0": {
                    "radius": 0.25,
                    "height": 0.25
                },
                "1": {
                    "radius": 0.5,
                    "height": 0.5
                },
                "2": {
                    "radius": 0.5,
                    "height": 1.0
                }
            }
        }
    }
}
```


- selectable vs raycastable