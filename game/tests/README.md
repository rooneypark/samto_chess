# 삼국체스 테스트

게임 실행에는 설치가 필요 없다. 아래는 검수용이다.

## 설치 (한 번)

저장소 루트에서 실행한다. `playwright-core`만 설치하며 브라우저는 내려받지 않는다.
이미 설치된 Edge 또는 Chrome을 사용한다.

    npm install

## 실행

| 명령 | 내용 |
|---|---|
| `npm test` | 단위 테스트 (`game/tests/*.test.mjs`). 규칙·경제·저장·전투 계약 |
| `npm run verify:assets` | 원본 장수 자산의 프레임 해시 검증. `reference/`가 없으면 기록된 해시(`game/assets/battle/manifest.json`)와 비교한다 |
| `npm run test:browser` | 브라우저 검수 11종(세력 선택 `faction`, 새 그림 전환 `art`, 보강 콘텐츠 `expansion`, 전역 `campaign` 포함). 서버를 직접 띄우고 끝나면 종료한다 |
| `node game/tests/run-browser.cjs shop battle` | 이름을 지정해 일부만 실행 |
| `npm run review:battle` | 실제 클릭으로 소환→배치→합성→5라운드→보상까지 진행하고 영상으로 남긴다 (ffmpeg 필요) |
| `npm run review:mixed` | 6대6 혼합 전투 검수 영상 (ffmpeg 필요) |
| `npm run test:all` | 단위 + 자산 + 브라우저 |

## 브라우저 검수의 약속

- 검수마다 새 브라우저 프로필을 쓴다. 사용자의 저장 데이터를 건드리지 않는다.
- 저장 확인은 IndexedDB(원본 저장)에서 읽는다. localStorage 미러를 보지 않는다.
- 사전 상태가 필요하면 `seed()`로 실제 저장 거래를 거쳐 넣는다.
- 저장이 끝났는지는 `waitForSave()`로 기다린다.
- 스크린샷·영상·audit.json은 `test-artifacts/`에 생긴다. `docs/ui`에는 쓰지 않는다.

공통 코드는 `browser-env.cjs`, 실행기는 `run-browser.cjs`에 있다.

## 환경 변수

| 변수 | 용도 | 기본값 |
|---|---|---|
| `SAMGUK_BROWSER_PATH` | 브라우저 실행 파일 경로 | 없음 (채널 자동 탐색) |
| `SAMGUK_BROWSER_CHANNEL` | `msedge`, `chrome`, `chromium` 중 하나 | 순서대로 시도 |
| `SAMGUK_BASE_URL` | 이미 실행 중인 서버 주소. 지정하면 서버를 띄우지 않는다 | 없음 |
| `SAMGUK_PYTHON` | 서버 실행에 쓸 Python | `py -3`, `python`, `python3` 순 |
| `SAMGUK_FFMPEG` | 검수 영상 인코더 | `ffmpeg` |
| `SAMGUK_ARTIFACTS` | 산출물 폴더 | `test-artifacts/` |
| `SAMGUK_HEADED` | `1`이면 브라우저 창을 띄운다 | 숨김 |

## 군주 레벨

`start(page)`는 군주 Lv.20으로 시작해 레벨 잠금이 걸린 화면이 모두 열린 상태를 만든다. 잠금 자체를 확인하려면 `start(page,{lord:1})`을 쓴다. 단위 테스트 `expansion.test.mjs`가 새 규칙(픽업, 도감, 인연 임무, 역할 특성, 군략, 어려움, 연무탑, 군웅대전 시즌·군공, 동맹 토벌, 토벌 파견)을 다룬다.
