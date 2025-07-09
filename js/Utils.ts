import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import * as THREE from "three";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { FONT_SIZE } from "./Constants";

export function blendColors(color1: THREE.Color, color2: THREE.Color, f: number) {
    // Clamp t to [0, 1]
    f = Math.max(0, Math.min(1, f));

    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    return c1.clone().lerp(c2, f);
}

export function rad2deg(radians: number) : number {
  return radians * 180 / Math.PI;
}

export function getCentroid(points: THREE.Vector3[]) {
  const centroid = new THREE.Vector3(0, 0, 0);
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

export function destructureVector3Array(array: THREE.Vector3[]): number[] {
  let newArray = [];
  for (const item of array) {
    newArray.push(...item)
    // newArray.push(item.y)
    // newArray.push(item.z)
  }

  return newArray
}

export function polygonArea(vertices: THREE.Vector3[]): number {
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    const x1 = v1.x, z1 = v1.z;
    const x2 = v2.x, z2 = v2.z;

    area += (x1 * z2) - (x2 * z1);
  }
  return Math.abs(area) / 2.0;
}

export function mergeMeshes(meshes: THREE.Mesh[]) : THREE.Mesh {
  /**
   * Merges multiple meshes
   */

  let meshArray = meshes.map((m) => m.clone());
  // TODO: explain what this does
  meshArray.forEach((m) => m.updateMatrixWorld())

  let geometries = meshArray.map((m) => m.geometry.clone());
  for (let i = 0; i < geometries.length; i++) {
    const geom = geometries[i];
    // TODO: explain what this does
    geom.applyMatrix4(meshArray[i].matrixWorld);
    geom.clearGroups();
    geom.addGroup(0, geom.index ? geom.index.count : geom.attributes.position.count, i);
  }

  const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, true);
  const materials = meshArray.map((m) => m.material.clone());
  const mergedMesh = new THREE.Mesh(mergedGeometry, materials);
  return mergedMesh;
}

export function createPhongMaterial(color: string) : THREE.MeshPhongMaterial {
  return new THREE.MeshPhongMaterial({color: color,side: THREE.DoubleSide})
}

export function createPreviewMaterial(color: string) : THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
}

export function fontSizeString(fontSize: number): string {
    return `${fontSize}px`
}

export function getCSS2DText(content: string, margin: string): CSS2DObject {
    const text = document.createElement('div');
    text.textContent = content;
    text.style.fontSize = fontSizeString(FONT_SIZE);
    text.style.marginTop = margin;
    return new CSS2DObject(text);
}

export function deepClone(object: THREE.Object3D) {
  const clone = object.clone(true); // true = recursive (deep) clone

  // Clone materials
  clone.traverse((node) => {
    if (node.isMesh) {
      // Clone material(s)
      if (Array.isArray(node.material)) {
        node.material = node.material.map(mat => mat.clone());
      } else {
        node.material = node.material.clone();
      }
    }
  });

  return clone;
}

export function getGeometrySize(object: THREE.Mesh) : THREE.Vector3 {
  const geometry = object.geometry;
  geometry.computeBoundingBox(); // Ensure bounding box is up-to-date

  const box = geometry.boundingBox; // Local-space AABB
  const size = new THREE.Vector3();
  box.getSize(size);
  return size
}

export function getObjectsize(object: THREE.Mesh) : THREE.Vector3 {
  /**
   * Get the bounding box size of the geometry and multiply it by the scale of the object. 
   * This will give us the actual size in meters of the object. We can use this to scale our object
   * in units instead of just a dimensionless "scale" vector.
   */
  const scale = object.scale.clone();
  const geoSize = getGeometrySize(object);
  return new THREE.Vector3(geoSize.x * scale.x, geoSize.y * scale.y, geoSize.z * scale.z);
}

export function northAngleToVec(angle: number) : THREE.Vector3 {
  return new THREE.Vector3(Math.sin(angle),0,Math.cos(angle));
}

export function saveJSON( blob, filename ) {

  const link = document.createElement( 'a' );

	if ( link.href ) {

		URL.revokeObjectURL( link.href );

	}

	link.href = URL.createObjectURL( blob );
	link.download = filename || 'data.json';
	link.dispatchEvent( new MouseEvent( 'click' ) );

}

export function vector3ArrayToJson(array: THREE.Vector3[]) : object {
  return array.map((v) => { return {"x": v.x, "y": v.y, "z": v.z}});
}

export function jsonToVector3Array(json: Object[]) : THREE.Vector3[] {
  return json.map((obj) => new THREE.Vector3(obj.x, obj.y, obj.z));
}