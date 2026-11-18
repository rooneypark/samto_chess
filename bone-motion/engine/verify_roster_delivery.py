import json,hashlib
from pathlib import Path
from PIL import Image
root=Path.cwd();p=root/'bone-motion/art-in/roster-49-v1';d=json.loads((p/'progress.json').read_text(encoding='utf8'))
assert d['views']==147 and not d['format_issues']
for r in d['records']:
 for v,a in r['views'].items():
  f=root/a['path'];assert hashlib.sha256(f.read_bytes()).hexdigest()==a['sha256'];assert f.parent.name=='base-final-v1'
print('147 canonical PNGs and gallery references verified')
