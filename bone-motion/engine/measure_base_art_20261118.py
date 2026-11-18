"""Read-only measurement sheets: no art mutation or online skeleton estimate."""
from pathlib import Path
import json, hashlib
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'bone-motion/out/base-art-measurement-20261118'
OUT.mkdir(parents=True,exist_ok=True)
IDS=['1','15','16','35','32','33','xuchu','simayi']
FONT=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',13)
def sheet(hid,paths,label):
    board=Image.new('RGB',(1620,780),'#29313c');d=ImageDraw.Draw(board)
    for i,(view,path) in enumerate(zip(['front','side','back'],paths)):
        im=Image.open(path).convert('RGBA')
        if im.size!=(256,256): im=im.resize((256,256),Image.Resampling.NEAREST)
        bg=Image.new('RGBA',(256,256),'#3c4554'); bg.alpha_composite(im)
        crop=bg.crop((40,0,216,240)).resize((528,720),Image.Resampling.NEAREST)
        board.paste(crop,(i*540+12,40))
        d.text((i*540+12,5),label+' '+view+' | original pixel coordinates',font=FONT,fill='white')
        for y in range(0,241,10):
            yy=40+y*3
            d.line((i*540+12,yy,i*540+539,yy),fill='#536477')
            d.text((i*540+14,yy+1),str(y),font=FONT,fill='#a7d8ff')
        for x in range(50,211,10):
            xx=i*540+12+(x-40)*3
            d.line((xx,40,xx,760),fill='#536477')
            d.text((xx,24),str(x),font=FONT,fill='#a7d8ff')
    board.save(OUT/f'{hid}-grid.png')
for hid in IDS:
    sheet(hid,[ROOT/'bone-motion/art-in'/hid/'base-review-v1'/f'{v}.png' for v in ['front','side','back']],hid+' review-v1')
sheet('1-candidate',[ROOT/'bone-motion/out/guanyu-base-v2-guides'/f'candidate-{v}.png' for v in ['front','side','back']],'1 candidate-v2')
print(OUT)
