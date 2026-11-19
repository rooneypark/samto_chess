"""Remove obsolete runtime stills and only rebuild their existing local asset archives.

Does not discover/package concurrent artwork, touch source art, or publish anything.
"""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def retired(relative, ids):
    p = Path(relative)
    if p.suffix.lower() != '.png':
        return False
    if relative.startswith(('game/assets/generals-v2/', 'game/assets/heroes/')):
        return True
    if relative.startswith(('game/assets/gate-lobby/', 'game/assets/design-a/portraits/')):
        return p.stem in ids
    if relative.startswith('game/assets/battle-v2/'):
        return p.stem.rsplit('-', 1)[0] in ids
    return relative in {'game/assets/shop-v2/recruit-hall-v3.png', 'game/assets/shop-v2/recruitment-hall.png'}


def main():
    catalog_path = ROOT/'asset-packs/catalog.json'
    catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
    roster = json.loads((ROOT/'art-source/characters/v1/manifest.json').read_text(encoding='utf-8'))
    ids = {e['id'] for e in roster['entries']}
    removed = []
    for archive in catalog['archives']:
        targets = [f for f in archive['files'] if retired(f['path'], ids)]
        if not targets:
            continue
        archive_path = ROOT/archive['path']
        if hashlib.sha256(archive_path.read_bytes()).hexdigest() != archive['sha256']:
            raise ValueError('Local archive differs from catalog: '+str(archive_path))
        for item in targets:
            target = (ROOT/item['path']).resolve()
            if not target.is_relative_to((ROOT/'game/assets').resolve()):
                raise ValueError('Outside runtime assets')
            if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() != item['sha256']:
                raise ValueError('Local asset has unrecorded changes: '+str(target))
        drop = {f['path'] for f in targets}
        temporary = archive_path.with_suffix('.retiring')
        with zipfile.ZipFile(archive_path) as source, zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as output:
            for info in source.infolist():
                if info.filename not in drop:
                    output.writestr(info, source.read(info.filename))
        blob = temporary.read_bytes()
        temporary.replace(archive_path)
        archive.update(bytes=len(blob), sha256=hashlib.sha256(blob).hexdigest(), files=[f for f in archive['files'] if f['path'] not in drop])
        for item in targets:
            (ROOT/item['path']).unlink(missing_ok=True)
            removed.append(item['path'])
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'removed': len(removed), 'paths': removed}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
