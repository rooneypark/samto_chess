"""Read-only asset QA and comparison render; never edits source sprites."""
from pathlib import Path
import json, hashlib
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'bone-motion/art-in/review-5v5-v1'
BATCH=json.loads((OUT/'final-sources.json').read_text(encoding='utf-8'))
FONT=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',20)
SMALL=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',14)
report=[]
def board(w,h):
    im=Image.new('RGB',(w,h),'#252a35'); d=ImageDraw.Draw(im)
    for y in range(40,h,16):
        for x in range(0,w,16):
            d.rectangle((x,y,x+15,y+15),fill=('#343a46' if (x//16+y//16)%2 else '#303540'))
    return im
allboard=Image.new('RGB',(1536,8*552),'#20242d')
for row,hero in enumerate(BATCH['heroes']):
    sheet=board(1536,552); d=ImageDraw.Draw(sheet)
    for col,view in enumerate(('front','side','back')):
        path=ROOT/'bone-motion/art-in'/hero['id']/'base-review-v1'/f'{view}.png'
        im=Image.open(path).convert('RGBA'); a=im.getchannel('A'); mask=a.point(lambda x:255 if x>=128 else 0)
        bbox=mask.getbbox(); body=mask.crop((100,180,153,244)).getbbox(); foot_y=180+body[3]-1 if body else None
        item={'id':hero['id'],'name':hero['name'],'view':view,'size':list(im.size),'mode':im.mode,'opaque_bbox':bbox,'central_foot_bottom_estimate':foot_y,'pivot_target':[128,224],'foot_delta_estimate':foot_y-224 if foot_y else None,'transparent_corners':all(a.getpixel(p)==0 for p in [(0,0),(255,0),(0,255),(255,255)]),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
        report.append(item)
        sheet.paste(im.resize((512,512),Image.Resampling.NEAREST),(col*512,40),im.resize((512,512),Image.Resampling.NEAREST))
        d.text((col*512+12,8),hero['name']+' · '+{'front':'정면','side':'왼쪽 측면','back':'후면'}[view],font=FONT,fill='white')
    sheet.save(OUT/f"{hero['id']}-three-views.png")
    allboard.paste(sheet,(0,row*552))
allboard.save(OUT/'all-eight-three-views.png')
(OUT/'pixel-qa.json').write_text(json.dumps({'status':'review; not rig-approved','notes':['Opaque bbox includes weapons/headgear; it is NOT anatomical body height.','Foot estimate uses central x100..152 lower region and must be visually checked.','Full-canvas scale plus integer Y canvas registration; no per-image contain fitting.','Nearest hoof/sole bottom aligned to224; this alone does not certify a solved3D ground pivot.'],'images':report},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{'id':r['id'],'view':r['view'],'bbox':r['opaque_bbox'],'foot':r['central_foot_bottom_estimate'],'delta':r['foot_delta_estimate']} for r in report],ensure_ascii=False))
