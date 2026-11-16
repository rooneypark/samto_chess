"""Deterministic, lossless asset archives. Python standard library only.

The ZIP files are not tracked by Git. asset-packs/release.json names the GitHub release that holds them;
restore/verify download any archive that is missing or stale and check it against catalog.json.
publish uploads the local archives to that release (needs the GitHub CLI, `gh auth login`)."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import urllib.request
import sys
import tempfile
from datetime import datetime
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MEDIA = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.wav', '.ico'}
PREFIXES = ('art-source/', 'game/assets/', 'game/previews/', 'design-delivery/')
LIMIT = 40 * 1024 * 1024
CHUNK = 38 * 1024 * 1024


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_json(path, default=None):
    return json.loads(path.read_text(encoding='utf-8-sig')) if path.exists() else default


def safe_path(root, relative, archive=False):
    p = PurePosixPath(relative)
    if not relative or '\\' in relative or ':' in relative or p.is_absolute() or any(x in ('..', '.', '') for x in p.parts):
        raise ValueError('Unsafe path: ' + relative)
    if archive:
        if len(p.parts) != 3 or p.parts[:2] != ('asset-packs', 'v1') or p.suffix != '.zip':
            raise ValueError('Invalid archive path: ' + relative)
    elif not relative.startswith(PREFIXES) or p.suffix.lower() not in MEDIA:
        raise ValueError('Not an asset path: ' + relative)
    target = root.joinpath(*p.parts).resolve()
    if not target.is_relative_to(root.resolve()) or any(x.is_symlink() for x in [root.joinpath(*p.parts[:i]) for i in range(1, len(p.parts)+1)]):
        raise ValueError('Asset path escapes root: ' + relative)
    return target


def category(relative, factions):
    p = relative.split('/')
    if relative.startswith('art-source/critical-cutins/v1/'):
        return 'critical-cutins'
    if relative.startswith('art-source/characters/v1/'):
        return 'characters-' + factions.get(p[3], 'reference')
    if relative.startswith('art-source/treasures/'):
        return 'treasures'
    if p[:2] in (['art-source', 'motions'], ['art-source', 'effects']):
        return p[1] + '-' + p[3]
    if relative.startswith('game/assets/battle/'):
        return 'runtime-reference'
    if relative.startswith('game/assets/guanyu-motion-v1/'):
        return 'runtime-guanyu'
    if relative.startswith(('game/assets/generals', 'game/assets/heroes/')):
        return 'runtime-generals'
    if relative.startswith('game/assets/'):
        return 'runtime-ui'
    if relative.startswith('game/previews/guanyu-grok-sample/'):
        return 'motion-reference'
    if relative.startswith('game/previews/'):
        return 'ui-previews'
    if relative.startswith('design-delivery/v1/'):
        return 'ui-build-legacy'
    return 'ui-build-reference'


def pack(root, allow_removals=False):
    catalog_path = root/'asset-packs/catalog.json'
    old = read_json(catalog_path, {'archives': []})
    roster = read_json(root/'art-source/characters/v1/manifest.json', {'entries': []})
    names = {'촉': 'shu', '위': 'wei', '오': 'wu', '군웅': 'qun'}
    factions = {str(e['id']): names[e['faction']] for e in roster['entries']}
    groups = {}
    paths = set()
    for prefix in PREFIXES:
        folder = root/prefix
        if not folder.exists():
            continue
        for directory, dirs, files in os.walk(folder):
            dirs[:] = sorted(d for d in dirs if d not in {'node_modules', '__pycache__', '.git', 'test-artifacts'} and not (Path(directory)/d).is_symlink())
            for name in sorted(files):
                file = Path(directory)/name
                if file.suffix.lower() not in MEDIA:
                    continue
                relative = file.relative_to(root).as_posix()
                safe_path(root, relative)
                size = file.stat().st_size
                if size > CHUNK:
                    raise ValueError('Single asset exceeds 38 MiB; split the source clip, not PNG pixels: ' + relative)
                paths.add(relative)
                groups.setdefault(category(relative, factions), []).append((relative, size))
    previous = {f['path'] for a in old['archives'] for f in a['files']}
    missing = previous-paths
    if missing and not allow_removals:
        raise ValueError('Previously packed assets are missing. Restore first, or explicitly use --allow-removals for intentional deletions: ' + ', '.join(sorted(missing)[:5]))
    out = root/'asset-packs/v1'
    out.mkdir(parents=True, exist_ok=True)
    result = {'schemaVersion': 1, 'baselineVersion': 1, 'maxArchiveBytes': LIMIT, 'compression': 'lossless-zip-deflate', 'archives': []}
    with tempfile.TemporaryDirectory(prefix='.packing-', dir=out) as temp:
        staged = []
        for group, values in sorted(groups.items()):
            chunks = [[]]
            size = 0
            for item in sorted(values):
                if size+item[1] > CHUNK and chunks[-1]:
                    chunks.append([])
                    size = 0
                chunks[-1].append(item)
                size += item[1]
            for i, files in enumerate(chunks, 1):
                name = f'{group}-v1-{i:03}.zip'
                temporary = Path(temp)/name
                records = []
                with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
                    for relative, _ in files:
                        data = safe_path(root, relative).read_bytes()
                        info = zipfile.ZipInfo(relative, (1980, 1, 1, 0, 0, 0))
                        info.compress_type = zipfile.ZIP_DEFLATED
                        info.external_attr = 0o100644 << 16
                        z.writestr(info, data, compresslevel=9)
                        records.append({'path': relative, 'bytes': len(data), 'sha256': digest(data)})
                blob = temporary.read_bytes()
                if len(blob) > LIMIT:
                    raise ValueError('Archive exceeds policy: ' + name)
                relative_archive = 'asset-packs/v1/'+name
                result['archives'].append({'path': relative_archive, 'category': group, 'bytes': len(blob), 'sha256': digest(blob), 'files': records})
                staged.append((temporary, safe_path(root, relative_archive, archive=True)))
        for source, target in staged:
            source.replace(target)
        temp_catalog = catalog_path.with_suffix('.tmp')
        temp_catalog.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        temp_catalog.replace(catalog_path)
    current = {a['path'] for a in result['archives']}
    for obsolete in {a['path'] for a in old['archives']}-current:
        safe_path(root, obsolete, archive=True).unlink(missing_ok=True)
    print(f'Packed {len(paths)} assets in {len(result["archives"])} archives; {sum(a["bytes"] for a in result["archives"])/2**20:.2f} MiB')
    return result


def release_info(root):
    info = read_json(root/'asset-packs/release.json')
    if info and not (isinstance(info.get('repo'), str) and isinstance(info.get('tag'), str)):
        raise ValueError('asset-packs/release.json needs "repo" and "tag"')
    return info


def stale_archives(root, catalog):
    for archive in catalog['archives']:
        file = safe_path(root, archive['path'], archive=True)
        if not file.is_file() or file.stat().st_size != archive['bytes'] or digest(file.read_bytes()) != archive['sha256']:
            yield archive, file


def fetch(root):
    """Download archives that are missing or differ from the catalog. Nothing is kept unless its hash matches."""
    catalog = read_json(root/'asset-packs/catalog.json')
    info = release_info(root)
    if not catalog or not info:
        return 0
    wanted = list(stale_archives(root, catalog))
    for index, (archive, file) in enumerate(wanted, 1):
        name = PurePosixPath(archive['path']).name
        url = f"https://github.com/{info['repo']}/releases/download/{info['tag']}/{name}"
        print(f'Downloading {index}/{len(wanted)} {name} ({archive["bytes"]/2**20:.1f} MiB)', flush=True)
        try:
            with urllib.request.urlopen(url, timeout=120) as response:
                data = response.read()
        except OSError as error:
            raise ValueError(f'Download failed: {url} ({error})')
        if len(data) != archive['bytes'] or digest(data) != archive['sha256']:
            raise ValueError('Downloaded archive does not match the catalog (publish may be pending): ' + name)
        file.parent.mkdir(parents=True, exist_ok=True)
        temporary = file.with_suffix('.download')
        temporary.write_bytes(data)
        temporary.replace(file)
    return len(wanted)


def publish(root):
    """Upload the catalogued archives to the release and drop release files the catalog no longer lists."""
    catalog = validated_catalog(root)
    info = release_info(root)
    if not info:
        raise ValueError('Missing asset-packs/release.json')
    gh = shutil.which('gh') or str(Path(os.environ.get('ProgramFiles', 'C:/Program Files'))/'GitHub CLI/gh.exe')
    def run(*args, check=True):
        done = subprocess.run([gh, *args, '--repo', info['repo']], capture_output=True, text=True, encoding='utf-8')
        if check and done.returncode:
            raise ValueError('gh ' + ' '.join(args[:3]) + ' failed: ' + done.stderr.strip())
        return done
    view = run('release', 'view', info['tag'], '--json', 'assets', check=False)
    if view.returncode:
        run('release', 'create', info['tag'], '--title', 'Asset packs ' + info['tag'], '--notes', 'Lossless asset archives listed in asset-packs/catalog.json. Downloaded by tools/asset_packs.py restore.')
        remote = {}
    else:
        remote = {a['name']: a for a in json.loads(view.stdout)['assets']}
    wanted = {PurePosixPath(a['path']).name: a for a in catalog['archives']}
    upload = [str(safe_path(root, a['path'], archive=True)) for name, a in wanted.items()
              if name not in remote or remote[name].get('size') != a['bytes'] or (remote[name].get('digest') or '').removeprefix('sha256:') not in ('', a['sha256'])]
    for start in range(0, len(upload), 4):
        print('Uploading', ', '.join(Path(f).name for f in upload[start:start+4]), flush=True)
        run('release', 'upload', info['tag'], *upload[start:start+4], '--clobber')
    for name in sorted(set(remote)-set(wanted)):
        run('release', 'delete-asset', info['tag'], name, '--yes')
    print(f'Published {len(upload)} archives to {info["repo"]} {info["tag"]}; {len(wanted)-len(upload)} already current; {len(set(remote)-set(wanted))} removed')


def validated_catalog(root):
    catalog = read_json(root/'asset-packs/catalog.json')
    if not catalog or catalog.get('schemaVersion') != 1:
        raise ValueError('Missing/unsupported asset-packs/catalog.json')
    seen = set()
    archives = set()
    for archive in catalog['archives']:
        if archive['path'] in archives:
            raise ValueError('Duplicate archive')
        archives.add(archive['path'])
        file = safe_path(root, archive['path'], archive=True)
        if not file.is_file() or file.stat().st_size > LIMIT or digest(file.read_bytes()) != archive['sha256']:
            raise ValueError('Archive missing, too large or corrupt: ' + archive['path'])
        with zipfile.ZipFile(file) as z:
            records = {f['path']: f for f in archive['files']}
            if len(records) != len(archive['files']) or len(z.namelist()) != len(records) or set(z.namelist()) != set(records):
                raise ValueError('ZIP entries differ from catalog: ' + archive['path'])
            for name, record in records.items():
                safe_path(root, name)
                if name in seen or not 0 <= record['bytes'] <= CHUNK:
                    raise ValueError('Duplicate or oversized entry: ' + name)
                seen.add(name)
                info = z.getinfo(name)
                if info.file_size != record['bytes'] or (info.external_attr >> 16) & 0o170000 == 0o120000:
                    raise ValueError('Size/link mismatch: ' + name)
                if digest(z.read(name)) != record['sha256']:
                    raise ValueError('Asset hash mismatch: ' + name)
    return catalog


def restore(root, overwrite=False):
    fetch(root)
    # Validate the entire download and all conflicts BEFORE writing anything.
    catalog = validated_catalog(root)
    receipt = read_json(root/'.asset-state.json', {'files': {}})['files']
    desired = {f['path']: f['sha256'] for a in catalog['archives'] for f in a['files']}
    conflicts = []
    changes = set()
    for relative, expected in desired.items():
        file = safe_path(root, relative)
        actual = digest(file.read_bytes()) if file.is_file() else None
        if actual == expected:
            continue
        changes.add(relative)
        if actual is not None and receipt.get(relative) != actual:
            conflicts.append(relative)
    if conflicts and not overwrite:
        raise ValueError('Local artwork edits preserved; restore aborted. Pack/backup your work, or use --overwrite (backs up conflicts): '+', '.join(conflicts[:8]))
    backup = root/'.asset-backups'/datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    for relative in conflicts:
        destination = backup/relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(safe_path(root, relative), destination)
    for archive in catalog['archives']:
        with zipfile.ZipFile(safe_path(root, archive['path'], archive=True)) as z:
            for record in archive['files']:
                relative = record['path']
                if relative not in changes:
                    continue
                destination = safe_path(root, relative)
                destination.parent.mkdir(parents=True, exist_ok=True)
                fd, name = tempfile.mkstemp(prefix='.asset-', dir=destination.parent)
                try:
                    with os.fdopen(fd, 'wb') as f:
                        f.write(z.read(relative))
                    Path(name).replace(destination)
                finally:
                    Path(name).unlink(missing_ok=True)
    # Files removed from the catalog are reported, never silently deleted.
    stale = sorted(set(receipt)-set(desired))
    (root/'.asset-state.json').write_text(json.dumps({'schemaVersion': 1, 'files': desired}, indent=2)+'\n', encoding='utf-8')
    print(f'Restored {len(changes)} assets; {len(desired)-len(changes)} already match; {len(stale)} retired paths left for review')
    if conflicts:
        print('Local edits backed up to:', backup)


def verify(root, archives_only=False):
    fetch(root)
    catalog = validated_catalog(root)
    total = 0
    for archive in catalog['archives']:
        for record in archive['files']:
            total += 1
            file = safe_path(root, record['path'])
            if not archives_only and (not file.is_file() or digest(file.read_bytes()) != record['sha256']):
                raise ValueError('Unrestored or modified asset: '+record['path'])
    print(f'OK: {total} assets, {len(catalog["archives"])} archives; hashes/paths/sizes verified' + (' (archives only)' if archives_only else ''))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['pack', 'restore', 'verify', 'fetch', 'publish'])
    parser.add_argument('--root', type=Path, default=ROOT, help='Repository root; also supports clean-clone verification')
    parser.add_argument('--overwrite', action='store_true', help='Restore only: back up local edits before overwriting')
    parser.add_argument('--allow-removals', action='store_true', help='Pack only: explicitly accept removed source files')
    parser.add_argument('--archives-only', action='store_true')
    args = parser.parse_args()
    root = args.root.resolve()
    if args.command == 'pack':
        pack(root, args.allow_removals)
    elif args.command == 'restore':
        restore(root, args.overwrite)
    elif args.command == 'fetch':
        print(f'Downloaded {fetch(root)} archives')
    elif args.command == 'publish':
        publish(root)
    else:
        verify(root, args.archives_only)


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, zipfile.BadZipFile, KeyError) as error:
        print('Asset error:', error, file=sys.stderr)
        sys.exit(1)
