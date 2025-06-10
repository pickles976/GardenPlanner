import { Vector3 } from "three";
import * as THREE from "three";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';


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

function sortVector3Clockwise(points, plane = 'XY') {
  if (points.length <= 1) return points.slice(); // Return a copy if 1 or 0 points

  // Compute the center point
  const center = points.reduce((sum, p) => sum.add(p.clone()), new THREE.Vector3()).divideScalar(points.length);

  // Helper to get angle based on chosen plane
  function getAngle(p) {
    switch (plane.toUpperCase()) {
      case 'XY':
        return Math.atan2(p.y - center.y, p.x - center.x);
      case 'XZ':
        return Math.atan2(p.z - center.z, p.x - center.x);
      case 'YZ':
        return Math.atan2(p.z - center.z, p.y - center.y);
      default:
        throw new Error("Invalid plane specified. Use 'XY', 'XZ', or 'YZ'.");
    }
  }

  // Sort by angle in clockwise direction
  return points.slice().sort((a, b) => {
    const angleA = getAngle(a);
    const angleB = getAngle(b);
    return angleB - angleA; // Clockwise: larger angle first
  });
}

// TODO: move to bed editor
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

// TODO: move to bed editor
export function createBedBorder(vertices: Vector3[], width: number, height: number, material: THREE.Material): THREE.Mesh {

  const verts = vertices.map((v) => v.clone());
  // verts = sortVector3Clockwise(verts)

  // // 1. find centroid
  const centroid = getCentroid(verts);

  // 2. scale vertices
  // TODO: this method sucks :/
  let newVerts = verts.map((v) => v.clone())
  for (let i = 0; i < verts.length; i++) {
    const v1 = verts[i % verts.length].clone();
    const v2 = verts[(i + 1) % verts.length].clone();
    const line = v1.sub(v2);

    // This only works for CW points
    const orthoAngle = Math.atan2(line.y, line.x) - (Math.PI / 2);
    const ortho = new Vector3(Math.cos(orthoAngle), Math.sin(orthoAngle), 0).multiplyScalar(width)

    newVerts[i % verts.length].add(ortho);
    newVerts[(i + 1) % verts.length].add(ortho);
  }

  // 3. Clone verts
  let border = newVerts.map((v) => v.clone());

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

  return new THREE.Mesh(new THREE.ExtrudeGeometry(shape, extrudeSettings), material);
}

// TODO: move to bed editor
export function createBed(vertices: Vector3[], height: number, material: THREE.Material) {

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

  return new THREE.Mesh(new THREE.ExtrudeGeometry(shape, extrudeSettings), material);
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