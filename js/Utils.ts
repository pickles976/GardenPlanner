import { Vector3 } from "three";
import * as THREE from "three";
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

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