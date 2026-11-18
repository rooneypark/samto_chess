import json
from pathlib import Path
from PIL import Image,ImageDraw
ids=['0','119','xuhuang','xunyu','machao','sunquan','ganning','taishici','sunshangxiang','diaochan']
for start in [0,5]:
 sheet=Image.new('RGB',(840,5*270),(55,59,65));d=ImageDraw.Draw(sheet)
 for row,id in enumerate(ids[start:start+5]):
  for col,v in enumerate(['front','side','back']):
   path=Path(f'bone-motion/art-in/{id}/base-final-v1/{v}.png') if v=='front' else Path(f'bone-motion/art-in/{id}/body-review-v1/aligned-{v}.png')
   revised=Path(f'bone-motion/art-in/{id}/body-review-v2/aligned-{v}.png')
   if v!='front' and revised.exists():path=revised
   x=col*280;y=row*270+14;d.text((x,y-13),id+' '+v,fill='white')
   if not path.exists():continue
   im=Image.open(path).convert('RGBA');sheet.paste(im,(x,y),im)
   for yy in [80,100,120,140,160,180,200,224]:
    d.line((x,y+yy,x+256,y+yy),fill=(70,100,90));d.text((x+2,y+yy-8),str(yy),fill=(150,160,150))
 sheet.save(f'bone-motion/out/ground-audit/body-check-{start}.png')
