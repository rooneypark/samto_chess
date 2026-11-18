import importlib.util,json,unittest,tempfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('packs',Path(__file__).with_name('asset_packs.py'));packs=importlib.util.module_from_spec(spec);spec.loader.exec_module(packs)
class AliasTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name);self.src=self.root/'art-source/characters/v1/0';self.src.mkdir(parents=True)
  (self.src.parent/'manifest.json').write_text(json.dumps({'artRevision':'ground-body-v1','entries':[{'id':'0'}]}))
  for v in ('front','side','back'):(self.src/f'{v}.png').write_bytes(v.encode())
 def test_clean_restore_and_repeat(self):
  packs.restore_character_aliases(self.root);packs.restore_character_aliases(self.root)
  for v in ('front','side','back'):
   for sub in ('','base-final-v1/'):
    self.assertEqual((self.root/f'bone-motion/art-in/0/{sub}{v}.png').read_bytes(),v.encode())
 def test_unknown_edit_blocks_before_any_alias_write(self):
  dst=self.root/'bone-motion/art-in/0/side.png';dst.parent.mkdir(parents=True);dst.write_bytes(b'local edit')
  with self.assertRaises(ValueError):packs.restore_character_aliases(self.root)
  self.assertFalse((dst.parent/'front.png').exists());self.assertEqual(dst.read_bytes(),b'local edit')
 def test_receipted_old_alias_updates(self):
  dst=self.root/'bone-motion/art-in/0/front.png';dst.parent.mkdir(parents=True);dst.write_bytes(b'old')
  packs.restore_character_aliases(self.root,{'art-source/characters/v1/0/front.png':packs.digest(b'old')})
  self.assertEqual(dst.read_bytes(),b'front')
 def test_path_escape_rejected(self):
  (self.src.parent/'manifest.json').write_text(json.dumps({'artRevision':'ground-body-v1','entries':[{'id':'../escape'}]}))
  with self.assertRaises(ValueError):packs.restore_character_aliases(self.root)
if __name__=='__main__':unittest.main()
