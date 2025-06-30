
      const renderer = new THREE.WebGLRenderer({antialias: true});
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( window.innerWidth, window.innerHeight );
      renderer.shadowMap.enabled = true;
      document.body.appendChild( renderer.domElement );

      const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
      camera.position.x = 1.5;
      camera.position.y = 1.5;
      camera.position.z = 1.5;
      camera.lookAt(new THREE.Vector3(0,-1,0));

      const controls = new THREE.OrbitControls( camera, renderer.domElement );
      // controls.target.x = 0.75;
      // controls.update();

      const scene = new THREE.Scene();
      scene.background = new THREE.Color( 0xcce0ff );
      scene.fog = new THREE.FogExp2( scene.background, 0.1 );

      // light the scene
      const hemisphereLight = new THREE.HemisphereLight( scene.background, 0x8888ff, 0.75 );
      scene.add( hemisphereLight );

      const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
      directionalLight.position.x = -10;
      directionalLight.position.y = 8;
      directionalLight.position.z = 5;
      directionalLight.castShadow = true;
      scene.add( directionalLight );


      const SETTINGS = {
        enableDepthMask     : true,
        highlightDepthMask  : false,
        transparentWater    : true,
        isMoving            : true,
      };
      const DEPTHMASK_RENDER_ORDER = 999;


      // =======================================================================

      // add boat
      // -----------------------------------------
      const makeVerySimpleBoat = function(hollow = true) {
        const material = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh( new THREE.BoxGeometry( 1, 0.5, 1.5 ), material );
        mesh.castShadow = true;

         // chop the top of the box to make it hollow
        if(hollow) {
          mesh.geometry.faces.splice(4, 2);
        }

        return mesh;
      }

      const boat1 = makeVerySimpleBoat();
      boat1.position.x = 0.75;
      scene.add(boat1);

      const boat2 = makeVerySimpleBoat();
      boat2.position.x = -0.75;
      boat2.material.color = new THREE.Color(0x888888);
      scene.add(boat2);


      // add depth mask
      // -----------------------------------------
      const DEPTHMASK_MATERIAL = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: false,
        colorWrite: false,
      });

      const DEPTHMASK_MESH = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1, 1.5, 1 ), DEPTHMASK_MATERIAL );
      DEPTHMASK_MESH.rotation.x = Math.PI * -0.5;
      DEPTHMASK_MESH.position.y = 0.25;
      DEPTHMASK_MESH.renderOrder = DEPTHMASK_RENDER_ORDER;
      boat1.add(DEPTHMASK_MESH);


      // add ocean
      // -----------------------------------------
      const oceanMaterial = new THREE.MeshStandardMaterial({
        color: 0x2255ff,
        transparent: SETTINGS.transparentWater,
        opacity: 0.8,
        roughness: 0.45,
        side: THREE.DoubleSide,
      });

      const ocean = new THREE.Mesh( new THREE.PlaneBufferGeometry( 100, 100, 10 ), oceanMaterial );
      ocean.receiveShadow = true;
      ocean.rotation.x = Math.PI * -0.5;
      ocean.renderOrder = DEPTHMASK_RENDER_ORDER + 1;
      scene.add(ocean);

      // =======================================================================


      // add gui
      const onSettingsChanged = function(value) {
        DEPTHMASK_MESH.visible = SETTINGS.enableDepthMask || SETTINGS.highlightDepthMask;
        DEPTHMASK_MATERIAL.wireframe = SETTINGS.highlightDepthMask;
        DEPTHMASK_MATERIAL.colorWrite = SETTINGS.highlightDepthMask;
        oceanMaterial.transparent = SETTINGS.transparentWater;
      };
      const gui = new dat.GUI();
      gui.add(SETTINGS, 'enableDepthMask').name('Enable depth mask').onChange(onSettingsChanged);
      gui.add(SETTINGS, 'highlightDepthMask').name('Highlight depth mask').onChange(onSettingsChanged);
      gui.add(SETTINGS, 'transparentWater').name('Transparent water').onChange(onSettingsChanged);
      gui.add(SETTINGS, 'isMoving').name('Animate boats');


      INITIALIZE_THREEJS_DEMO(renderer, scene, camera, controls, {
        onBeforeRender(deltaTime, elapsedTime) {
          if(SETTINGS.isMoving) {
            boat1.position.y = (Math.sin(elapsedTime * 0.0025) * 0.25) + 0.1;
            boat2.position.y = boat1.position.y;
          }
        },
      });
    