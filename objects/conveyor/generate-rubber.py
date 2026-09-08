"""Run: blender --background --python generate-rubber.py

Creates an original 1 m x 5 m rubber atlas and a packed Blender material preview.
Run generate.mjs afterwards to regenerate MJCF and metric belt UVs.
"""
from pathlib import Path
import math
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'textures'
OUT.mkdir(exist_ok=True)
W, H = 512, 2560
x = (np.arange(W, dtype=np.float32) + .5)[None, :] / W
y = (np.arange(H, dtype=np.float32) + .5)[:, None] / H * 5
# Rounded diamond lands, 40 mm repeat, 0.65 mm relief. Periodic in both axes.
a = (x + y) / .04
b = (x - y) / .04
da = np.abs((a + .5) % 1 - .5)
db = np.abs((b + .5) % 1 - .5)
edge = np.minimum(da, db)
t = np.clip((edge - .055) / .10, 0, 1)
land = t*t*(3-2*t)
rng = np.random.default_rng(731)
grain = rng.random((H,W), dtype=np.float32) - .5
height = .00065*land + .000018*grain
dx = (np.roll(height,-1,axis=1)-np.roll(height,1,axis=1))/(2/W)
dy = (np.roll(height,-1,axis=0)-np.roll(height,1,axis=0))/(10/H)
normal = np.stack((-dx,-dy,np.ones_like(dx)),axis=-1)
normal /= np.linalg.norm(normal,axis=-1,keepdims=True)
normal = normal*.5+.5
wear = .5+.5*np.sin(2*math.pi*(x*7 + .08*np.sin(y*2*math.pi)))
color = np.clip(.16 + .025*land + .008*wear + .012*grain,0,1)
rough = np.clip(.86-.12*land-.025*wear+.035*grain,0,1)

def save_map(name, rgb):
    im = bpy.data.images.new(name, width=W,height=H,alpha=False)
    im.colorspace_settings.name = 'Non-Color'
    pixels = np.ones((H,W,4), dtype=np.float32)
    pixels[:,:,:3] = rgb if rgb.ndim == 3 else rgb[:,:,None]
    im.pixels.foreach_set(pixels.ravel())
    im.filepath_raw = str(OUT / (name+'.png'))
    im.file_format = 'PNG'
    im.save()
    if name == 'rubber-color': im.colorspace_settings.name = 'sRGB'
    return im

maps = {name:save_map('rubber-'+name,values) for name,values in [('color',color),('normal',normal),('roughness',rough)]}
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
mat = bpy.data.materials.new('Diamond grip rubber — 40 mm')
mat.use_nodes = True
nodes,links=mat.node_tree.nodes,mat.node_tree.links
bsdf=nodes.get('Principled BSDF')
for i,(name,im) in enumerate(maps.items()):
    node=nodes.new('ShaderNodeTexImage'); node.image=im; node.location=(-600,250-i*250)
    node.extension='EXTEND'
    if name=='normal':
        nm=nodes.new('ShaderNodeNormalMap'); nm.location=(-250,-120)
        links.new(node.outputs['Color'],nm.inputs['Color']); links.new(nm.outputs['Normal'],bsdf.inputs['Normal'])
    else: links.new(node.outputs['Color'],bsdf.inputs['Base Color' if name=='color' else 'Roughness'])
# One metre square material sample with UVs sampling one metre of the atlas.
bpy.ops.mesh.primitive_plane_add(size=1)
sample=bpy.context.object; sample.name='Rubber sample, one metre square'; sample.data.materials.append(mat)
for uv in sample.data.uv_layers.active.data: uv.uv.y *= .2
solid=sample.modifiers.new('Rubber edge','SOLIDIFY'); solid.thickness=.008
bevel=sample.modifiers.new('Soft edges','BEVEL'); bevel.width=.002; bevel.segments=3
bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,-.012))
floor=bpy.context.object
floor_mat=bpy.data.materials.new('Warm gray backdrop'); floor_mat.diffuse_color=(.16,.17,.18,1); floor.data.materials.append(floor_mat)
def aim(obj,point):
    from mathutils import Vector
    obj.rotation_euler=(Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.light_add(type='AREA',location=(-.5,-.7,1.5))
light=bpy.context.object;light.data.energy=100;light.data.shape='RECTANGLE';light.data.size=1.0;light.data.size_y=.4;aim(light,(0,0,0))
bpy.ops.object.camera_add(location=(.82,-1.05,1.0))
camera=bpy.context.object;aim(camera,(0,0,0));camera.data.type='ORTHO';camera.data.ortho_scale=1.35
scene=bpy.context.scene;scene.camera=camera;scene.render.engine='CYCLES';scene.cycles.samples=32
scene.world.color=(.15,.15,.15)
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
scene.render.filepath=str(ROOT/'rubber-preview.png')
for im in maps.values(): im.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'rubber-material.blend'))
bpy.ops.render.render(write_still=True)
