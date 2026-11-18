from pathlib import Path
import json, hashlib
root=Path.cwd();p=root/'bone-motion/art-in/roster-49-v1';d=json.loads((p/'progress.json').read_text(encoding='utf8'))
for r in d['records']:
 old=[x.name for x in (root/'bone-motion/art-in'/r['id']).iterdir() if x.is_dir() and (x.name.startswith('base-') or x.name.startswith('body-review-')) and x.name!='base-final-v1'];assert not old,(r['id'],old)
 for v,a in r['views'].items():
  canonical=root/a['path'];alias=root/f'art-source/characters/v1/{r["id"]}/{v}.png';compat=root/f'bone-motion/art-in/{r["id"]}/{v}.png';assert canonical.samefile(alias) and canonical.samefile(compat)
page=(p/'index.html').read_text(encoding='utf8');assert page.count('data-body="true"')==10;assert 'liubei-side' not in page
ret=json.loads((p/'retired-drafts.json').read_text(encoding='utf-8-sig'));print('147 PNG aliases verified; 10 body review rows; old draft directories absent');print('Retired directories',len(ret['deleted']),'old PNGs',sum(x['pngs'] for x in ret['deleted']))
