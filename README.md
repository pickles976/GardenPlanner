# Stuff

Python: astral, pyephem, or skyfield

C++: NOAA SPA or PSA algorithms

JavaScript: suncalc

[Rust: sun or astro-rust](https://github.com/mourner/suncalc)


[Three.js editor](https://github.com/mrdoob/three.js/tree/master/editor)
[Transform Controls](https://threejs.org/docs/#examples/en/controls/TransformControls)
[Mitt](https://www.npmjs.com/package/mitt)


- timeline?
- ECS?
- animations?

## EDITING FEATURES:
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


viewport.js line 99 copy

- [x] reset transform controls when objects are deleted

- [ ] add UI for bed creation
    - [ ] panel with button
    - [ ] change cursor
    - [ ] place bed vertices
    - [ ] create bed object
    - [ ] undo vertices
    - [ ] make bed selectable + undo bed creation

- [ ] add delete object command with undo

- [ ] add UI for placing and removing objects
    - [ ] button for creating new plant
    - [ ] plant browser UI with image preview

- [ ] add commands for placing and removing objects

- [ ] parent objects to mouse and clamp to ground with raycast (no transform controls mode)
- [ ] toggle between transform controls and free move mode

- [ ] do ghosting when adding in a new object in raycast pose mode

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