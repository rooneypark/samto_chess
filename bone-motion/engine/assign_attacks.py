"""Pick each hero's three basic attacks so that the four clips a player sees from that hero (three attacks and the skill)
are as different from each other as the type allows, and no two heroes of a type share the same three.

    python -X utf8 bone-motion/engine/assign_attacks.py        -> bone-motion/hero-attacks.json, then run make_heroes.mjs

Distances come from variety.py. Any three of the type's six attacks may be chosen (every attack starts and ends in the
guard); they are played in slot order. Heroes whose clips are already generated keep their attacks (FIXED).
궁 is left as it is: its attacks are all a shot by nature, and the difference is carried by the arrow effect (user 2026-11-19).
"""
import itertools, json, os, sys, importlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, variety

FIXED = {      # pictures that are kept as they are: these must never change when this script is run again
    '황충': ['a1', 'a2', 'a3'], '요화': ['a1', 'a2', 'b3'],      # generated on the old bones and not in the launch twenty
    # long pole weapons on horseback: swings only, held long (clips/mounted_long.py; user decisions 2026-11-19/20)
    '여포': ['a1', 'a2', 'b2'], '마초': ['b2', 'b1', 'a3'], '공손찬': ['a2', 'b1', 'b2']}
BASIC = ('의용보병', '의용궁병', '군영참모', '검병', '창병', '기본 검병', '기본 창병', '기본 방패병', '기본 궁병', '기본 책사')      # plain motion: the clips as written (p ids), no big move
ATTACKS = ['a1', 'b1', 'a2', 'b2', 'a3', 'b3', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6']      # cN = the type's big move sN offered as a basic attack (snappy.py)

if __name__ == '__main__':
    src = open(os.path.join(sm.WORK, 'sim', 'heroes.js'), encoding='utf-8').read(); heroes = json.loads(src[src.index('['):src.rindex(']') + 1])
    fams = {}; out = {}; report = []
    for h in heroes: fams.setdefault(h['family'], []).append(h)
    for fam, hs in fams.items():
        m = importlib.import_module('clips.' + fam); ids = [c for c in m.CLIPS if c not in ('idle', 'move')]
        tr = {c: variety.track(fam, c)[0] for c in ids}; D = {frozenset((a, b)): variety.distance(tr[a], tr[b]) for a in ids for b in ids if a != b}
        own = [a for a in ATTACKS if a in ids and not __import__('snappy').is_spin(m.CLIPS[a])]      # no attack in which the body turns a full circle (user 2026-11-20)
        used = [frozenset(FIXED[h['name']]) for h in hs if h['name'] in FIXED]
        score = lambda four: (min(D[frozenset(p)] for p in itertools.combinations(four, 2)), sum(D[frozenset(p)] for p in itertools.combinations(four, 2)))
        for h in hs:
            if h['name'] in FIXED: trio = FIXED[h['name']]
            else:
                # one of the three is a big move (never the hero's own skill under its attack id), the other two are plain attacks
                big = [c for c in own if c[0] == 'c' and c != 'c' + h['skillClip'][1:]]; plain = [c for c in own if c[0] != 'c']
                trios = [tuple(p) + (c,) for p in itertools.combinations(plain, 2) for c in big] + [(p,) + tuple(c) for p in plain for c in itertools.combinations(big, 2)]      # one or two big moves
                trios = trios or list(itertools.combinations(plain, 3))
                if h['name'] in BASIC: trios = list(itertools.combinations(['p' + c for c in plain if 'p' + c in ids], 3))
                options = sorted((score(list(t) + [h['skillClip']]), t) for t in trios)
                fresh = [o for o in options if frozenset(o[1]) not in used]
                trio = list((fresh or options)[-1][1]); used.append(frozenset(trio))
            out[h['name']] = trio; mn = score(trio + [h['skillClip']])[0]
            report.append((mn, '%s %s: %s + %s  (가장 비슷한 두 클립 %.1fpx)' % (m.TITLE, h['name'], ' '.join(trio), h['skillClip'], mn)))
    json.dump(out, open(os.path.join(sm.WORK, 'hero-attacks.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    for mn, line in sorted(report): print(('부족 ' if mn < 9 else '      ') + line)
