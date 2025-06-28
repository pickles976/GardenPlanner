import { LayerEnum } from "./Constants";
import { Editor } from "./Editor";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  uniform float time;

	void main() {

    vUv = uv;
    
    // VERTEX POSITION
    
    vec4 mvPosition = vec4( position, 1.0 );
    #ifdef USE_INSTANCING
    	mvPosition = instanceMatrix * mvPosition;
    #endif
    
    // DISPLACEMENT
    
    // here the displacement is made stronger on the blades tips.
    float dispPower = 1.0 - cos( uv.y * 3.1416 / 2.0 );
    
    float speed = 0.2;
    float displacement = sin( mvPosition.z + time * speed ) * ( 0.1 * dispPower );
    mvPosition.y += displacement; // sway
    
    //
    
    vec4 modelViewPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * modelViewPosition;

	}
`;

const fragmentShader = `
  varying vec2 vUv;
  
  void main() {
  	vec3 baseColor = vec3( 0.41, 1.0, 0.5 );
    float clarity = ( vUv.y * 0.5 ) + 0.5;
    gl_FragColor = vec4( baseColor * clarity, 1);
  }
`;

const uniforms = {
	time: {
  	value: 0
  }
}

export const leavesMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms,
  side: THREE.DoubleSide,
  depthTest: true,
  depthWrite: true
});

export function createGrassBladeGeometry(width, height) {

    const geometry = new THREE.BufferGeometry();

    // Vertices of the triangle
    const vertices = new Float32Array([
    0, 0, height,              // top vertex
    -width / 2, 0, 0,          // bottom left
    width / 2, 0, 0            // bottom right
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const uvs = new Float32Array([
    0.5, 1.0,    // top
    0.0, 0.0,    // bottom left
    1.0, 0.0     // bottom right
    ]);
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    return geometry;
}

export function createGrass(editor: Editor, instanceNumber: number, width: number, height: number) {

    const geometry = createGrassBladeGeometry(0.02, 0.08)
    const dummy = new THREE.Object3D();
    dummy.layers.set(LayerEnum.NoRaycast)
    const instancedMesh = new THREE.InstancedMesh( geometry, leavesMaterial, instanceNumber );

    editor.scene.add( instancedMesh );

    // Position and scale the grass blade instances randomly.

    for ( let i=0 ; i<instanceNumber ; i++ ) {
      dummy.position.set(
        ( Math.random() - 0.5 ) * width,
        ( Math.random() - 0.5 ) * height,
        0
      );
      
      dummy.scale.setScalar( 0.5 + Math.random() * 0.5 );
      
      dummy.rotation.z = Math.random() * Math.PI;
      
      dummy.updateMatrix();
      instancedMesh.setMatrixAt( i, dummy.matrix );
    }
}

// const clock = new THREE.Clock();

// const animate = function () {

//   // Hand a time variable to vertex shader for wind displacement.
//   leavesMaterial.uniforms.time.value = clock.getElapsedTime();
//   leavesMaterial.uniformsNeedUpdate = true;

//   requestAnimationFrame( animate );


// };

// animate();