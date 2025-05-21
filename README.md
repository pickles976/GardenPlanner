# Stuff

Python: astral, pyephem, or skyfield

C++: NOAA SPA or PSA algorithms

JavaScript: suncalc

[Rust: sun or astro-rust](https://github.com/mourner/suncalc)


[Three.js editor](https://github.com/mrdoob/three.js/tree/master/editor)
[Transform Controls](https://threejs.org/docs/#examples/en/controls/TransformControls)
[Signals](https://github.com/millermedeiros/js-signals)


- timeline?
- ECS?
- animations?

## TODO:
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

- [ ] add UI for transform controls
    - [ ] create UI
    - [ ] create sliders
    - [ ] connect signals to editor
    - [ ] ???

- [ ] add UI for placing and removing objects
- [ ] allow CTRL+Z

- [ ] measurements tool
    - [ ] grid lines
    - [ ] placeable ruler
    - [ ] pen tool for area calculation
    - [ ] toggle metric/imperial

- [ ] panel UI with pre-built models for drag and drop
- [ ] lat/lon entry
- [ ] absolute time entry
- [ ] suncalc
- [ ] position sun based on time

- [ ] saving configurations as json
    - [ ] export
    - [ ] load
    
- [ ] on-demand rendering
- [ ] in-browser sqlite engine for plants and stuff
- [ ] allow users to create their own plants
- [ ] basic geometric drawing utilities

- [ ] garden concept browser?
- [ ] web client
- [ ] local client with electron

MVP finished!

What other features should we add?
- [ ] 

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