# bone-motion

삼토체스 캐릭터의 본(뼈대) 모션을 만들고, 그 모션으로 PixelLab 스켈레톤 애니메이션을 뽑기 위한 작업 폴더다.
게임 코드(`game/`)와 릴리스 자산(`asset-packs/`)은 건드리지 않는다.

먼저 읽을 문서: `MOTION-GUIDE.md` (만드는 기준과 지금까지 정한 것).

## 지금 상태 (2026-11-18)

| 항목 | 상태 |
|---|---|
| 표준 본 3종 (보병, 책사, 기마) | 받은 그대로 사용 |
| 전투 유형 11종 × 14클립 + 감녕 사슬낫 변형 10클립 = 164클립 | 1차 통과. 모두 수치 검사 통과 |
| 전투 대기 자세 | 확정 후 4종 수정 (보행 창, 창·방패, 중무기, 궁: 무기가 몸을 관통하지 않게, 세 방향에서 보이게) |
| 장수 49명 배정 (유형, 평타 세트, 전법 클립) | 완료 (`HERO-MOTIONS.md`) |
| 장수별 원화 요청서와 가이드 그림 | 49명 완료 (`art-in/<ID>/guide/`) |
| 원화 | 장비 원화 시안 전부 폐기. 새 방식: 정면 기본 자세 1장만 받는다 (`PIXELLAB-WORKFLOW.md`). 기존 그림·측정값은 모션 입력으로 사용하지 않는다 |
| PixelLab 모션 | 장비 1차 원화로 시험(12건). 창 길이 문제로 폐기. 정면 기본 자세 원화 대기 |
| 게임 적용 | 시작 전 |

## 폴더

| 경로 | 내용 | Git |
|---|---|---|
| `MOTION-GUIDE.md` | 모션 제작 기준, 타격점, 검사 기준, PixelLab으로 넘기는 법 | 올림 |
| `HERO-MOTIONS.md` | 장수 49명의 유형·평타 세트·전법 클립 (자동 생성) | 올림 |
| `HERO-TYPES.md` | 장수 49명 × 유형 표와 유형 안에서 무기가 다른 장수 | 올림 |
| `hero-profiles.json` | 장수별 수치: 무기 길이, 날 크기, 키, 폭 (자동 생성) | 올림 |
| `engine/` | 모션 엔진과 도구 (아래) | 올림 |
| `engine/clips/` | 유형별 클립 정의 | 올림 |
| `art-in/` | 원화를 넣는 곳. 장수 ID별 폴더, 그 안의 `guide/`에 요청서와 가이드 그림 | 올림 |
| `sim/` | 브라우저 확인 화면 (`battle.html`, `clips.html`, `idle.html`, `index.html`) | 올림 (`data.js` 제외) |
| `inputs/request/`, `inputs/standard-bones/` | 받은 의뢰서와 표준 본. 원본 그대로 | 올림 |
| `inputs/checker-11/` | 다른 세션이 만든 비교용 체커 (22MB) | 제외 |
| `out/` | 빌드 결과: GIF, 주요 컷, 좌표, 검사 결과 (약 130MB) | 제외 |

## 다시 만들기

`out/`과 `sim/data.js`는 Git에 없다. 받은 뒤 한 번 만든다. Python 3.12와 Pillow가 필요하고, 장수 표를 다시 만들 때만 Node가 필요하다.

```bash
python -X utf8 bone-motion/engine/buildall.py
```

```bash
python -X utf8 bone-motion/engine/export.py
```

그 뒤 `bone-motion/sim/battle.html`을 더블클릭하면 전투 시뮬레이션이 열린다.

## 도구

