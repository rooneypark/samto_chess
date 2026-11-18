import json, math
from pathlib import Path
import numpy as np
from PIL import Image
p=Path('bone-motion/out/ground-audit');rows=json.loads((p/'audit.json').read_text(encoding='utf8'))
# Visually reviewed shoe/hoof windows; exclude staff, sword and garment ends.
rois={
'1':[(105,149),(83,173),(107,153)],'2':[(96,163),(108,147),(100,167)],'15':[(103,151),(83,171),(104,154)],'119':[(100,160),(82,173),(101,160)],'34':[(101,159),(79,175),(101,160)],'machao':[(99,159),(82,173),(100,161)],'gongsunzan':[(101,158),(80,172),(101,160)],
'32':[(101,148),(111,142),(109,161)],'33':[(100,148),(109,143),(107,158)],'77':[(100,155),(106,142),(106,162)],'infantry':[(100,153),(108,145),(104,162)],
'dianwei':[(95,165),(106,151),(99,166)],'xuchu':[(90,175),(106,146),(90,175)],'xuhuang':[(115,163),(110,149),(103,161)],
'yuejin':[(99,161),(105,145),(103,165)],'caohong':[(98,161),(106,149),(102,165)],'jiangwei':[(100,155),(107,144),(103,159)],'weiyan':[(99,163),(109,150),(101,165)],'liaohua':[(100,157),(108,143),(103,159)],
'zhoucang':[(99,163),(109,147),(101,165)],'sunce':[(98,162),(103,142),(102,164)],'luxun':[(103,159),(108,146),(104,162)],'sunquan':[(98,164),(108,151),(101,166)],'lumeng':[(99,161),(106,146),(101,164)],'huanggai':[(99,162),(106,150),(101,166)],
'zhangjue':[(100,160),(108,153),(103,164)],'dongzhuo':[(86,181),(98,156),(90,178)],'huatuo':[(107,154),(108,154),(103,161)],'yanliang':[(99,162),(112,151),(103,165)],'wenchou':[(98,164),(106,150),(99,165)],'huaxiong':[(99,163),(109,151),(99,166)]}
for r in rows:
 v=['front','side','back'].index(r['view']);l,h=rois.get(r['id'],[(100,164)]*3)[v];s=r['scale'];a=np.array(Image.open(r['path']))[:,:,3];yy,xx=np.indices(a.shape);m=(a>=128)&(xx>=round(l*s))&(xx<round(h*s));y,x=np.where(m);bottom=int(y.max()+1);foot=m&(yy>=bottom-round(3*s));fy,fx=np.where(foot);cx=(fx.min()+fx.max()+1)/2
 dx=math.floor(128*s-cx+0.5);dy=round(224*s)-bottom
 # Pole overlaps Xu Huang's left boot: use the visually reviewed boot-pair center.
 if r['id']=='xuhuang' and r['view']=='front':cx=128;dx=0
 r.update(roi=[l,h],foot_bottom=bottom,foot_center=float(cx),offset=[dx,dy])
 y,x=np.where(a>0);bad=(x+dx<0)|(x+dx>=a.shape[1])|(y+dy<0)|(y+dy>=a.shape[0]);r['edge_noise_pixels']=int(bad.sum());r['edge_noise_max_alpha']=int(a[y[bad],x[bad]].max()) if bad.any() else 0
 assert r['edge_noise_max_alpha']<=1,(r['id'],r['view'])
(p/'plan.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
print('changed',sum(r['offset']!=[0,0] for r in rows),'unchanged',sum(r['offset']==[0,0] for r in rows));print('y shifts',min(r['offset'][1]/r['scale'] for r in rows),max(r['offset'][1]/r['scale'] for r in rows));print('large x',[(r['id'],r['view'],r['offset']) for r in rows if abs(r['offset'][0]/r['scale'])>8])
