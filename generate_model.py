"""
For use with https://github.com/Tencent-Hunyuan/Hunyuan3D-2
"""

import os
import time

import torch
from PIL import Image

from hy3dgen.rembg import BackgroundRemover
from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline


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

def generate_mesh(image_path: str):

    filename = os.path.basename(image_path).split('.')[0]
    # image_path = 'assets/demo.png'
    image = Image.open(image_path).convert("RGBA")
    if image.mode == 'RGB':
        rembg = BackgroundRemover()
        image = rembg(image)

    pipeline = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(
        'tencent/Hunyuan3D-2mini',
        subfolder='hunyuan3d-dit-v2-mini',
        variant='fp16'
    )

    start_time = time.time()
    mesh = pipeline(
        image=image,
        num_inference_steps=50,
        octree_resolution=380,
        num_chunks=20000,
        generator=torch.manual_seed(12345),
        output_type='trimesh'
    )[0]
    print("--- %s seconds ---" % (time.time() - start_time))
    mesh.export(f'{filename}.glb')

if __name__ == "__main__":
    root = tk.Tk()
    root.withdraw()  # hide the root window
    generate_mesh(select_image())

