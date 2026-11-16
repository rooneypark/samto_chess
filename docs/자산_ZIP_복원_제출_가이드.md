# 자산 ZIP 복원·제출 가이드 v1

2026-11-15 · 최종본만 관리 · GitHub 협업 기준

> **2026-11-16 변경:** ZIP은 더 이상 Git에 커밋하지 않고 GitHub 릴리스 `assets-v1`에 올린다. 받기·올리기 절차는 [리소스 올리기 가이드](리소스_올리기_가이드.md)가 기준이며, 이 문서에서 "ZIP을 Git에 올린다/커밋한다"는 설명은 "`publish`로 릴리스에 올리고 `catalog.json`만 커밋한다"로 읽는다. 경로·분류·최종본 판정 규칙은 이 문서가 그대로 유효하다.

PNG/영상은 `asset-packs/v1/`의 카테고리 ZIP에 담아 Git에 올린다. 코드·기획서·단일 통합가이드·manifest·요청문·QA·미리보기 HTML은 일반 파일로 추적한다. PNG는 이미 압축된 형식이므로 ZIP 자체의 압축률보다 **중복 전달본/반려본/중간 프레임 제거**로 용량을 줄인다. ZIP 포장은 이미지 픽셀을 변경하지 않는다. 장수 원화의 새 제작 규격은 `pixel256-v1`이며, 기존 원화와 별개로 256×256 투명 PNG·접지점 (128,224)에 맞춰 다시 제작한다. 현재 채택 상태는 장수 manifest와 통합가이드를 확인한다.

## 다른 PC에서 처음 받기 / 이후 pull

Python 3.10 이상과 Git을 사용한다. 저장소 루트에서 실행한다.

```powershell
git pull --ff-only
python tools/asset_packs.py restore
python tools/asset_packs.py verify
```

처음 복제할 때는 `git clone https://github.com/rooneypark/samto_chess.git` 후 저장소 폴더로 이동해 restore/verify를 실행한다. Windows에서 `python` 명령이 없고 `py`가 있으면 `py -3 tools/asset_packs.py restore`를 사용한다.

- `restore`는 ZIP·파일 해시와 경로를 모두 검증한 뒤 정확한 작업 경로에 복원한다. 이미 같은 파일은 건드리지 않는다. 여러 ZIP은 분할 압축 조각이 아니라 각각 독립 ZIP이므로 전부 받아야 한다.
- 이전에 복원한 뒤 수정하지 않은 파일은 새 팩 버전으로 교체한다. 직접 수정한 PNG/MP4와 충돌하면 **어떤 파일도 쓰기 전에 중단**한다. 먼저 자신의 수정본을 pack/커밋하거나 별도 보존한 뒤 통합한다.
- 정말 원격본으로 바꾸려면 `restore --overwrite`. 충돌한 로컬 원본은 `.asset-backups/<시각>/`에 자동 백업한다. 이 폴더와 `.asset-state.json`은 Git 제외다.
- catalog에서 사라진 옛 복원 파일은 자동 삭제하지 않고 개수를 알린다. 사용자 작업과 겹칠 수 있으므로 확인 후 제거한다.
- 탐색기에서 직접 풀어도 ZIP 내부 경로는 저장소 루트 기준이다. 다만 충돌 보호·해시 검증을 위해 명령 사용을 권장한다. ZIP 자체를 별도 상위 폴더 안에 풀어 `game/game/`처럼 중첩시키지 않는다.
- `play_game.cmd`와 `npm start`가 실행하는 서버는 시작 전에 restore를 자동 수행한다. 복원 실패 시 서버를 시작하지 않는다. 브라우저 정적 호스팅/CI 배포도 restore를 먼저 실행해야 한다.

## 최종 작업 경로

| 자산 | 복원/작업 위치 | ZIP 분류 |
|---|---|---|
| 장수49명·3방향147장 | `art-source/characters/v1/<id>/` | `characters-shu/wei/wu/qun` |
| 승인 그림체 비교 | `art-source/characters/v1/style-reference.png` | `characters-reference` |
| 보물32종 | `art-source/treasures/v1/` | `treasures` |
| 신규 장수 모션 | `art-source/motions/v1/<id>/` | `motions-<id>` |
| 신규 장수 효과 | `art-source/effects/v1/<id>/` | `effects-<id>` |
| 현재 게임의 장수 자산 | 기존 `game/assets/`의 장수 관련 폴더 | `runtime-generals` |
| 촉한 동작 참조/현재 전투 자산 | `game/assets/battle/` | `runtime-reference` |
| 현재 게임 UI 이미지 | 기존 `game/assets/`의 UI 폴더 | `runtime-ui` |
| 확정 조운 모션 | `art-source/motions/v1/15/` | `motions-15` |
| UI 미리보기 자산 | `game/previews/` | `ui-previews` |
| 실제 UI 재생성·검수 원본 | `art-source/ui-build/v1/`, 기존 design-delivery UI 원본 | `ui-build-reference` |

