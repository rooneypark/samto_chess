# Run: blender -b -t 1 -P export-neutral.py
import bpy, json
from mathutils import Vector
from pathlib import Path
b=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
def v(x):
 a,f,h=x
 return Vector((a/100,-f/100,h/100))
for i,(label,fn) in enumerate([('INFANTRY','samto-body-neutral.json'),('TACTICIAN','tactician.json'),('CAVALRY','mounted.json')]):
 D=json.loads((b/fn).read_text()); p=D['coordinates']; parent=D['parents']
 collection=bpy.data.collections.new(label); bpy.context.scene.collection.children.link(collection)
 groups=['h_','r_'] if i==2 else ['']
 for prefix in groups:
  rig=bpy.data.armatures.new(label+prefix); obj=bpy.data.objects.new(label+(' Horse' if prefix=='h_' else ' Rider' if prefix=='r_' else ' Human'),rig);collection.objects.link(obj)
  obj.location.x=3*i; obj.show_in_front=True;rig.display_type='OCTAHEDRAL'
  bpy.context.view_layer.objects.active=obj; obj.select_set(True)
  bpy.ops.object.mode_set(mode='EDIT')
  for name,pt in p.items():
   if not name.startswith(prefix):continue
   bone=rig.edit_bones.new(name)
   prev=parent[name]
   bone.head=v(p[prev]) if prev else v(pt)-Vector((0,0,.045))
   bone.tail=v(pt)
   assert (bone.tail-bone.head).length>0.00001,(label,name,bone.head,bone.tail)
   if prev:
    bone.parent=rig.edit_bones[prev]; bone.use_connect=True
  bpy.ops.object.mode_set(mode='OBJECT')
  actual={x.name for x in obj.data.bones}
  assert actual=={n for n in p if n.startswith(prefix)}
  for n in actual:assert (obj.data.bones[n].tail_local-v(p[n])).length<1e-6
  obj.select_set(False)
bpy.ops.wm.save_as_mainfile(filepath=str(b/'samto-class-neutral.blend'))
