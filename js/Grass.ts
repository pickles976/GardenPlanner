/**
 * Shamelessly ripped from:
 * https://discourse.threejs.org/t/simple-instanced-grass-example/26694
 */

import { DEPTHMASK_RENDER_ORDER, LayerEnum } from "./Constants";
import { Editor } from "./Editor";
import * as THREE from "three";

// https://www.maya-ndljk.com/blog/threejs-basic-toon-shader
const vertexShader = `

  #include <common>
  #include <shadowmap_pars_vertex>

  varying vec2 vUv;
  varying vec3 vNormal;

  uniform float time;

	void main() {
    #include <beginnormal_vertex>
    #include <defaultnormal_vertex>

    #include <begin_vertex>

    #include <worldpos_vertex>
    #include <shadowmap_vertex>

    vUv = uv;
    
    // VERTEX POSITION
    
    vec4 tipPosition = vec4( position, 1.0 );
    #ifdef USE_INSTANCING
    	tipPosition = instanceMatrix * tipPosition;

      // set vNormal for frag shader lighting
      mat3 normalMatrixInstance = transpose(inverse(mat3(normalMatrix)));
      vNormal = normalize(normalMatrix * normalMatrixInstance * normal);
    #endif
    
    // DISPLACEMENT
    
    // here the displacement is made stronger on the blades tips.
    float dispPower = 1.0 - cos( uv.y * 3.1416 / 2.0 );
    float dispMagnitude = 0.02;
    
    float speed = 0.4;
    float displacement = sin( tipPosition.z + time * speed ) * ( dispMagnitude * dispPower );
    tipPosition.z += displacement; // sway
    
    vec4 modelViewPosition = modelViewMatrix * tipPosition;
    gl_Position = projectionMatrix * modelViewPosition;

	}
`;

const fragmentShader = `
  #include <common>
  #include <packing>
  #include <lights_pars_begin>
  #include <shadowmap_pars_fragment>
  #include <shadowmask_pars_fragment>

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {

    // Directional light
    float NdotL = dot(vNormal, directionalLights[0].direction);
    float lightIntensity = smoothstep(0.0, 0.01, NdotL);
    vec3 directionalLight = directionalLights[0].color * lightIntensity;

    // Directional shadow
    DirectionalLightShadow directionalShadow = directionalLightShadows[0];
    float shadow = getShadowMask();
    shadow = mix(0.5, 1.0, shadow);
    
  	vec3 baseColor = vec3( 0.41, 1.0, 0.5 );
    float clarity = ( vUv.y * 0.5 ) + 0.5;

    // ambientLightColor

    gl_FragColor = vec4( ambientLightColor * (baseColor * clarity * shadow), 1.0);
    // gl_FragColor = vec4( directionalLight, 1.0);

  }
`;

const uniforms = {
  time: {
  	value: 0
  },
  receiveShadow: {
    value: 1
  },
  ...THREE.UniformsLib.lights,
};

export const grassMaterial = new THREE.ShaderMaterial({
  lights: true,
  vertexShader,
  fragmentShader,
  uniforms,
  side: THREE.DoubleSide,
  depthWrite: true,
  depthTest: true,
});

export function createGrassBladeGeometry(width, height) {

    const geometry = new THREE.BufferGeometry();

    // Vertices of the triangle
    const vertices = new Float32Array([
    0, height, 0,              // top vertex
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

// TODO: perform raycast to check for stuff!
// TODO: cache raycast for performance!
export function createGrass(instanceNumber: number, width: number, height: number)  : THREE.InstancedMesh {

  const start = performance.now();

  const geometry = createGrassBladeGeometry(0.04, 0.32)
  const dummy = new THREE.Object3D();
  dummy.layers.set(LayerEnum.Grass);

  const instancedMesh = new THREE.InstancedMesh( geometry, grassMaterial, instanceNumber );

  // TODO: get a faster prng implementation
  // Position and scale the grass blade instances randomly.
  for ( let i=0 ; i<instanceNumber ; i++ ) {
    dummy.position.set(
      ( Math.random() - 0.5 ) * width,
      0,
      ( Math.random() - 0.5 ) * height
    );
    
    dummy.scale.setScalar( 0.5 + Math.random() * 0.5 );
    
    dummy.rotation.y = Math.random() * Math.PI;
    
    dummy.updateMatrix();
    instancedMesh.setMatrixAt( i, dummy.matrix );
  }

  // 200 ms just for prng
  // 600 ms total
  console.log(`Created grass in: ${performance.now() - start}ms`)

  return instancedMesh;
}

// const clock = new THREE.Clock();

// const animate = function () {

//   // Hand a time variable to vertex shader for wind displacement.
//   grassMaterial.uniforms.time.value = clock.getElapsedTime();
//   grassMaterial.uniformsNeedUpdate = true;

//   requestAnimationFrame( animate );


// };

// animate();