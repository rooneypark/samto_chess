from PIL import Image,ImageDraw
from pathlib import Path
sheet=Image.new('RGB',(1536,512),(60,60,60));d=ImageDraw.Draw(sheet)
for i,v in enumerate(['front','side','back']):
 im=Image.open(f'bone-motion/art-in/119/base-final-v1/{v}.png');im=im.resize((512,512),Image.Resampling.NEAREST);sheet.paste(im,(i*512,0),im)
 for y in range(40,225,10):
  d.line((i*512,y*2,i*512+512,y*2),fill=(80,100,90));d.text((i*512+5,y*2),str(y),fill='white')
 d.text((i*512+220,10),v,fill='white')
sheet.save('bone-motion/out/ground-audit/lvbu-measure.png')
