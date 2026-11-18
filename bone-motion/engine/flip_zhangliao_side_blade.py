"""User-authorized lossless pixel reflection of the side-view glaive head only."""
import hashlib, json
from collections import deque, Counter
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
folder = ROOT / 'bone-motion/art-in/34/base-v1'
path = folder/'side.png'
report_path = folder/'blade-flip-qa.json'
if report_path.exists():
    raise SystemExit('Already applied; refusing to flip twice.')
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
before_hash = {n:digest(folder/f'{n}.png') for n in ('front','side','back')}
original = Image.open(path).convert('RGBA')
assert original.size == (256,256)
# The blade and large gold collar end at y=68. Keep the lower ferrule, shaft and grip fixed.
# Find their disconnected opaque component; the helmet/plume is another component.
core = {(124,40)}; queue = deque(core)
while queue:
    x,y = queue.popleft()
    for dx in (-1,0,1):
        for dy in (-1,0,1):
            p=x+dx,y+dy
            if 95<=p[0]<150 and 18<=p[1]<=68 and p not in core and original.getpixel(p)[3]>128:
                core.add(p); queue.append(p)
assert len(core)==559, 'Source changed; inspect the new source before selecting a mask.'
# Preserve the existing one-pixel translucent fringe without taking any opaque plume pixels.
mask=set(core)
for x,y in core:
    for dx in (-1,0,1):
        for dy in (-1,0,1):
            p=x+dx,y+dy
            if 18<=p[1]<=68 and 0<original.getpixel(p)[3]<=128:
                mask.add(p)
reflect = lambda p:(244-p[0],p[1])  # shaft centre x=122; integer reflection, no interpolation
target={reflect(p) for p in mask}
collision=[p for p in target-mask if original.getpixel(p)[3]>128]
assert not collision, f'Overlaps other artwork: {collision}'
result=original.copy()
for p in mask: result.putpixel(p,(0,0,0,0))
for p in mask: result.putpixel(reflect(p),original.getpixel(p))
changed={(x,y) for y in range(256) for x in range(256) if original.getpixel((x,y))!=result.getpixel((x,y))}
assert not changed-(mask|target)
assert all(result.getpixel(reflect(p))==original.getpixel(p) for p in mask)
assert Counter(original.getpixel(p) for p in mask)==Counter(result.getpixel(p) for p in target)
assert all(original.getpixel((x,y))==result.getpixel((x,y)) for y in range(69,256) for x in range(256))
out=ROOT/'bone-motion/out/zhangliao-base-v2-guides'
out.mkdir(exist_ok=True)
result.crop((98,20,150,86)).resize((416,528),Image.Resampling.NEAREST).save(out/'blade-after-inspection.png')
result.save(path)
after_hash={n:digest(folder/f'{n}.png') for n in ('front','side','back')}
assert before_hash['front']==after_hash['front'] and before_hash['back']==after_hash['back']
report={
 'operation':'integer horizontal reflection of blade and upper collar, x_new=244-x; not image generation',
 'axis_x':122,'last_edited_row':68,'core_pixels':len(core),'selected_pixels_with_alpha_fringe':len(mask),
 'changed_pixels':len(changed),'changes_outside_source_and_destination_mask':0,
 'body_helmet_plume_shaft_grip_rows_69_to_255':'RGBA pixel-identical',
 'overlap_with_other_opaque_artwork':0,'selected_pixel_RGBA_multiset':'identical',
 'canvas':[256,256],'before_sha256':before_hash,'after_sha256':after_hash,
 'mask_row_spans':{str(y):[min(x for x,yy in mask if yy==y),max(x for x,yy in mask if yy==y)] for y in sorted({y for x,y in mask})}
}
report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='mask_row_spans'},ensure_ascii=False,indent=2))
