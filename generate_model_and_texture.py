"""
For use with https://github.com/cocktailpeanut/Hunyuan3D-2GP
"""

from PIL import Image

from hy3dgen.rembg import BackgroundRemover
from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline
from hy3dgen.texgen import Hunyuan3DPaintPipeline

import os
import time
import tkinter as tk
from tkinter import filedialog

def select_image() -> str:
    filetypes = [
        ("Image files", "*.jpg *.jpeg *.png"),  # group extensions in one filter
        ("JPEG only", "*.jpg *.jpeg"),
        ("PNG only", "*.png"),
        ("All files", "*.*")
    ]
    # Show dialog for a single file
    path = filedialog.askopenfilename(
        title="Select a JPEG or PNG image",
        initialdir="/home/sebas/Downloads",
        filetypes=filetypes
    )
    if not path:
        print("No file selected")
        exit()
    return path

if __name__ == "__main__":

    model_path = 'tencent/Hunyuan3D-2'
    pipeline_shapegen = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(model_path)
    pipeline_texgen = Hunyuan3DPaintPipeline.from_pretrained(model_path)

    while True:
        image_path = select_image()
        image = Image.open(image_path).convert("RGBA")
        if image.mode == 'RGB':
            rembg = BackgroundRemover()
            image = rembg(image)

        start_time = time.time()
        mesh = pipeline_shapegen(
            image=image,
            num_inference_steps=50,
            octree_resolution=380,
            num_chunks=20000,
            output_type='trimesh'
        )[0]
        mesh = pipeline_texgen(mesh, image=image)
        print("--- %s seconds ---" % (time.time() - start_time))

        filename = os.path.basename(image_path).split('.')[0]
        mesh.export(f'{filename}.glb')
