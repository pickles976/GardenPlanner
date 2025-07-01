/**
 * Shamelessly ripped from:
 * https://discourse.threejs.org/t/simple-instanced-grass-example/26694
 */

import { DEPTHMASK_RENDER_ORDER, GRASS_HEIGHT, GRASS_WIDTH, LayerEnum, WORLD_SIZE } from "./Constants";
import { Editor } from "./Editor";
import * as THREE from "three";

// https://www.maya-ndljk.com/blog/threejs-basic-toon-shader
const vertexShader = `

  #include <common>
  #include <shadowmap_pars_vertex>

  varying vec2 vUv;
  varying vec3 vNormal;

  uniform float time;
  uniform float grassHeight;
  uniform sampler2D depthTexture;
  uniform vec2 worldSize;

  // 2D Random
  float random (in vec2 st) {
      return fract(sin(dot(st.xy,
                          vec2(12.9898,78.233)))
                  * 43758.5453123);
  }

  // 2D Noise based on Morgan McGuire @morgan3d
  // https://www.shadertoy.com/view/4dS3Wd
  float noise (in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      // Four corners in 2D of a tile
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      // Smooth Interpolation

      // Cubic Hermine Curve.  Same as SmoothStep()
      vec2 u = f*f*(3.0-2.0*f);
      // u = smoothstep(0.,1.,f);

      // Mix 4 coorners percentages
      return mix(a, b, u.x) +
              (c - a)* u.y * (1.0 - u.x) +
              (d - b) * u.x * u.y;
  }

	void main() {
    #include <beginnormal_vertex>
    #include <defaultnormal_vertex>

    #include <begin_vertex>

    #include <worldpos_vertex>
    #include <shadowmap_vertex>

    vUv = uv;

    // VERTEX POSITION
    
    vec4 vertPosition = vec4( position, 1.0 );
    #ifdef USE_INSTANCING
    	vertPosition = instanceMatrix * vertPosition;

      // set vNormal for frag shader lighting
      mat3 normalMatrixInstance = transpose(inverse(mat3(normalMatrix)));
      vNormal = normalize(normalMatrix * normalMatrixInstance * normal);
    #endif

    float stepSize = 2.0 / float(worldSize);
    float maxDisplacement = 0.05;
    float maxNoiseDisplacement = 0.03;

    // Blade tips only
    if (vertPosition.y > 0.01) {

      // VERTICAL DISPLACEMENT
      float rawDepth = texture2D(depthTexture, (vertPosition.xz / worldSize) + vec2(0.5)).r;
      float depth = abs(rawDepth - 1.0); // 1.0 comes from the camera position
      vertPosition.y = grassHeight - depth - (random(vertPosition.xz) * grassHeight * 0.3);

      // Perlin noise
      vertPosition.x += (noise(vertPosition.xz) - 0.5) * maxNoiseDisplacement;

      // Random noise
      vertPosition.x += (random(vertPosition.xz) - 0.5) * maxNoiseDisplacement;
      vertPosition.z += (random(vertPosition.xz * 2.0) - 0.5) * maxNoiseDisplacement;

      // NORTH
      float northDepth = texture2D(depthTexture, ((vertPosition.xz + vec2(0, stepSize)) / worldSize) + vec2(0.5)).r;
      float north = abs(northDepth - 1.0); // 1.0 comes from the camera position

      vertPosition.z -= min(north / 3.0, maxDisplacement);

      // SOUTH
      float southDepth = texture2D(depthTexture, ((vertPosition.xz + vec2(0, -stepSize)) / worldSize) + vec2(0.5)).r;
      float south = abs(southDepth - 1.0); // 1.0 comes from the camera position

      vertPosition.z += min(south / 3.0, maxDisplacement);

      // EAST
      float eastDepth = texture2D(depthTexture, ((vertPosition.xz + vec2(stepSize, 0)) / worldSize) + vec2(0.5)).r;
      float east = abs(eastDepth - 1.0); // 1.0 comes from the camera position

      vertPosition.x -= min(east / 3.0, maxDisplacement);

      // WEST
      float westDepth = texture2D(depthTexture, ((vertPosition.xz + vec2(-stepSize, 0)) / worldSize) + vec2(0.5)).r;
      float west = abs(westDepth - 1.0); // 1.0 comes from the camera position

      vertPosition.x += min(west / 3.0, maxDisplacement);

    }
    
    // here the displacement is made stronger on the blades tips.
    float dispPower = 1.0 - cos( uv.y * 3.1416 / 2.0 );
    float dispMagnitude = 0.02;
    
    float speed = 0.4;
    float displacement = sin( vertPosition.z + time * speed ) * ( dispMagnitude * dispPower );
    vertPosition.z += displacement; // sway
    
    gl_Position = projectionMatrix * modelViewMatrix * vertPosition;

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
  grassHeight: {
    value: GRASS_HEIGHT
  },
  depthTexture: {
    value: null
  },
  worldSize: {
    value: new THREE.Vector3(WORLD_SIZE, WORLD_SIZE)
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

  const geometry = createGrassBladeGeometry(GRASS_WIDTH, GRASS_HEIGHT)
  const dummy = new THREE.Object3D();
  dummy.layers.set(LayerEnum.Grass); // hides from raycast

  const instancedMesh = new THREE.InstancedMesh( geometry, grassMaterial, instanceNumber );
  instancedMesh.layers.set(LayerEnum.Grass); // hides from render

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