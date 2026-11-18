"""Build every clip of every family and print one line each.   python bone-motion/engine/buildall.py [family ...]"""
import importlib, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import build
from overview import FAMILIES

if __name__ == '__main__':
    bad = 0
    for f in sys.argv[1:] or FAMILIES:
        for cid in importlib.import_module('clips.' + f).CLIPS:
            r = build(f, cid); bad += bool(r['fail'])
            print('%-14s %-5s %s  clearance %s  balance max %s' % (f, cid, 'FAIL' if r['fail'] else 'PASS', r.get('min_clearance_weapon_px'), max(r.get('balance_outside_px', [0]))))
            for x in r['fail']: print('      -', x)
            if r['fail'] and 'balance_outside_px' in r: print('      balance', r['balance_outside_px'])
    print('failed clips:', bad)
