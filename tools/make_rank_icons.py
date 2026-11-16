"""Temporary arena rank emblems (six tiers) until the commissioned art arrives.

    python tools/make_rank_icons.py --force

Writes game/assets/ui-temp/rank-1.png .. rank-6.png (96x96, transparent): a badge whose metal and number of
chevrons rise with the tier; the top tier adds a crown. Final art replaces a file under the same name and size.
Request sheet: docs/UI_그림_제작요청_전체목록.md (묶음 K).
"""
import os, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'game', 'assets', 'ui-temp')
INK = (20, 28, 42, 255)
# tier -> (badge fill, chevron colour)
TIERS = [((122, 92, 62, 255), (214, 170, 120, 255)),     # 병졸: bronze
         ((86, 104, 124, 255), (196, 210, 224, 255)),    # 백부장: iron
         ((62, 110, 150, 255), (226, 236, 246, 255)),    # 교위: steel blue, silver marks
         ((48, 138, 104, 255), (246, 211, 122, 255)),    # 장군: jade, gold marks
         ((160, 66, 58, 255), (250, 220, 130, 255)),     # 대장군: red, gold marks
         ((112, 82, 160, 255), (255, 232, 150, 255))]    # 천하무쌍: purple, gold marks + crown

def emblem(index):
    fill, mark = TIERS[index]
    im = Image.new('RGBA', (96, 96), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    top = 20 if index == 5 else 10
    d.polygon([(14, top), (82, top), (82, 58), (48, 88), (14, 58)], fill=fill, outline=INK, width=5)
    count = min(index + 1, 5)
    step = 9 if count > 3 else 11
    start = top + 12 + (5 - count) * step // 2 - (4 if index == 5 else 0)
    for i in range(count):
        y = start + i * step
        d.line([(28, y), (48, y + 8), (68, y)], fill=INK, width=8, joint='curve')
        d.line([(28, y), (48, y + 8), (68, y)], fill=mark, width=4, joint='curve')
    if index == 5:
        d.polygon([(26, 20), (26, 6), (37, 14), (48, 3), (59, 14), (70, 6), (70, 20)], fill=mark, outline=INK, width=3)
    return im

def main():
    os.makedirs(OUT, exist_ok=True)
    for index in range(6):
        emblem(index).save(os.path.join(OUT, 'rank-%d.png' % (index + 1)))
    print('wrote 6 rank emblems to', OUT)

if __name__ == '__main__':
    if '--force' not in sys.argv:
        sys.exit('This overwrites game/assets/ui-temp/rank-*.png with stand-ins; pass --force if that is intended.')
    main()
