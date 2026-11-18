import json,hashlib,shutil
from pathlib import Path
root=Path.cwd(); gallery=root/'bone-motion/art-in/roster-49-v1';report=json.loads((gallery/'body-review.json').read_text(encoding='utf8'));selected={}
for id in report['ids']:
 selected[id]={}
 for v in ['side','back']:
  d=root/f'bone-motion/art-in/{id}/body-review-v2'
  if not (d/f'aligned-{v}.png').exists():d=root/f'bone-motion/art-in/{id}/body-review-v1'
  src=d/f'aligned-{v}.png';dest=root/f'bone-motion/art-in/{id}/base-final-v1/{v}.png'
  assert src.exists()
  meta=json.loads((d/f'{v}-generation.json').read_text(encoding='utf-8-sig'))
  aligned=json.loads((d/f'aligned-{v}.json').read_text(encoding='utf-8-sig'))
  meta.update({'status':'body-corrected-awaiting-user-review','ground_alignment':aligned,'comparison':'Frontal master unchanged; anatomical size and proportions visually compared at common ground. Not a full rig pass.'})
  shutil.copyfile(src,dest)
  assert src.read_bytes()==dest.read_bytes()
  (dest.with_name(v+'-generation.json')).write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf8')
  a={'id':id,'view':v,'path':dest.relative_to(root).as_posix(),'size':[256,256],'pivot':[128,224],'logical_pivot':[128,224],'target_foot_y':224,'method':'Builtin image_gen redraw followed by lossless integer canvas ground alignment; the pre-redraw pixels are intentionally replaced.','generation':dest.with_name(v+'-generation.json').relative_to(root).as_posix(),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'status':'body-corrected-awaiting-user-review'}
  dest.with_name(v+'-alignment.json').write_text(json.dumps(a,ensure_ascii=False,indent=2),encoding='utf8');selected[id][v]=a['path']
report.update(status='correction-complete-awaiting-user-review',selected=selected,redrawn_views=20,front_masters_unchanged=True,full_rig_verified=False)
(gallery/'body-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
g=json.loads((gallery/'ground-alignment.json').read_text(encoding='utf-8-sig'));g['status']='ground-aligned; 10 hero body corrections await visual review';g['views']=[json.loads((root/r['path']).with_name(r['view']+'-alignment.json').read_text(encoding='utf-8-sig')) for r in g['views']];g['method']='Original standing art translated without resampling. Twenty side/back images subsequently redrawn for body consistency and aligned. See per-view metadata.'
(gallery/'ground-alignment.json').write_text(json.dumps(g,ensure_ascii=False,indent=2),encoding='utf8')
print('20 views installed; 10 frontal masters unchanged')
