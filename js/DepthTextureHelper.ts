import * as THREE from "three"; 
import { GRASS_HEIGHT, LayerEnum, WORLD_SIZE } from "./Constants";
import { WHITE } from "./Colors";


export const depthTexturePreviewMaterial = new THREE.ShaderMaterial({
  uniforms: {
    depthTexture: { value: null },
    worldSize: {
        value: new THREE.Vector2(WORLD_SIZE, WORLD_SIZE)
    }
  },
  vertexShader: `
    varying vec3 worldPos;
    void main() {
      worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D depthTexture;
    uniform vec2 worldSize;
    varying vec3 worldPos;

    void main() {
      float rawDepth = texture2D(depthTexture, (worldPos.xz / worldSize) + vec2(0.5)).r;
      float depth = abs(rawDepth - 1.0) / 0.32;

      gl_FragColor = vec4(vec3(depth), 1.0); // Linear grayscale
    }
  `
});
