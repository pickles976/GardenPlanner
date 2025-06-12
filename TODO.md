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
- [x] make all actions in vertex edit mode undoable
- [x] cannot allow undoing insert vertices due to statefulness of vertices
- [x] delete selected vertex with delete key
- [x] refactor keyboard event propagation in event handler.ts

- [x] add cancel button that becomes visible when "create new" is clicked
- [x] implement cancel functionality

- [x] change "create new" button to "save vertices?" when vertices are placed
- [x] fill in polygon with transparent thing

- [x] add clickable button like in manor lords to save vertices or cancel vertices
    - [x] add CSS 2D renderer to scene
    - [x] get literally anything rendering in 2D
    - [x] figure out how to render svg in 3D (2D?)
    - [x] parent buttons to centroid
    - [x] make clickable complete button
        - [x] add mouse over callback
        - [x] add mouse click callback
        - [x] make it erase itself between frames
    - [x] make clickable cancel button
        - [x] add mouse over callback
        - [x] add mouse click callback
        - [x] make it erase itself between frames
- [x] vertex edit mode finished!

- [x] conslidate colors into file
- [x] consolidate event bus messages into file w/ enums


#### Create Bed config mode

- [x] go to bed config mode
- [x] draw ghosted preview of mesh

- [x] create new UI element for configuring bed
- [x] mesh extrusion
- [x] control bed height

- [x] get area calculations
- [x] show in Bed UI during vertex editing step
- [x] show in bed UI during bed config step
- [x] calculate bed volume as well

- [x] control border width
    - [x] draw border around bed
    - [x] use holes https://threejs.org/docs/#api/en/extras/core/Shape.holes
    - [x] redraw border with bed
    - [x] add controls UI
    - [x] border height
    - [x] border scale
- [x] allow editing bed color
    - [x] inside color
    - [x] border color
- [x] allow user set name
- [x] draw line between editable and non-editable properties
    - [x] create multiple containers
    - [x] edit container styles
- [x] finalize bed object and save
    - [x] add "save bed" button
    - [x] create mesh group and save
- [x] merge meshes somehow

- [x] get workflow working e2e with no bugs
    - [x] get cancel working from bed config mode
- [x] clean up bed creation functions
    - [x] inject material
- [x] pull cursors out into js file
- [x] hide scene viewer in BED mode

- [x] commandify value changes:
    `editor.execute( new SetValueCommand( editor, editor.selected, 'name', objectName.getValue() ) )`
- [x] get ctrl-z working for bed config mode

#### Bed Editor QOL improvements
- [x] add some logic to update `BedEditingUpdateCommand` if the changed values are floats.

- [x] enable/disable snap to grid
    - [x] add snapping class
    - [x] enable snapping functionality
    - [x] add button to toggle snapping
- [x] toggle metric vs imperial globally
    - [x] toggle snap distance
    - [x] toggle grids
- [x] fix vertex size 
- [ ] fix text size for line previews (use CSS2D)
- [ ] change from meters to feet on UI
- [ ] fix bed editor z-fighting on ghost mesh

- [ ] fix bug with bed name

- [ ] TODO: clean up the stages and stuff, maybe use objects/ data structures for each state??
    - [ ] clean up BedEditor TODOs
    - [ ] handle messages from within relevant objects
    - [ ] clean up BedEditor state
    - [ ] remove any hardcoded values

BED EDITING FINISHED (FOR NOW)

DOCUMENT SOFTWARE ARCHITECTURE

#### QOL
- [ ] add delete object command with undo
- [ ] show/hide grid


### Minor Improvements\
- [ ] refactor and cleanup
- [ ] improve vertex appearance
- [ ] add angle text to line segments
- [ ] draw north in vertex mode
- [ ] move more with WASD in vertex mode
- [ ] create a delete command in object mode
- [ ] Should probably refactor the CSS 2D stuff at some point to make it easier to use

#### Feedback
- [ ] try out the bed editor mode for garden beds I designed
- [ ] write down what worked well, what didn't
- [ ] make Erika repeat the same task
- [ ] get feedback on appearance
- [ ] get feedback on interactions

Write up about 
- design philosophy
- event flow/propagation
- modularity
- what else?

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