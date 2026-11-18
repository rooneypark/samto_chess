import json
from pathlib import Path
from PIL import Image
import numpy as np
p=Path('bone-motion/art-in/roster-49-v1');d=json.loads((p/'ground-alignment.json').read_text(encoding='utf-8-sig'));errors=[]
for r in d['views']:
 a=np.array(Image.open(r['path']))[:,:,3];scale=r['size'][0]/256;dx,dy=r['offset'];lo,hi=[round(z*scale)+dx for z in r['foot_roi']];yy,xx=np.indices(a.shape);m=(a>=128)&(xx>=lo)&(xx<hi);bottom=int(np.where(m)[0].max()+1)
 if bottom!=r['target_foot_y']:errors.append([r['id'],r['view'],bottom,r['target_foot_y']])
assert not errors,errors
print('Foot ROI check: 147/147 passed; changed=',sum(r['offset']!=[0,0] for r in d['views']),'unchanged=',sum(r['offset']==[0,0] for r in d['views']))
