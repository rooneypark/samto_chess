"""Build the offline checker from verified, approved asset packs. Stdlib only."""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
from pathlib import Path, PurePosixPath
import struct
import sys
import webbrowser
import zipfile

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'test-artifacts/character-checker/samto-character-motion-checker.html'
DIRECTIONS = ('front', 'side', 'back')


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def sha(data):
    return hashlib.sha256(data).hexdigest()


def checked_path(relative):
    parts = PurePosixPath(relative)
    if parts.is_absolute() or '..' in parts.parts or '\\' in relative or ':' in relative:
        raise ValueError(f'Unsafe asset path: {relative}')
    path = (ROOT / relative).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError(f'Asset path escapes repository: {relative}')
    return path


def build(output):
    roster = read_json(ROOT / 'art-source/characters/v1/manifest.json')
    motion = read_json(ROOT / 'art-source/motions/v1/15/manifest.json')
    catalog = read_json(ROOT / 'asset-packs/catalog.json')
    if roster['artRevision'] != 'pixel256-v1' or len(roster['entries']) != 49:
        raise ValueError('Expected the latest pixel256-v1 roster of 49 characters.')
    # Every approved clip in the manifest is shown, so adding a clip needs no change here.
    order = [f'{view}-{action}' for action in ('idle', 'move', 'attack', 'skill') for view in DIRECTIONS]
    clip_ids = [c['clipId'] for c in motion['clips']]
    if motion['reviewStatus'] != 'approved' or not clip_ids or len(set(clip_ids)) != len(clip_ids) or not all(c['frames'] for c in motion['clips']):
        raise ValueError('Expected approved Zhao Yun clips with unique ids and at least one frame each.')
    frame_total = sum(len(c['frames']) for c in motion['clips'])
    wanted, heroes = {}, []
    for entry in sorted(roster['entries'], key=lambda e: e['order']):
        base = f"art-source/characters/v1/{entry['folder']}/"
        detail = read_json(checked_path(base + 'manifest.json'))
        hero = {k: entry[k] for k in ('id', 'name', 'faction')}
        hero['images'] = {}
        for direction in DIRECTIONS:
            record = detail['files'][direction]
            path = base + record['path']
            checked_path(path)
            wanted[path] = record['sha256']
            hero['images'][direction] = path
        heroes.append(hero)
    if len(wanted) != 147 or len({h['id'] for h in heroes}) != 49:
        raise ValueError('Duplicate or missing character assets.')
    clips = []
    for clip in sorted(motion['clips'], key=lambda c: (order.index(c['clipId']) if c['clipId'] in order else len(order), c['clipId'])):
        if clip['view'] not in DIRECTIONS or clip['canvas'] != [256, 256] or clip['anchor'][1] != 224 or not 0 <= clip['anchor'][0] < 256:
            raise ValueError('Unexpected motion canvas or pivot.')
        frames = []
        for frame in clip['frames']:
            if not 0 < frame['durationMs'] <= 10000:
                raise ValueError('Invalid frame duration.')
            if wanted.setdefault(frame['file'], frame['sha256']) != frame['sha256']:
                raise ValueError(f"Frame listed with two different hashes: {frame['file']}")
            frames.append({'image': frame['file'], 'duration': frame['durationMs']})
        clips.append({'heroId': '15', 'status': 'approved', 'action': clip['clipId'].split('-', 1)[1], 'id': clip['clipId'], 'view': clip['view'], 'anchor': clip['anchor'], 'frames': frames})
    # A clip may reuse another clip's frame file, so the image count can be below 147 + frame_total.
    for direction, expected in motion['inputSha256'].items():
        if wanted[f'art-source/characters/v1/15/{direction}.png'] != expected:
            raise ValueError('Motion input no longer matches the character artwork.')

    images, records, archives = {}, [], []
    # Extract only the requested entries into memory. Never restore over local edits.
    for archive in catalog['archives']:
        selected = [f for f in archive['files'] if f['path'] in wanted]
        if not selected:
            continue
        path = checked_path(archive['path'])
        blob = path.read_bytes()
        if len(blob) != archive['bytes'] or sha(blob) != archive['sha256']:
            raise ValueError(f'Corrupt asset pack: {archive["path"]}')
        with zipfile.ZipFile(path) as z:
            if len(z.namelist()) != len(set(z.namelist())):
                raise ValueError('Duplicate ZIP entries.')
            for record in selected:
                name = record['path']
                data = z.read(name)
                if name in images or len(data) != record['bytes'] or sha(data) != record['sha256'] or sha(data) != wanted[name]:
                    raise ValueError(f'Image hash/size mismatch: {name}')
                if data[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', data[16:24]) != (256, 256) or data[25] != 6:
                    raise ValueError(f'Expected 256 x 256 RGBA PNG: {name}')
                images[name] = 'data:image/png;base64,' + base64.b64encode(data).decode('ascii')
                records.append(record)
        archives.append({k: archive[k] for k in ('path', 'bytes', 'sha256')})
    if set(images) != set(wanted):
        raise ValueError('Missing packed images: ' + ', '.join(sorted(set(wanted) - set(images))))
    # Review assets are local and explicitly labelled; never presented as packed approvals.
    review_path = ROOT / 'test-artifacts/liaohua-skill-move-review-v1/review.json'
    liaohua_path = ROOT / 'art-source/motions/v1/liaohua/manifest.json'
    if review_path.exists() or liaohua_path.exists():
        local = read_json(review_path if review_path.exists() else liaohua_path)
        for clip in local['clips']:
            frames = []
            for frame in clip['frames']:
                name = frame['file']
                blob = checked_path(name).read_bytes()
                digest = sha(blob)
                if frame.get('sha256') and frame['sha256'] != digest:
                    raise ValueError('Local review hash mismatch: ' + name)
                if blob[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', blob[16:24]) != (256, 256) or blob[25] != 6:
                    raise ValueError('Invalid local review PNG: ' + name)
                if name not in images:
                    images[name] = 'data:image/png;base64,' + base64.b64encode(blob).decode('ascii')
                    records.append({'path': name, 'bytes': len(blob), 'sha256': digest, 'source': 'local-review'})
                frames.append({'image': name, 'duration': frame['durationMs']})
            clips.append({'id': 'liaohua-' + clip['clipId'], 'heroId': 'liaohua', 'action': clip['state'], 'status': clip.get('reviewStatus', 'approved' if clip['state'] == 'attack' else 'user-review-pending'), 'view': clip['view'], 'anchor': [128, 224], 'frames': frames})
            frame_total += len(frames)
    payload = json.dumps({'heroes': heroes, 'clips': clips, 'images': images}, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
    template = Path(__file__).with_name('template.html').read_text(encoding='utf-8')
    if template.count('__CHECKER_DATA__') != 1:
        raise ValueError('Invalid checker template.')
    html = template.replace('__CHECKER_DATA__', payload).encode('utf-8')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(html)
    report = {'characters': 49, 'stillImages': 147, 'motionClips': len(clips), 'motionFrames': frame_total, 'canvas': [256, 256], 'pivot': [128, 224], 'htmlBytes': len(html), 'htmlSha256': sha(html), 'archives': archives, 'files': records}
    output.with_suffix('.verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'OK: 49 characters / 147 stills / {len(clips)} clips / {frame_total} frames. All SHA-256 verified.\nHTML: {output}\nBytes: {len(html)}\nSHA-256: {sha(html)}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    parser.add_argument('--open', action='store_true', help='Open the generated file in the default browser.')
    args = parser.parse_args()
    try:
        output = args.output.resolve()
        build(output)
        if args.open and not webbrowser.open(output.as_uri()):
            raise RuntimeError(f'Could not open browser. Open this HTML manually: {output}')
    except Exception as error:
        print(f'Checker error: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
