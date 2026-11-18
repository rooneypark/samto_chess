"""Export the approved final manifests without duplicating PNG files."""
import json, os, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SIM=ROOT/'bone-motion/sim'
SOURCES=json.loads((ROOT/'art-source/motions/v1/2/sim-sources.json').read_text(encoding='utf-8'))
def main():
 out={}
 for clip,views in SOURCES.items():
  out[clip]={}
  for view,rel in views.items():
   p=ROOT/rel;d=json.loads(p.read_text(encoding='utf-8'))
   paths=[(p.parent/n).resolve() for n in d['files']]
   assert d['status']=='user_approved' and all(q.is_file() for q in paths)
   assert len(paths)==len(d['durations_ms'])
   out[clip][view]={'files':[os.path.relpath(q,SIM).replace(chr(92),'/') for q in paths], 'durations':d['durations_ms'],'pivot':d['pivot'],'source':rel,'sha256':[hashlib.sha256(q.read_bytes()).hexdigest() for q in paths]}
 (SIM/'zhangfei-clips.js').write_text('window.ZHANGFEI_CLIPS = '+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
 print('Exported 18 final approved clips')
if __name__=='__main__':main()
