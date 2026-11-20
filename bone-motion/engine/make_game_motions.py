"""art-source/motions/v1/<id>/game.json: one file per hero or troop that the game's battle screen reads (game/approved-motion.js),
made from what finalize_heroes.py published. Run after finalize_heroes.py.

    python -X utf8 bone-motion/engine/make_game_motions.py
    -> art-source/motions/v1/<id>/game.json and art-source/motions/v1/game-index.json (the ids that have one)

Schema = the one 장비's hand-made manifest had (2026-11-19), so the game code keeps its shape:
  clips[]: clipId '<front|side|back>-<idle|move|attack|attack2|attack3|skill>', anchor [x, y] (the ground point on the 256 canvas),
           frames[] {file (from the repository root), durationMs}, markers.contact = the index of the hit frame (frame 8 of 15).
  stills: the picture shown when no clip plays, per view (the first idle frame).
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm
ROOT = os.path.dirname(sm.WORK); DEST = os.path.join(ROOT, 'art-source', 'motions', 'v1'); VIEW = {'front': 'front', 'left': 'side', 'rear': 'back'}

def build(hero):
    top = json.load(open(os.path.join(DEST, hero, 'manifest.json'), encoding='utf-8'))
    if 'attacks' not in top: return None
    states = [('idle', 'idle'), ('move', 'move')] + [(c, 'attack' + ('' if i == 0 else str(i + 1))) for i, c in enumerate(top['attacks'])] + [(top['skill'], 'skill')]
    clips = []; stills = {}
    for clip, state in states:
        for v, name in VIEW.items():
            m = json.load(open(os.path.join(ROOT, top['clips'][clip][v]), encoding='utf-8')); base = os.path.dirname(top['clips'][clip][v])
            c = {'clipId': '%s-%s' % (name, state), 'motion': clip, 'view': name, 'state': state, 'canvas': [256, 256], 'anchor': m['pivot'], 'loop': m['loop'],
                 'frames': [{'file': base + '/' + f, 'durationMs': d} for f, d in zip(m['files'], m['durations_ms'])]}
            if state not in ('idle', 'move'): c['markers'] = {'contact': 7}
            clips.append(c)
            if state == 'idle': stills[name] = {'file': c['frames'][0]['file'], 'anchor': m['pivot']}
    return {'schemaVersion': 2, 'id': hero, 'name': top['name'], 'pathBase': 'repository-root', 'reviewStatus': top['reviewStatus'], 'stills': stills, 'clips': clips}

if __name__ == '__main__':
    index = {}
    for hero in sorted(os.listdir(DEST)):
        if not os.path.exists(os.path.join(DEST, hero, 'manifest.json')): continue
        g = build(hero)
        if not g: print('건너뜀 (옛 형식):', hero); continue
        json.dump(g, open(os.path.join(DEST, hero, 'game.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, separators=(',', ':'))
        index[hero] = 'art-source/motions/v1/%s/game.json' % hero; print('%-12s %s %d클립' % (hero, g['name'], len(g['clips'])))
    json.dump(index, open(os.path.join(DEST, 'game-index.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1); print(len(index), '-> game-index.json')
