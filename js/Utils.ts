import { Vector3 } from "three";
import * as THREE from "three";
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { color } from "three/tsl";
import { LayerEnums } from "./Constants";

export function getCentroid(points: Vector3[]) {
  const centroid = new Vector3(0, 0, 0);
  if (points.length === 0) return centroid;

  for (const p of points) {
    centroid.add(p);
  }

  centroid.divideScalar(points.length);
  return centroid;
}

export function getTextGeometry(text: string): THREE.Mesh {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  // canvas.width = 512;
  // canvas.height = 256;

  // Draw text
  context.fillStyle = 'white';
  context.font = '64px sans-serif';
  context.fillText(text, 10, 50);

  // Use canvas as texture
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  const geometry = new THREE.PlaneGeometry(1, 0.5);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh
}

export function destructureVector3Array(array: Vector3[]): number[] {
  let newArray = [];
  for (const item of array) {
    newArray.push(...item)
    // newArray.push(item.y)
    // newArray.push(item.z)
  }

  return newArray
}

export function polygonArea(vertices: Vector3[]): number {
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    const x1 = v1.x, y1 = v1.y;
    const x2 = v2.x, y2 = v2.y;

    area += (x1 * y2) - (x2 * y1);
  }
  return Math.abs(area) / 2.0;
}

export function createBedBorder(vertices: Vector3[], width: number, height: number, color: string, opacity: number) : THREE.Mesh {

  const verts = vertices.map((v) => v.clone());

  // 1. find centroid
  const centroid = getCentroid(verts);

  // 2. scale vertices
  for (let i = 0; i < verts.length; i++) {
    const v1 = verts[i].clone();
    const v2 = verts[(i + 1) % verts.length].clone();
    const line = v1.sub(v2);

    const orthoAngle = Math.atan2(line.y, line.x) - (Math.PI / 2);
    const ortho = new Vector3(Math.cos(orthoAngle), Math.sin(orthoAngle), 0).multiplyScalar(width)

    verts[i].add(ortho);
    verts[(i + 1) % verts.length].add(ortho);
  }

  // 3. Clone verts
  let border = verts.map((v) => v.clone());

  // 4. Create shape from scaled vertices, use original vertices to create a hole
  border.push(border[0]);
  const points = border.map((p) => {
      const temp = p.clone().sub(centroid);
      return new THREE.Vector2(temp.x, temp.y);
  });

  const holes = vertices.map((p) => {
      const temp = p.clone().sub(centroid);
      return new THREE.Vector2(temp.x, temp.y);
  });

  const shape = new THREE.Shape(points);
  shape.holes.push(new THREE.Path(holes));

  const extrudeSettings = { 
      depth: height, 
      bevelEnabled: false, 
      bevelSegments: 2, 
      steps: 2, 
      bevelSize: 1, 
      bevelThickness: 1 
  };

  const geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );

  // 6. Extrude and create mesh
  const borderMesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({ 
    color: color, 
    side: THREE.DoubleSide, 
    transparent: isTransparent(opacity), 
    opacity: opacity}) );
  borderMesh.position.set(...centroid);
  return borderMesh;
}

export function isTransparent(opacity: number) {
  return (opacity == 1.0) ? false : true;
}

export function createBed(vertices: Vector3[], height: number, color: string, opacity: number) {

  const verts = vertices.map((v) => v.clone());
  const centroid = getCentroid(verts);

  verts.push(vertices[0]);
  const points = verts.map((p) => {
      const temp = p.clone().sub(centroid);
      return new THREE.Vector2(temp.x, temp.y);
  });

  const shape = new THREE.Shape(points);

  const extrudeSettings = { 
      depth: height, 
      bevelEnabled: false, 
      bevelSegments: 2, 
      steps: 2, 
      bevelSize: 1, 
      bevelThickness: 1 
  };

  const geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );

  const mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({ 
    color: color, 
    side: THREE.DoubleSide, 
    transparent: isTransparent(opacity), 
    opacity: opacity}));
  mesh.userData = {"selectable": true}
  mesh.layers.set(LayerEnums.Objects)
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  return mesh
}