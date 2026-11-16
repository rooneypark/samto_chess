import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('asset_packs', Path(__file__).parents[1]/'asset_packs.py')
packs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packs)


class AssetPackTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.output = contextlib.redirect_stdout(io.StringIO())
        self.output.__enter__()
        self.addCleanup(self.output.__exit__, None, None, None)

    def asset(self, name='game/assets/test/정면.png', data=b'original-png-pixels'):
        file = self.root/name
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(data)
        return file

    def test_roundtrip_unicode_and_deterministic_archives(self):
        original = self.asset()
        first = packs.pack(self.root)
        second = packs.pack(self.root)
        self.assertEqual(first, second)
        original.unlink()
        packs.restore(self.root)
        self.assertEqual(original.read_bytes(), b'original-png-pixels')
        packs.verify(self.root)

    def test_local_changes_abort_before_any_writes_and_backup_explicit_overwrite(self):
        original = self.asset()
        other = self.asset('game/assets/test/other.png')
        packs.pack(self.root)
        original.write_bytes(b'local edit')
        other.unlink()
        with self.assertRaisesRegex(ValueError, 'Local artwork edits'):
            packs.restore(self.root)
        self.assertFalse(other.exists())
        self.assertEqual(original.read_bytes(), b'local edit')
        packs.restore(self.root, overwrite=True)
        backups = list((self.root/'.asset-backups').rglob('정면.png'))
        self.assertEqual(len(backups), 1)
        self.assertEqual(backups[0].read_bytes(), b'local edit')

    def test_receipt_allows_update_of_unmodified_previous_version(self):
        original = self.asset()
        packs.pack(self.root)
        packs.restore(self.root)
        original.write_bytes(b'new upstream art')
        packs.pack(self.root)
        original.write_bytes(b'original-png-pixels')
        packs.restore(self.root)
        self.assertEqual(original.read_bytes(), b'new upstream art')

    def test_corrupt_archive_is_rejected_without_extraction(self):
        original = self.asset()
        catalog = packs.pack(self.root)
        archive = self.root/catalog['archives'][0]['path']
        archive.write_bytes(b'broken zip')
        original.unlink()
        with self.assertRaisesRegex(ValueError, 'corrupt'):
            packs.restore(self.root)
        self.assertFalse(original.exists())

    def test_zip_path_traversal_is_rejected_even_with_matching_hash(self):
        original = self.asset()
        catalog = packs.pack(self.root)
        record = catalog['archives'][0]
        record['files'][0]['path'] = 'art-source/../../escape.png'
        archive = self.root/record['path']
        with zipfile.ZipFile(archive, 'w') as z:
            z.writestr(record['files'][0]['path'], original.read_bytes())
        record['sha256'] = packs.digest(archive.read_bytes())
        (self.root/'asset-packs/catalog.json').write_text(json.dumps(catalog), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Unsafe path'):
            packs.restore(self.root)

    def test_missing_originals_cannot_silently_empty_a_pack(self):
        original = self.asset()
        packs.pack(self.root)
        original.unlink()
        with self.assertRaisesRegex(ValueError, 'Restore first'):
            packs.pack(self.root)
        packs.restore(self.root)
        self.assertTrue(original.exists())


if __name__ == '__main__':
    unittest.main()
