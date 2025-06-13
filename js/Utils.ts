import { Vector3 } from "three";
import * as THREE from "three";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import offsetPolygon from "offset-polygon";

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

  const verts = vertices.map((v) => ({"x": v.x, "y": v.y}));

  // Scale the border
  // TODO: remove magic number 1 for arcsegments

  // Depending on if the vertices were placed CW or CCW, the polygon will shrink or grow. If the border area is smaller than the bed area, 
  // then we need to re-calculate the offset with a flipped sign
  let border = offsetPolygon(verts, width, 1).map((v) => new Vector3(v.x, v.y, 0.0));
  if (polygonArea(border.map((v) => new Vector3(v["x"], v["y"], 0.0))) < polygonArea(vertices)) {
    border = offsetPolygon(verts, -width, 1).map((v) => new Vector3(v.x, v.y, 0.0));
  }

  border.push(border[0]);
  

  const centroid = getCentroid(verts);
  
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