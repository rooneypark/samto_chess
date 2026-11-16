# 자산 팩 baseline v1

ZIP은 Git에 없고 GitHub 릴리스(release.json의 repo·tag)에 있습니다. catalog.json에 ZIP별 복원 경로와 SHA-256을 기록합니다.
저장소 루트에서 `python tools/asset_packs.py restore` 후 `verify`를 실행하세요.
올리는 순서는 [리소스 올리기 가이드](../docs/리소스_올리기_가이드.md)를 따릅니다.
ZIP만 수동으로 교체하거나 catalog의 해시를 임의 수정하지 마세요.
