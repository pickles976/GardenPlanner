import * as THREE from "three"


function loadTexture(filepath: string, encoding: THREE.ColorSpace, scale: THREE.Vector2) : THREE.Texture {
    const texture = new THREE.TextureLoader().load(filepath); 
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = encoding;
    texture.repeat.set( ...scale );
    return texture;
}

function getPBRTexture(path: string, scale: THREE.Vector2 = new THREE.Vector2(1,1)) : Object {
    return {
        map: loadTexture(path.concat("albedo.png"), THREE.SRGBColorSpace, scale),
        aoMap: loadTexture(path.concat("ao.png"), THREE.LinearSRGBColorSpace, scale),
        bumpMap:loadTexture(path.concat("height.png"), THREE.LinearSRGBColorSpace, scale),
        metalnessMap: loadTexture(path.concat("metalness.png"), THREE.LinearSRGBColorSpace, scale),
        normalMap: loadTexture(path.concat("normal.png"), THREE.LinearSRGBColorSpace, scale),
        roughnessMap: loadTexture(path.concat("roughness.png"), THREE.LinearSRGBColorSpace, scale),
        alphaMap: loadTexture(path.concat("opacity.png"), THREE.LinearSRGBColorSpace, scale),
        side: THREE.DoubleSide,
    }
}

// const blockTexture = getPBRTexture("/materials/blocks-bl/", new THREE.Vector2(0.5,0.5));
// const mudTexture = getPBRTexture("/materials/mud-with-vegetation-bl/", new THREE.Vector2(0.5, 0.5))
// const mulchTexture = getPBRTexture("/materials/mulch-bl/", new THREE.Vector2(0.4, 0.4))
// const groundTexture = getPBRTexture("/materials/stylized-grass1-bl/", new THREE.Vector2(64, 64))
const chainLinkTexture = getPBRTexture("/materials/chain-link-bl/", new THREE.Vector2(0.4, 0.4))

// export const rockMaterial = new THREE.MeshStandardMaterial(blockTexture)
// export const mudMaterial = new THREE.MeshStandardMaterial(mudTexture)
// export const mulchMaterial = new THREE.MeshStandardMaterial(mulchTexture)
// export const groundMaterial = new THREE.MeshStandardMaterial(groundTexture)
export const chainLinkMaterial = new THREE.MeshStandardMaterial(chainLinkTexture)