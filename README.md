# 삼토체스

코드·문서는 Git으로, PNG/영상은 ZIP으로 묶어 GitHub 릴리스 `assets-v1`로 관리합니다. Git에는 ZIP 목록(`asset-packs/catalog.json`)만 있습니다.

```powershell
git pull --ff-only
python tools/asset_packs.py restore
python tools/asset_packs.py verify
npm start
```

Windows에서는 `play_game.cmd`로도 실행할 수 있습니다. 서버 시작 시 자산을 자동 복원합니다. Python이 필요하며 직접 수정한 로컬 원화가 있으면 덮어쓰지 않고 중단합니다.

- [리소스 올리기 가이드](docs/리소스_올리기_가이드.md) — 그림을 받고 올리는 방법 (사람·Codex 공통)
- [자산 ZIP 복원·제출 가이드](docs/자산_ZIP_복원_제출_가이드.md) — 경로·분류·최종본 판정
- [캐릭터 원화·모션·스킬 이펙트 통합가이드](docs/캐릭터_원화_모션_스킬이펙트_통합가이드.md)
- [보물 기획서](docs/보물_기획서.md)
- 장수 최종 원화: `art-source/characters/v1/` (복원 후 `index.html`)
- 보물 최종 원화: `art-source/treasures/v1/` (복원 후 `index.html`)

제작 후 `python tools/asset_packs.py pack`, `verify`, `publish`를 실행한 뒤 `catalog.json`과 코드·문서만 커밋하세요. ZIP과 펼쳐진 PNG/MP4는 Git에 넣지 않습니다.
