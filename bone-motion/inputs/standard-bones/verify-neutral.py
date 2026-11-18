# Run: blender -b -t 1 samto-class-neutral.blend -P verify-neutral.py
import bpy, json
from pathlib import Path
from mathutils import Vector
b=Path(__file__).resolve().parent
assert len(bpy.data.actions)==0
assert len(bpy.data.armatures)==4
for label,fn,prefixes in [('INFANTRY','samto-body-neutral.json',['']),('TACTICIAN','tactician.json',['']),('CAVALRY','mounted.json',['h_','r_'])]:
 d=json.loads((b/fn).read_text());p=d['coordinates'];par=d['parents']
 assert set(p)==set(par)
 for k in p:
  assert not any(w in k.lower() for w in ('weapon','armor','ribbon','spear','scarf','fan'))
  x,y,z=p[k]
  assert all(0<=q<256 for q in [128+x,128-x,128-y,224-z]),k
 col=bpy.data.collections[label]
 for pref in prefixes:
  rig=next(o for o in col.objects if all(i.name.startswith(pref) for i in o.data.bones))
  keys={x for x in p if x.startswith(pref)}
  assert len([k for k in keys if par[k] is None])==1
  assert keys==set(rig.data.bones.keys())
  for k in keys:
   x,y,z=p[k]
   bn=rig.data.bones[k]
   assert (bn.tail_local-Vector((x/100,-y/100,z/100))).length<1e-6
   assert (bn.parent.name if bn.parent else None)==par[k]
  print(label, pref, len(keys))
print('NEUTRAL RIGS VERIFIED')