ZIP 파일명은 `<분류>-v1-001.zip`부터 시작한다. 같은 분류가 크면002/003으로 나눈다. 각 ZIP은 **40MiB 이하**, 원본 단일 파일은38MiB 이하여야 한다. 큰 영상은 의미 있는 동작 단위로 나눠 원본 출처를 기록한다. PNG를 줄이거나 잘라 제한에 맞추지 않는다. GitHub의100MiB 제한보다 충분히 작은 운영 기준이다. [GitHub 대용량 파일 안내](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)

장수/보물의 게임 ID는 연결에 사용하므로 그대로 유지한다. 제작 버전은 v1로 재시작하고 장수 표시 순번1~49, 보물 순번1~32는 manifest의 `order`로 관리한다. 원화 버전 초기화가 게임 버전·능력치·ID 초기화는 아니다. `pixel256-v1`은 `v1` 작업 경로와 팩 이름을 유지하며 manifest의 `artRevision`으로 새 원화 세대를 구분한다. 기존 UI 파일명 속 v2/v4는 코드 호환 경로이므로 그대로 복원한다.

## 디자이너 / PixelLab 모션 제작 후 Git에 올리기

1. 최신 코드를 pull하고 restore/verify한다. 모션 안무는 **`docs/캐릭터_원화_모션_스킬이펙트_통합가이드.md` 한 파일**을 따른다.
2. 최종 경로에는 채택한 PNG/MP4만 둔다. 실패본·중간 시트·원본 추출 캐시는 `test-artifacts/` 같은 로컬 영역에서 검토하고 최종 팩에 섞지 않는다. 한 장수의 구 승인본을 교체하면 이전본은 Git 이력으로 남기고 현재 경로에는 새 최종본만 둔다.
3. 아래 명령으로 무손실 ZIP을 재생성하고 검증한다. 모든 기존 팩을 먼저 복원해야 한다. 누락된 원본이 있으면 pack이 중단한다. 의도적으로 파일을 폐기한 경우에만 목록을 검토하고 `pack --allow-removals`를 사용한다.

```powershell
python tools/asset_packs.py pack
python tools/asset_packs.py verify
git status --short
```

4. 변경된 해당 카테고리 ZIP, `asset-packs/catalog.json`, 해당 장수의 JSON/프롬프트/QA/HTML만 명시적으로 stage/커밋/푸시한다. PNG/MP4는 `.gitignore` 대상이므로 `git add -f`하지 않는다. ZIP과 펼친 원본을 이중으로 추적하지 않는다. `git add .`로 다른 담당자의 변경까지 올리지 않는다.
5. 상대에게 브랜치·커밋·장수ID·모션/효과 작업 경로와 미검토 항목을 알려 준다. 상대는 pull→restore→verify 후 검수/게임 연결을 진행한다.

두 사람이 catalog를 동시에 수정하면 ZIP/JSON의 한쪽을 임의 선택하지 않는다. 양쪽 최종 PNG/영상과 manifest를 보존해 합친 뒤 pack을 다시 실행한다. 같은 장수 원화가 서로 다르면 채택본을 먼저 정한다. 자동 리베이스/강제 푸시로 다른 작업을 덮지 않는다.

## 버전과 최종본 판정

현재 작업 경로와 ZIP 체계는 baseline v1이며 새 256 원화의 세대는 `pixel256-v1`이다. 다음 교체 때도 통합가이드·manifest·팩을 함께 갱신하고 경로를 바꾸면 소비 코드까지 확인한다. 이번 v1에 남은 신규 원화의 개별 검토 대기 상태나 관우의 미완료 동작을 임의로 승인 완료로 바꾸지 않는다. **최종 선택 파일**과 **실제 게임 적용 완료**는 다른 상태다.

현재 UI 생성기와 회귀 검수가 읽는 빌드 원본은 삭제하지 않았다. 폐기된 v1 시안/원화 생성 파이프라인과 옛 importer는 제거했다. 기존 `design-delivery/v1/a-production/tools/`에는 현재 검수 도구의 sharp 의존성 설치 파일만 남는다. 검수 환경은 `npm ci`와 `npm ci --prefix design-delivery/v1/a-production/tools`로 준비한다. 원본147장과 현재 게임에 적용된6장수는 역할이 달라 각각 필요하다.

## 푸시 실패와 과거 기록

이번 실패를 유발한103.58MiB 전달ZIP은 새 카테고리 팩으로 대체했다. 마지막 **미푸시 커밋만** 정리하면 게시된 이력을 강제로 바꾸지 않고 정상 푸시할 수 있다. 파일을 삭제한 새 커밋을 덧붙이기만 하면 앞 커밋의 대용량 blob이 여전히 전송되므로 해결되지 않는다.

정리 전 로컬 복구 지점: `codex/backup-before-assets-v1-20261115`. 이 브랜치는 복구용이며 원격에 올리지 않는다. `git push --all`을 쓰면 제외하려던 대용량 기록까지 보내므로 현재 작업 브랜치만 푸시한다. 게시된 과거 Git 이력은 유지되어 clone 용량이 현재 팩 합계와 같지는 않다. 전체 원격 이력 재작성/force push는 이번 정리에 포함하지 않는다.