| 명령 | 하는 일 |
|---|---|
| `engine/buildall.py [유형 ...]` | 클립을 빌드하고 수치 검사 (뼈 길이, 발 미끄러짐, 손·발 도달, 무기와 몸통·머리, 균형, 캔버스) |
| `engine/build.py <유형> <클립>` | 클립 하나 |
| `engine/posecheck.py [--all]` | 말이 안 되는 자세 찾기: 무기가 다리·팔을 관통, 팔이 몸통에 묻힘, 다리 겹침 |
| `engine/hitpoint.py` | 공격이 공통 타격점 (0, 100, 45)에 닿는지 |
| `engine/tight.py <유형>` | 무기와 몸이 가장 가까운 프레임 |
| `engine/headroom.py` | 캔버스 여유 (몸을 얼마나 키울 수 있나) |
| `engine/export.py [idle] [sim]` | 원화용 정지 자세와 시뮬레이터 데이터 |
| `engine/overview.py` | 유형 전체 대기 자세 한 장, 크기 비교 |
| `engine/make_heroes.mjs` | 게임 데이터에서 장수 표 생성 (`HERO-MOTIONS.md`, `sim/heroes.js`) |
| `engine/hero_guides.py [ID ...]` | 장수별 요청서와 가이드 그림, `hero-profiles.json` |
| `engine/artcheck.py <ID> [--estimate]` | 원화가 PixelLab에 넣을 만한지 사전 검사 |
| `engine/pixellab.py balance / estimate / animate / fetch` | PixelLab 호출. 토큰은 `%USERPROFILE%/.pixellab/api_key`에서 읽는다 (저장소에 넣지 않는다) |
| `engine/pack_sprites.py <ID>` | 받은 프레임을 시뮬레이터용으로 묶기 |

## 원화가 들어오면

2026-11-18에 방식이 바뀌었다. 원화는 정면 기본 자세 1장만 받고, 측면·후면과 전투 대기는 PixelLab으로 만든다. 순서는 `PIXELLAB-WORKFLOW.md`를 따른다. 아래는 세 방향 전투 대기 원화를 직접 받았을 때의 예전 순서다.

1. `art-in/<ID>/`에 `front.png`, `side.png`, `back.png` (256×256, 투명 배경).
2. `python -X utf8 bone-motion/engine/artcheck.py <ID> --estimate` 로 검사 (0.3회분).
3. 통과하면 `art-in/<ID>/pixellab.json`을 만들고 한 클립만 시험: `pixellab.py animate <ID> a1 left` (4회분).
4. 결과가 좋으면 나머지 클립과 방향을 제출하고 `fetch`로 받는다. 장수 한 명은 6클립 × 3방향 = 18건, 약 72회분.
5. `pack_sprites.py <ID>` 후 `sim/battle.html`에서 확인.

## 규칙

- 작업 중에는 커밋·푸시·브랜치 생성을 하지 않는다. 사용자가 말할 때 한 번에 한다.
- 받은 자료(`inputs/`)는 고치지 않는다.
- PixelLab 호출은 비용이 든다. 제출 전에 무엇을 몇 건 넣는지 사용자에게 알린다.
- 화면에 보이는 문구는 한국어로, 담백하게 쓴다.

## 집에서 이어받기 (2026-11-18)

저장소 루트에서 git pull --ff-only 후 python tools/asset_packs.py restore 및 python tools/asset_packs.py verify를 실행한다. 49명 요청서와 1:1·4배 가이드 294장, 표준 본 원본을 받는다. 본과 대기 가이드는 유지하며 장비 포함 이번 원화 시안은 재사용하지 않는다. art-in 안의 과거 notes.txt와 장비 pixellab.json은 검수 이력이며 새 원화 기준으로 다시 측정해야 한다. 다음 원화는 정면 기본 자세 1장으로 받기로 했다 (`PIXELLAB-WORKFLOW.md`). 시뮬레이터의 생성 데이터는 위 재생성 절차를 따른다.

## PixelLab 작업 순서

기본 자세 원화에서 전투 대기, 공격, 전법 모션까지의 순서와 API, 아직 구현하지 않은 부분은 `PIXELLAB-WORKFLOW.md`에 있다.
