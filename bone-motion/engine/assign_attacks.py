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

FIXED = {      # generated already (or being generated): these must never change when this script is run again
    '장비': ['a1', 'a2', 'a3'], '조운': ['a1', 'a2', 'a3'], '요화': ['a1', 'a2', 'b3'], '관우': ['b1', 'a2', 'a3'], '제갈량': ['b1', 'a2', 'b2'],
    '황충': ['a1', 'a2', 'a3'], '조조': ['a2', 'a3', 'b3'], '하후돈': ['a1', 'b1', 'a3'], '장료': ['a1', 'b1', 'a3'], '허저': ['b1', 'a3', 'b3'], '사마의': ['b1', 'a2', 'b3'],
    # pinned by hand: the only trio that keeps 초선's casts 6 px or more from her skill (s4). Same three as 제갈량, whose skill and look differ.
    '초선': ['b1', 'a2', 'b2'], '서황': ['a1', 'a2', 'a3'],
    # a long prop (staff, torch) held like the fan goes below the ground in B2 내려 긋기: these two do not use B2
    '장각': ['b1', 'a2', 'b3'], '육손': ['b1', 'a2', 'b3'],
    # long pole weapons on horseback: swings only, held long, nothing cut (clips/mounted_long.py; user decision 2026-11-19)
    '여포': ['a1', 'a2', 'b3'], '마초': ['a2', 'b1', 'a3'], '공손찬': ['a2', 'b1', 'a3']}
ATTACKS = ['a1', 'b1', 'a2', 'b2', 'a3', 'b3']

if __name__ == '__main__':
    src = open(os.path.join(sm.WORK, 'sim', 'heroes.js'), encoding='utf-8').read(); heroes = json.loads(src[src.index('['):src.rindex(']') + 1])
    fams = {}; out = {}; report = []
    for h in heroes: fams.setdefault(h['family'], []).append(h)
    for fam, hs in fams.items():
        m = importlib.import_module('clips.' + fam); ids = [c for c in m.CLIPS if c not in ('idle', 'move')]
        if fam == 'bow':
            for h in hs: out[h['name']] = h['attacks']
            continue
        tr = {c: variety.track(fam, c)[0] for c in ids}; D = {frozenset((a, b)): variety.distance(tr[a], tr[b]) for a in ids for b in ids if a != b}
        own = [a for a in ATTACKS if a in ids]; used = [frozenset(FIXED[h['name']]) for h in hs if h['name'] in FIXED]
        score = lambda four: (min(D[frozenset(p)] for p in itertools.combinations(four, 2)), sum(D[frozenset(p)] for p in itertools.combinations(four, 2)))
        for h in hs:
            if h['name'] in FIXED: trio = FIXED[h['name']]
            else:
                options = sorted((score(list(t) + [h['skillClip']]), t) for t in itertools.combinations(own, 3))
                fresh = [o for o in options if frozenset(o[1]) not in used]
                trio = list((fresh or options)[-1][1]); used.append(frozenset(trio))
            out[h['name']] = trio; mn = score(trio + [h['skillClip']])[0]
            report.append((mn, '%s %s: %s + %s  (가장 비슷한 두 클립 %.1fpx)' % (m.TITLE, h['name'], ' '.join(trio), h['skillClip'], mn)))
    json.dump(out, open(os.path.join(sm.WORK, 'hero-attacks.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    for mn, line in sorted(report): print(('부족 ' if mn < 9 else '      ') + line)
