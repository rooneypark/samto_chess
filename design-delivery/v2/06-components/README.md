# 확정된 공용 UI와 재사용 기준

2026-11-13 사용자 확정. 성문·출정·병영·상점·동맹·군웅대전의 현재 화면, 공용 상하단, normal/selected/pressed 상태를 기준으로 한다. 확정 이후에는 구조 정리만으로 색·배치·크기를 바꾸지 않는다.

## 구성과 책임

| 구성 | 공용 구현 | 재사용 방법 |
| --- | --- | --- |
| 상단·재화·하단 | `game/ui-shell.js`, `ui-shell.css` | `artworkShell(root, {screen, title, progress})` |
| 고정 원본 버튼·좌표 | `game/art-controls.js`, `art-controls.css` | `artButton`, `placeArtwork` |
| 터치·마우스·키보드 pressed | `initArtPress(game)` | 화면별 이벤트 처리나 clip-path를 만들지 않음 |
| 크기가 변하는 빈 버튼·패널 | `game/nine-slice.js` | `nineSlice`와 `disposeNineSlices` |
| 하단 normal/selected/pressed | `game/tools/build-navigation.cjs` | 같은 178×144 틀과 원본 1:1 콘텐츠 공유 |
| 누끼·pressed PNG 생성 | `game/tools/ui-cutout.cjs` | 실제 외곽 추적, 공용 `pressedPNG` |
| 장수 독립 원화 | `game/assets/generals-v2/` | `generals.js`의 크기·발 기준점 사용 |

화면 모듈은 내용과 실제 게임 동작을 담당한다. 공용 UI는 등용·재화 차감·성장 데이터를 직접 수정하지 않는다. 상점 거래는 기존 `shop.js`와 저장 트랜잭션을 사용한다. 동맹은 `alliance-ui.js`가 본부를 표시하고 `alliance.js`의 기존 `allianceCommand` 트랜잭션으로 출석·기부·군량 지원·보상 수령을 처리한다.

## 나인슬라이스 적용 기준

**폭이나 높이를 독립적으로 늘리는 빈 프레임은 나인슬라이스를 우선 사용한다.** 모서리 문양은 고정하고, 직선 테두리와 빈 중앙만 늘린다. 분할선이 문양을 통과하면 기존 그림을 억지로 늘리지 않고 확장용 원본을 별도로 만든다.

- `ui-scalable/blue.png`, `green.png`: 상점의 모집 탭, 확률 버튼, 재화 선택, 1회/10회 등용, 보조 버튼, 중앙 패널에 적용되어 있다. 원본 분할선 112px, 941px 기준 모서리 28px이며 메타데이터에서 읽는다.
- `center:false`는 가운데가 빈 패널이다. 아이콘과 글자는 프레임과 별도 콘텐츠로 두어 확대하지 않는다.
- 실제 요소 크기와 DPR이 바뀌면 화면 이미지와 pressed 알파 마스크를 함께 다시 렌더한다.
- 상하단·하단 탭·원본 글자가 포함된 고정 버튼은 승인된 비율/슬롯을 유지한다. 화면 전체의 등비 축소를 임의의 폭/높이 확장과 혼동하지 않는다.
- 병영 카드의 우하단 구름, 두루마리의 봉·산수화처럼 장식이 넓은 프레임을 다른 비율로 재사용하려면 장식 전체를 보존하는 분할을 먼저 정한다. 임의 9등분이나 단순 `background-size` 확장으로 대체하지 않는다.

```js
import {artworkShell} from './ui-shell.js';
import {nineSlice, disposeNineSlices} from './nine-slice.js';

artworkShell(root, {screen:'shop', title:'상점', progress:state});
await nineSlice(button, 'green', {box:[405,1135,500,138]});
await nineSlice(panel, 'blue', {button:false, center:false});
// 화면 내용을 교체하거나 닫기 전에 관찰자와 진행 중 렌더를 정리한다.
disposeNineSlices(root);
```

## 상태와 누끼 규칙

- selected 기준은 **상점 selected 틀**이다. normal과 selected는 같은 alpha/클릭 영역, 동일한 아이콘·글자 픽셀과 위치를 사용한다. 테두리와 바탕색만 바뀐다.
- pressed는 RGB 72%, alpha는 원본과 같다. 아이콘 윤곽·글자 하이라이트·테두리 전체가 보존되어야 한다. 입력 중 크기나 위치를 움직이지 않는다.
- 원화는 전체 시안에서 잘라 쓰지 않는다. 무기·장식·말 다리까지 들어간 독립 스프라이트를 사용한다. 이동·공격 모션의 완성을 이 문서의 UI 확정과 혼동하지 않는다.
- `components.js`, 프레임 메타데이터, PNG는 생성 결과다. 같은 원본은 생성기를 수정하고 재생성하며 화면마다 복사 편집하지 않는다.

## 재생성과 검수

```sh
npm run build:ui
npm run verify:ui
npm run test:ui
```

`build:ui`는 기존 원본으로 컴포넌트 → 공용 틀/하단 탭 → 나인슬라이스를 순서대로 조립하고 검증한다. 이미지 생성이나 다운로드, 사용자 저장 변경은 하지 않는다. 상점 시안용 복사본은 공용 자산을 소비한다.

- `verify:ui`: 58개 원본/생성 자산, pressed 알파, 5개 하단 메뉴의 원본 1:1 크기·상태별 콘텐츠·동일 실루엣을 검사한다.
- `test:ui`: 확정 화면 비교, 공용 상하단, 실제 버튼의 pressed, 나인슬라이스 14개 폭/높이, 상태 전환, 등용/차감/복구, 동맹 거래·기간 갱신, 출정 조작, 다른 화면 크기를 검사한다.
- `approved-ui-browser.cjs`: 941px 기준 4화면의 UI는 픽셀 완전 일치로 검사한다. 고해상도 장수 이미지의 디코딩 축소 단계 및 390px 4화면은 Chromium의 래스터 차이를 위해 화면 전체 평균 채널 오차 0.6/255 미만만 허용한다. 반응형 배치와 클릭 영역은 별도 실제 화면 검사로 확인한다.
- 기준 화면은 `../05-mockups/approved-runtime/`에 있다. `--record`는 사용자에게 새로운 화면을 확정받은 경우에만 사용하며 일반 검사는 기준을 덮어쓰지 않는다.
- 리팩토링 전후 공용 PNG 148개의 SHA-256이 동일하다. 확정 자산 해시는 `approval.json`, 검수 결과는 `test-artifacts/`에 있다.

동맹 본부는 확정 시안을 실제 저장 데이터와 연결했다. `alliance-ui-browser.cjs`는 본부 시안의 UI 픽셀을 엄격 비교하고, 변경하지 않은 장수 원화의 Chromium 축소 차이만 제한적으로 허용한다. 18개 버튼의 pressed 알파, 14종 나인슬라이스 모서리, 출석·기부·군량·보상·중복 클릭·실패 복구·새로고침·기간 갱신을 검사한다. 동맹원/활동 기록/관리/토벌 상세는 기존 대화상자 기능에 연결한다. 군웅대전도 `arena-ui.js`와 동일한 공용 구성으로 연결했다. `arena-ui-browser.cjs`가 실제 상대 선택·대전·결과 정산·중복 지급 방지와 UI/17개 pressed/14종 모서리를 확인한다. 캐릭터 모션은 별도 작업이다.

전역 선택은 `campaign-ui.js`가 확정 공용 상하단·이름 프레임을 사용한다. `campaign-landmarks.js`는 장별 정상/파괴 독립 원화를 고정 크기와 발 기준으로 배치하며 selected에서 크기·원화를 바꾸지 않는다. `campaign-ui-browser.cjs`는 군주 정보 문구를 제외한 시안 픽셀 완전 일치, 31개 버튼 pressed 외곽 및 14종 나인슬라이스를 확인한다. `campaign-flow-browser.cjs`는 선택 저장, 잠금, 저장 실패, 중복 출정, 재개, 실제 전투 엔진의 승리 정산, 최초/반복 보상, 파괴 상태, 어려움과 이후 전역 접근을 검수한다. 전체 흐름 검수 명령은 `node game/tests/run-browser.cjs campaign-ui campaign-flow campaign expansion`이다.

본문의 주요 패널·전폭 버튼·분할 버튼 묶음은 좌우 바깥 기준선을 공유한다. 결과 화면 기준은 941px 캔버스의 x=20~921이며, 분할 버튼 사이 간격은 18px이다. 내부 패딩을 이유로 버튼 묶음의 바깥 끝선을 안으로 들이지 않는다. 확정 상하단은 별도 공용 틀로 유지한다.

버튼의 상하 바깥 간격도 공통 기준으로 관리한다(2026-11-14 사용자 요청). 신규 시안의 하단 본문 버튼과 하단 프레임 사이 기본 간격은 941×1672 좌표 기준 20px이다. 같은 역할의 버튼은 위·아래 간격을 통일하고 내부 텍스트 패딩과 구분한다. 임무 시안은 보너스 패널 끝 y=1360, 안내 문구 y=1372~1402, 성문 버튼 y=1414~1478, 공용 하단 시작 y=1498로 문구 앞뒤 12px와 하단 20px를 확보한다. 작은 화면에도 같은 비율로 적용하며 기존 확정 화면은 임의 일괄 수정하지 않는다.

## 2026-11-14 결과 화면과 공용 배치 확장

- `art-layout.js`: `paintArtworkLayout(root, {hollow})`가 `data-box`, `data-tone`, `data-frame`을 공통 처리한다. 군웅대전·전역·결과에서 사용한다. `contentBounds`가 결과 본문 x=20~921/w=901, 분할 간격 18을 정의한다.
- `general-art.js`: `generalArtwork(id,{center,height,feet,maxWidth})`와 `appendGeneralArtwork`로 원본 비율·발 기준·기마/보행 비율을 유지하고 왼쪽부터 DOM 순서를 보장한다. 군웅대전과 결과에서 재사용한다.
- `artworkShell`의 `controlsRoot` 옵션은 결과 화면 안의 재화/하단 메뉴만 꾸민다. 결과 내 이동은 `battle.js`에서 실제 정산·저장 후 처리한다. 기본값은 기존 `.game`으로 다른 화면 동작을 유지한다.
- `results-model.js`는 실제 영수증과 진행 상태를 표시 데이터로 변환한다. `results-ui.js`는 표시·공용 입력만 담당하며 직접 보상을 지급하지 않는다.
- `campaign-landmarks.js`는 6종 전투지 결과를 캐시한다. 전투 루프는 정적인 준비/결과에서 중단한다. 나인슬라이스 관찰자/비동기 렌더는 결과 교체와 종료 시 해제한다.
- `results-ui-browser.cjs`는 최종 승리 시안 전체 픽셀 일치, 11개 pressed와 14종 모서리, 3크기 좌우 정렬·문자·원화 잘림을 검사한다. `results-flow-browser.cjs`는 라운드/재도전/보상/실패 복구/중복 방지/메뉴 복귀를 검사한다. 두 검사를 `npm run test:ui`에 포함했다.
- 자세한 작업 기록: `../07-worklog/2026-11-14-ui.md`.

### 장수 체격 구분 보정

2026-11-14 사용자 수정으로 `character-scale.js`는 기마 관우·여포 100%, 허저 85%, 제갈량·초선·조조 등 다른 보행 장수 70%를 사용한다. `general-art.js` 소비 화면에 함께 반영하며 원본 비율·발 기준선은 유지한다. 보행 장수를 모두 동일한 높이로 강제하지 않는다.

## 전투 기록 런타임

`combat-record.js`는 결과·진행 중 전투에서 사용하는 공용 기록 화면이다. `combat-record-model.js`는 현재 라운드 통계를 읽어 정렬·6명 페이지·선택 상세를 계산한다. 프레임/버튼은 `paintArtworkLayout`과 `nineSlice`, 상하단은 `artworkShell(...,{controlsRoot:root})`, 장수는 `generalArtwork`를 재사용한다. 열기/닫기마다 관찰자·비동기 세대를 정리한다. 전투 중 열면 엔진 루프를 멈추며 기존 일시정지 상태 복원과 정산/메뉴 이동은 `battle.js`가 담당한다. UI 자체에서는 저장·보상 함수를 호출하지 않는다.

`combat-record-ui`와 `combat-record-flow`를 `npm run test:ui`에 포함했다. 기존 시안 픽셀 전체, selected 크기, 21개 pressed 외곽, 14종 나인슬라이스, 3크기 정렬과 실제 통계를 검수한다. 허저 85% 체격은 사용자 최종 확정이다.

2026-11-14 전투 기록 실제 사용자 클릭 검수도 완료·최종 확정되었다.

## 임무·보상 시안의 공용 구성

`game/previews/missions-v1/`은 다음 화면 제안이며 아직 승인 전이다. 확정 상하단과 공용 28px 모서리 프레임, 코인/다이아 원본을 재사용한다. 출석 7칸, 일일 4행/주간 5행/업적 3행, 완료 보너스를 동일한 본문 끝선에 맞춘다. 별도 pressed 입력 처리나 신규 누끼 자산은 만들지 않는다. 검수 명령은 `node game/previews/missions-v1/review.cjs`이며 실제 게임의 임무 창 연결은 승인 후 별도로 진행한다.

후속 확정/적용: 2026-11-14 임무 시안이 승인되어 `missions-ui-template.js`, `missions-ui.js/css`에 적용되었다. 위 승인 전 표기는 이 기록으로 대체한다. renderer는 공용 `artworkShell(...,{controlsRoot:root})`, `paintArtworkLayout`, `nineSlice`를 사용하고 조회·수령 컨트롤러는 `missions.js`에 분리한다. 화면 교체/닫기 때 나인슬라이스 관찰자와 비동기 렌더를 정리한다. 기간 확인은 저장 전체를 매초 복제하지 않고 마지막 표시 시각과 현재 시각으로 계산한다. 보상 거래는 기존 서비스/저장 모듈에 맡기며 UI에서 재화를 직접 더하지 않는다. `missions-ui`는 시안 전체 픽셀·43개 pressed·16종 모서리·3개 탭×3크기·상하 여백을, `missions-flow`는 실제 지급/중복/실패/기간/우편/순환/이동을 검수한다.

임무 실제 구현도 사용자 검수 완료·최종 확정되었다. 다음 `mail-v1`은 아직 시안 검토 대기다. 우편 상세의 두 버튼은 보상 콘텐츠 아래 20px/패널 바닥 위 20px를 확보한다. 앞으로 패널 내부 버튼도 전체 화면 하단 버튼과 같은 방식으로 상하 간격을 검수한다.

병영 상세와 카드에서도 `characterHeight(id,1)`를 사용한다. 카드의 원래 이미지 슬롯은 유지하고 내부 원화 높이를 100%/85%/70%로 조절한다. 원본 `foot` 비율과 관우의 기존 발 기준을 사용해 중앙 정렬로 인한 떠오름을 방지한다. `ui-shell-browser.cjs`가 6장수 × 상세/카드 × 3크기의 비율·발·종횡비·전체 외곽을 검사한다. 확정 체격 적용으로 병영 기준 이미지 2장만 갱신했으며 원화 자리 밖 픽셀 변화가 0임을 대조했다.

## 우편함 실제 적용

2026-11-14 우편 시안도 확정되어 `mail-ui.js/css`/`mail-ui-template.js`에 적용했다. `mail-model.js`는 순수 조회 모델이며 `mail.js`만 기존 서비스 명령과 durable 저장 거래를 호출한다. 프레임은 `paintArtworkLayout`/`nineSlice`, 별도 화면의 상하단은 `artworkShell(...,{controlsRoot:root})`, 삭제 확인은 `createGameDialog.confirm`을 사용한다. 추가 crop/pressed 처리기를 만들지 않는다. 렌더 교체/닫기 때 비동기 세대·나인슬라이스 관찰자를 정리하고, 보관 기한/기간 변경 때만 화면을 갱신한다. 저장소 전체를 매초 복사하지 않는다. `mail-ui`가 시안 전체 픽셀/51개 pressed/16종 모서리/3크기 및 안팎 여백을, `mail-flow`가 실제 보상/삭제/실패/만료/재접속을 검사한다.

## 병영 목록 초상화와 상세 전신의 구분

2026-11-14 사용자 지정: 하단 선택 목록만 독립 정면 원화를 투명 배경의 초상화로 표시한다. 선택 상세의 정면은 기존 전신/100·85·70% 체격/발 기준/전체 외곽을 유지한다. 목록 초상화에서는 얼굴 폭과 눈높이를 맞춘다. game/previews/portraits-v1/의 CSS 표시 창은 원본 PNG를 수정하지 않고 카드 배경을 그대로 비춘다. 확대 비교 카드도 목록용 시안이며 상세 변경안이 아니다. 실제 적용은 아직 대기다.

2026-11-14 초상화 시안이 승인되어 실제 병영 목록에 적용되었다. `general-portraits.js`가 승인 크롭 좌표와 기존 정면 이미지의 viewport 생성을, `general-portraits.css`가 투명 표시 창을 담당한다. 원본 PNG는 수정하지 않으며 시안과 런타임이 같은 함수를 사용한다. 카드의 기존 이미지 슬롯/텍스트/프레임을 유지하고 그 안에 4:5 초상화를 표시한다. 상세 전신 렌더 및 체격은 변경하지 않는다. `ui-shell`은 목록 얼굴/눈높이/투명도/선택 위치와 상세 전신 체격을 각각 검수한다. `ui-components`는 6장수 normal/selected 각각 pressed를 확인한다. 분수 픽셀 크기의 카드 alpha는 실제 브라우저에서 동일 좌표로 래스터화하여 검증한다.

2026-11-14 병영 초상화 실제 검수 완료·최종 확정. 이후 사용자 요청으로 병영은 등용 장수 전용, 장수 도감은 전체/미등용 정보로 분리했다. 병영 featured 정렬은 보유 장수 안에서만 적용한다. 강제 6장수 미리보기 분기를 제거했고 초기 상세도 보유 장수로 선택한다. codex-v1 시안은 공용 상하단, generalPortrait/generalArtwork, 28px 모서리 나인슬라이스, 공용 입력/pressed alpha를 사용한다. 신규 래스터 생성이나 누끼는 없다. 실제 도감 연결 전 시안이며 저장소에 접근하지 않는다.

2026-11-14 장수 도감 시안 사용자 확정·실제 적용. codex-ui.js/css와 codex-template.js, #codex 경로를 사용한다. 전체 장수/미등용/세력 필터/페이지/전신/등용처를 실제 저장에 연결하고 수집 보상은 기존 serviceCommand codex + store.transact로 지급한다. 등용처 안내에서 상점으로 이동한다. 실제 데이터 수집 완료 여부에 따라 기존 보상 영역에 공용 나인슬라이스 수령 버튼을 표시한다. 공용 상하단·투명 초상화·상하 20px 유지. codex-flow-browser는 실제 소유/필터/지급/재접속/중복방지/3크기/상점 이동, codex-alpha-browser는 44개 실제 pressed의 투명 외곽 및 테두리 검수 통과. approved-ui 기존 8화면도 통과. 사용자 실제 클릭 검수 대기이며 사용자 저장에는 테스트 데이터를 넣지 않았다.

2026-11-14 장수 도감 실제 사용자 검수 완료·최종 확정. 다음 시작 7일 임무 시안은 game/previews/start-v1/ 및 05-mockups/start-v1.png, start-v1-mobile.png. 기존 collection.js의 7개 임무/보상을 사용하고 예시 오늘 3일차·1일 수령·2일 달성·3일 진행·4~7일 잠금을 메모리로만 표시한다. 일차 선택, 보상 수령 상태 예시와 완주 보상을 제공한다. 공용 상하단·버튼·28px 고정 모서리·원본 alpha 재사용. 본문 x20~921, 하단 버튼 상하20, 상세 버튼의 보상 아래20/패널 바닥20 유지. review.cjs 통과: 공용 224470픽셀 동일, 51개 pressed 투명 외곽/전체 테두리, 18종 나인슬라이스, 7일×3크기 텍스트/정렬/선택 크기, 수령 예시/초기화/저장소 미사용. 시안 사용자 검토 대기이며 실제 시작 임무 화면은 변경하지 않았다.

2026-11-14 시작 7일 임무 시안 사용자 확정·실제 적용. start-missions.js / start-ui.css / start-template.js 및 #start 경로를 사용한다. 기존 startMissions.done, services.start.day0/claimed, questPeriods로 일차/진행/수령을 표시하고 serviceCommand(start-mission)+store.transact로 개별/완주 보상을 지급한다. 처리 중 입력 잠금 및 aria-busy 유지, 저장 실패는 미수령 복구, 05시 일차 갱신과 화면 재진입/재접속 반영. 임무 이동은 전역/병영/상점/내정/군웅대전으로 연결하고 기존 레벨 잠금 유지. 공용 상하단·좌우 x20~921·하단20·상세 버튼 top/bottom20·나인슬라이스·원본 alpha를 유지한다. classic은 기존 대화상자를 유지한다. 실제 사용자 클릭 검수는 대기이며 사용자 프로필에 예시 데이터/보상/날짜를 넣지 않는다.

2026-11-14 시작 7일 실제 사용자 검수 완료·최종 확정. 사용자 추가 원칙: 반복 코드는 공용화하되 확정 화면을 유지할 수 없는 재사용은 강요하지 않는다. 기존 부품으로 맞지 않으면 해당 형태의 새 공용 컴포넌트/변형을 만들고 이후 재사용한다. 최근 도감/시작 화면의 공통 호스트·내비게이션·Escape 처리를 artwork-screen.js, 기본 스타일을 artwork-screen.css, 상하단 마크업을 artwork-screen-template.js로 분리했다. 화면별 좌표/데이터/거래는 전용 모듈에 유지한다. paintArtworkSelection은 동일한 선택 색을 다시 래스터화하지 않으며 기존 ResizeObserver가 크기 변경을 처리한다. 나인슬라이스의 전역/요소 래스터 캐시 실험은 채택하지 않았고 원본 분할 규칙을 유지한다. 신규 시안용 artwork-preview.css도 공통 스타일을 사용한다.

2026-11-14 토벌 파견 시안 사용자 확정·실제 적용. expedition-ui.js/css와 expedition-template.js, #expedition 경로를 사용한다. 공용 artwork-screen 호스트/마크업/내비게이션/선택과 기존 프레임/초상화/전신을 재사용한다. general-picker.js/css는 보유·사용 가능한 장수의 3인 선택을 제공하는 공용 변형이며 기존 dialog 버튼 스타일을 사용한다. 파견지는 실제 전역 클리어로 해금, 기존 군주 Lv.10 제한 유지. 군량20·기본2시간(동맹 행군 연구 단축 반영)·동시2부대·일일4회·파견 장수 중복 금지는 기존 expeditionCommand + store.transact를 사용한다. 보상은 기존 세력/인연 보너스와 고정 파견ID 보물 추첨을 유지한다. 저장 실패는 비용/파견/보상 완료로 표시하지 않고 재시도한다. 목록·편성·파견·귀환·재접속은 실제 저장이며 사용자 프로필에 테스트 값을 넣지 않는다. 사용자 실제 클릭 검수는 대기다.


2026-11-14 연무탑 시안 작성·사용자 검토 대기. game/previews/tower-v1/ 및 05-mockups/tower-v1.png, tower-v1-mobile.png. 기존 towerStages 30층을 10층씩 아래에서 위로 연결하고 5층마다 장수 전투, 잠금/클리어/selected, 실제 층 정의의 출전 조건·시작 은화·최초 보상을 표시한다. 3층 클리어·6장수 보유는 메모리 예시이며 실제 저장/전투/Lv.15 제한을 변경하지 않았다. 공용 상하단·버튼·28px 나인슬라이스·기존 alpha 재사용, 본문 x20~921 및 하단 버튼 상하20 유지. review.cjs 통과: 공용224470픽셀 동일, 68개 pressed 외곽 변화0/테두리 누락0, 14종 모서리 일치, 30층×3크기 선택/텍스트/정렬/여백, 저장소 미사용. 390px 전체 화면 육안 확인. 실제 구현은 승인 후 진행한다.


2026-11-14 연무탑 시안 사용자 확정·실제 적용. tower-ui.js/css와 tower-template.js, #tower 경로를 사용한다. 공용 artwork-screen 호스트/상하단/버튼/선택·28px 나인슬라이스 재사용. 실제 towerStages 30층과 stageUnlocked/stageCleared/towerDeck으로 층별 잠금·클리어·보유 장수 조건을 표시한다. 기존 Lv.15 제한 유지, 실제 newRun/전투 엔진/settle 최초 보상과 반복 보상0·중복 지급 방지 사용. 전투 포기/결과 복귀는 연무탑으로 연결하며 결과 버튼/다음 층 문구도 구분한다. 본문 x20~921, 하단 버튼 상하20 유지. 사용자 프로필에 테스트 값을 넣지 않았다. 실제 사용자 클릭 검수 대기.
검수: tower-flow 통과(Lv.15/이전 층/보유 세력 잠금, 시작 저장 실패·재시도/중복 클릭/재접속, 엔진 승리·최초 골드80·반복0·재접속 중복 방지, 30층×3크기 정렬/여백). tower-alpha 실제45개 pressed 외곽 변화0/테두리 누락0. approved-ui 기존8화면/results-flow 회귀 통과. npm test 87개 및 verify:ui 58자산/5탭 통과. 실제390px 화면 육안 확인. 테스트 데이터는 격리 브라우저에만 사용한다. 확인 링크 http://127.0.0.1:8780/game/?revision=tower-v1#tower .

2026-11-14 사용자 연무탑 실제 검수 완료·최종 확정. 앞선 연무탑 클릭 검수 대기 표기는 이 확정으로 대체한다.

2026-11-14 내정·성내 시설 시안 작성·사용자 검토 대기. game/previews/government-v1/ 및 05-mockups/government-v1.png, government-v1-mobile.png. 농지/병영/대장간/장터 2×2 선택 목록과 현재 효과/생산물/다음 효과/비용/수령·강화 버튼을 표시한다. 기존 government.js 규칙을 메모리 예시에만 사용한다. 장터는 생산이 아닌 주간 교환 시설로 표시. 농지 강화 전 수확, 일일 수령 후 강화 시 중복 지급 없음, 최대5레벨 반영. 실제 프로필/내정은 변경하지 않았다. 공용 상하단/버튼/28px 나인슬라이스/원본 alpha 재사용. 본문 x20~921 및 시설 간격20, 상세/하단 액션 상하20 유지. 검수: 공용224470픽셀 동일, 63개 pressed 외곽 변화0/테두리 누락0, 14종 모서리 일치, 4시설×3크기 문자/정렬/여백/selected크기, 수령/강화/최대레벨/초기화/저장소 미사용 통과. 390px 전체 화면 육안 확인. 승인 후 실제 연결 예정.


2026-11-14 사용자 삭제 대상 확인: 병영 하단의 원화순 정렬 선택창을 제거했다. 승인 디자인에서는 기본 원화 순서를 유지하고 장수 목록의 스크롤 영역을 하단 바 위20까지 확장한다. 카드와 원화 크기는 유지하며 두루마리895×90도 변형하지 않는다. classic 정렬 기능은 유지한다.

- **2026-11-14 최신 사용자 결정: 상하 여백·컨테이너 간격 통일 요청 폐기.** 내정 작업 중 요청했던 모든 화면의 top/bottom 동일 여백 및 컨테이너 가로·세로20px 강제 통일은 없던 요청으로 처리한다. 요청 이전 승인 화면의 배치와 화면별 간격을 유지한다. 두루마리도 이전 원본 이미지·크기·위치로 복원하며, 병영은 원래 상단 콘텐츠 이미지(장수 성장·편성)를 사용한다. 자동 여백 보정/두루마리 재합성/병영 scene-spaced는 제거했다. 기존 본문 좌우 정렬·공용 상하단·버튼 재사용·나인슬라이스·누끼 품질 원칙은 유지한다. 원화순 선택창 삭제와 내정 구역 pressed 기능은 유지한다. 이전 문서의 body-insets 또는 전체 간격20 강제 규칙은 이 결정으로 폐기된다.

- **2026-11-14 공용 두루마리 최신 기준:** 모든 화면의 두루마리는 상점 모양의 `scroll-ui.js/css`와 `assets/ui-common/scroll-paper.png`를 사용한다. 제목, 보유 장수, 보장 횟수, 동맹 공지, 전투 시너지 등 용도가 달라도 같은 895×90 원본/외곽을 사용한다. 병영의 기존 개별 두루마리는 이 기준으로 대체한다. 두루마리 위 텍스트/숫자/라벨의 배경은 투명이며 종이를 덮는 단색 사각형/샘플 확대 패치를 만들지 않는다. 버튼 프레임과 구분선은 필요한 표시를 유지하고 라벨 바탕만 투명하게 한다. 배경 이미지 자체의 과거 사각형 덧칠 흔적은 편집 원화로 정리했다. `build-common-scroll.cjs`는 승인된 상점 테두리/말린 끝/산 문양/alpha를 그대로 보존하고 종이 내부만 내보낸다. 크기는 고정 비율로 화면에 맞추며 장식 원본을 임의로 나인슬라이스하거나 세로 압축하지 않는다. 화면별 원래 좌표와 상하 간격은 유지하며, 폐기된 전체 여백20px 강제 통일 규칙은 부활시키지 않는다.

공용 두루마리 사용: 제목에는 `.scroll-heading`, 기타 내용은 `.shared-scroll`을 지정하고 기존 `placeArtwork(el,[x,y,895,90])` 또는 `paintArtworkLayout`을 사용한다. 직접 사용할 때는 `sharedScroll(el)`을 호출한다. 내용은 live text 또는 투명 span/b/strong/label로 넣는다. 인터랙션 두루마리는 기존 `artButton(...,"battle-bonds")`가 같은 공용 이미지와 alpha로 연결하므로 별도 입력기를 만들지 않는다. 재생성은 npm run build:ui, 검수는 shared-scroll/original-layout 및 기존 화면 검수. 이전 승인 화면 참조는 보존하고 변경된 두루마리 영역만 별도 원본 픽셀/alpha 검사로 검증한다.

- **2026-11-14 좌우 여백 최신 공용 기준:** 사용자가 상점 본문을 기준으로 모든 탭의 좌우 마진 통일을 요청했다. 941px 좌표계에서 주요 본문 패널·목록·전폭 버튼 묶음은 x=20~921, 폭901을 사용한다. 공용 두루마리는 원본895폭/x22를 유지한다(승인 상점 원본의 외곽 포함). `side-layout.js`의 contentBounds/fitBodyBox를 사용하며 화면 전체나 장수 이미지를 가로로 강제 압축하지 않는다. 배경 장면과 고정 상하단 프레임은 본문 패널과 구분한다. 병영 상세 프레임과 목록의 넓이를 이 기준에 맞췄고, 패널/훈련 버튼은 기존 모서리를 고정한 분할 리사이즈로 처리했다. 장수의 원본 종횡비·체격·발 기준과 세로 배치/상하 간격은 유지한다. 앞서 취소한 top/bottom 동일 여백 및 컨테이너 세로간격 강제 통일은 여전히 폐기 상태다.

- **병영 배경/누끼 잔재 재발 방지(2026-11-14):** 전체 시안 배경에 새 프레임을 덧씌우면 옛 테두리·카드 배경 띠가 남는다. 병영은 단일 #1b304a 바탕 + 독립 detail-body 투명 프레임 + 개별 공용 버튼/두루마리/카드로 구성한다. scene.png는 추출 원본이며 런타임 배경으로 다시 쓰지 않는다. 모서리 주변과 목록 아래쪽에 옛 선·직사각형 패치가 보이면 통과시키지 않는다. side-margins 검수에서 표시된 모서리·여백의 실제 픽셀을 동일 바탕색과 대조한다. 이미 승인된 공용 두루마리·좌우 마진·장수 비율과 세로 배치는 유지한다.


2026-11-14 내정 v3 사용자 승인·실제 게임 적용. 이전의 내정 시안/저장 미연결 표기는 이 기록으로 대체한다. `government-ui.js/css`, `government-template.js`, `assets/government-v1/town.png`, `#government` 경로를 사용한다. 마을 이미지는 승인된 v3 town-zoned.png와 파일 해시가 동일하다. 통합 마을을 자르지 않으며 `government-districts.js`의 공용 영역 정의와 `art-regions.js`/`art-controls.js`로 구역 및 이름표 pressed를 함께 표시한다. 미리보기도 같은 영역 정의를 재사용한다.

시설 선택과 실제 생산량/레벨/비용 표시, 생산 수령/강화는 기존 government.js + store.transact를 사용한다. 농지 8시간 보관/기존 레벨 생산물 선수령/군량 지급, 병영·대장간 05시 일일 수령/강화 후 중복 지급 금지, 시설 Lv.5 상한과 황건 토벌 최초 승리 진입 조건을 유지한다. 장터 교환은 기존 shop.exchange/구매 확인/정산 영수증을 재사용하고 productLimit/remaining으로 시설 레벨별 실제 주간 한도를 표시한다. 미리보기의 초기화 버튼은 실제 게임에서 생산 현황 갱신으로 바꾼다. 저장 실패는 지급·차감 완료로 표시하지 않는다. 사용자 실제 프로필에는 예시 재화/시설/진행도를 넣지 않았다.

공용 상하단·상점 두루마리895×90/투명 제목·본문 x20~921과 승인된 세로 배치를 유지한다. 내정의 패널·버튼은 공용 나인슬라이스28, 작은 이름표는18을 사용한다. 나인슬라이스의 stablePixels 옵션은 PNG 출력 시 CPU 캔버스를 사용해 첫 출력/재출력의 모서리 반올림 차이를 방지한다. 내정 시안/실제 화면만 명시적으로 사용하며 기존 승인 화면은 기본 출력 방식을 유지한다. 폐기된 top/bottom 동일 여백 및 모든 컨테이너 간격20 규칙은 재적용하지 않는다. 생산 표시는 화면이 보일 때 분 경계와 저장 변경/포커스 복귀에 갱신한다.

실제 사용자 클릭 검수는 대기다. 확인 링크: http://127.0.0.1:8780/game/?revision=government-v1#government .

내정 실제 적용 최종 검수: government-flow(진입 잠금/실제 군주 메뉴 진입, 수령/강화/교환 저장 실패 후 재시도, 재접속·중복 지급 방지, 강화 전 농지 생산 정산, 실제 장터 레벨별 한도), government-ui(63개 버튼 pressed의 투명 외곽 변화0/테두리 누락0, 4구역 pressed와 선택 고정 크기, 14종28px 및 2색18px 모서리 일치, 320/390/941px 텍스트·정렬), district-review(경계 이탈 취소/길 픽셀 불변), campaign/shop-ui/start-flow/ui-shell/approved-ui 회귀 통과. 마을 비교 픽셀 차이0, 허용치16 초과 화면 픽셀 차이0(실제 기능으로 바꾼 갱신 버튼 문구 제외). 390px 실제 렌더 육안 확인. npm test 90개 및 verify:ui 58자산/5탭 통과. 테스트 데이터는 격리 브라우저만 사용했다. 공용 기본 나인슬라이스 출력까지 변경한 중간 실험은 기존 승인 화면 픽셀 차이 때문에 폐기하고 내정만 stablePixels 옵션을 사용하는 형태로 마무리했다.

2026-11-14 사용자 최종 확정: 내정 구역 pressed/누끼 효과는 폐기한다. 시설 영역 클릭 선택만 유지하고 별도의 이름 버튼에만 기존 공용 pressed를 적용한다. 구역에서 이름표로 pressed를 전달하지 않는다. 과거 구역 pressed 검수 지침은 이 결정으로 대체된다.


2026-11-14 보물함 사용자 시안 승인·실제 게임 적용. treasure-screen.js/css 및 treasure-template.js, #treasure 경로를 사용한다. 병영 보물함 버튼에서 진입하며 현재 장수 장착 보물을 우선 선택한다. 미리보기와 실제 화면은 같은 승인 템플릿을 공유한다. 공용 상하단·두루마리895×90·본문x20~921·기존 세로 좌표 유지. 전체/장착/미장착 필터 및 보유 개별 인스턴스 목록(스크롤)을 사용한다. 기존12종 규칙/동일1성 재료/최대5성/장착·잠금·즐겨찾기 재료 제외/출정 중 변경 제한을 유지한다.

장착·해제·장수 간 변경 및 강화 확인은 store.transact+manageTreasure로 실제 저장한다. 장수 간 변경은 해제와 새 장착을 하나의 거래 안에서 수행한다. 강화는 기존 treasureQuote 비용을 사용하며 확인 후 성급 변경 시 재확인을 요구한다. 저장 실패는 재료·골드·장착 상태를 변경하지 않고 재시도 가능하다. 최대 성급/재료·골드 부족 및 보물 없음 표시를 포함한다. 사용자 실제 저장에 테스트 보물/재화를 주입하지 않았다. 시안의 보유 예시는 실제 인벤토리가 아니다. 실제 사용자 클릭 검수는 대기다.

사용자 역할 변경: 디자이너2는 전투 시뮬레이션 대신 전체 장수/보물 정지 이미지 제작을 맡길 계획이며, 모션은 사용자가 Grok에 별도로 요청할 계획이다. 당시49장수/기존12보물 기록은 현재 docs/캐릭터_원화_모션_스킬이펙트_통합가이드.md 및 design-delivery/v2/07-worklog/art-production-manifest.json으로 통합했다. 신규 보물 제작은 docs/보물_기획서_v2.md의100종 후보를 따른다. 이 지시가 이전 디자이너2 전투 시뮬레이션 담당 계획보다 우선한다. 이번 작업에서 전투 엔진/모션 코드를 변경하지 않았다.


2026-11-14 군주 정보·레벨 보상 시안 사용자 승인·실제 적용. profile-screen.js/css 및 profile-template.js, #profile 경로를 사용한다. 성문 군주 초상화에서 새 화면으로 진입하고 classic 대화상자는 유지한다. 시안/실제 화면은 같은 템플릿과 공용 상하단/두루마리895×90/본문x20~921/원래 세로 배치를 공유한다. 승인된 조조 원화의 군주 일러스트는 장식이며 세력 선택이나 실제 장수 보유를 의미하지 않는다.

실제 lordLevel/경험치·출전/보유 장수 수를 표시한다. Lv2~30 보상은 개별 카드 스크롤 목록이며 selected는 색/테두리만 바뀐다. 수령은 기존 serviceCommand(lord-reward)+store.transact로 달성한 모든 미수령 레벨을 한 번에 처리한다. 선택 카드와 전체 수령 대상은 구분하며 버튼에 전체 골드·무료 다이아 합계를 표시한다. 최고레벨·수령완료·미달성·저장 실패 후 재시도·중복지급 방지 유지. 기능 해금은 실제 nextUnlocks/unlocked로 같은 레벨을 묶어 안내하며 기존 사용으로 해금된 기능은 다음 잠금에서 제외한다. 내정은 황건 토벌 최초승리 조건을 유지하고 잠김 시 안내, 해금 시 #government로 이동한다. 실제 저장에는 예시 재화/경험치/진행을 주입하지 않는다.

공용 액션 이미지를 사용하는 새 화면은 기존 .action의 CSS border/padding이 이미지 바깥에 남지 않게 범위 안에서 제거한다. 기본 CSS 테두리는 이미지 alpha 마스크의 pressed 대상이 아니므로 원본 외곽과 혼합하면 안 된다. 이번 군주 화면에서 발견한 추가 청록 선을 제거했다.

실제 사용자 클릭 검수 대기. 링크 http://127.0.0.1:8780/game/?revision=profile-v1#profile .


2026-11-14 디자이너2 제작 기준 통합: 정면·후면·왼쪽3방향 제작, 오른쪽은 측면 전체 반전. 앞선4방향 독립 제작 요청을 대체한다. 촉한 실제 MOV/ATK/SPC의 기본25포즈와 미사용 추가3포즈를 구분한다. 모든 전투 효과는 한 칸 내부, 범위는 동일 클립을 칸별 동시/순차 복제. 현재 관우 대형 효과는 수정 대기이며 이번 문서 작업에서 전투 코드는 변경하지 않았다. docs/캐릭터_원화_모션_스킬이펙트_통합가이드.md가 단일 제작 가이드다. docs/보물_기획서_v2.md에100종 시안 후보(P1 32종)와 실제 기존12종을 구분했다. 기존 디자이너2 인계서2개와 production-plan.json은 유효 내용을 이관 후 제거했다. 원화·모션·QA 증거는 보존한다.


2026-11-14 설정 시안 사용자 승인·실제 적용. settings-screen.js/css, settings-template.js와 #settings 경로를 사용한다. 성문의 설정 버튼에서 진입한다. 공용 상하단·두루마리895×90·본문x20~921·승인 세로 배치를 유지하고 시안/실제 화면은 같은 템플릿을 공유한다.

움직임 줄이기는 reducedMotion, 큰 글씨/전법 효과/음량은 preferences.largeText/reducedFx/volume에 store.transact로 저장한다. 기존 실제 화면 클래스와 전투 오디오가 같은 값을 사용하며 실패 시 이전 selected 상태를 복구한다. 큰 글씨는 기존 지원 영역에 적용하며 승인 프레임 전체를 확대하지 않는다. 음량은 승인된0/25/50/75/100 프리셋이며 이전 저장의 다른 음량은 정확한 값으로 표시하고 임의 반올림 저장하지 않는다. 새 디자인 전환은 기존 artSet 기기 설정과 새로고침을 사용한다. classic 설정창도 유지한다.

settings.js의 settingsActions를 공용화하여 실제 화면과 classic 모두 같은 백업/진단/전체화면/복구 처리를 사용한다. 복구는 validateSave로 파일을 검증하고 교체 확인을 거친 뒤 현재 저장 백업을 내려받고 store.restore한다. 오류 시 저장을 유지하고 재시도 가능하다. 파일 선택 취소·잘못된 파일·확인 취소는 저장을 변경하지 않는다. 테스트는 격리 브라우저에서만 수행했으며 사용자 실제 파일/프로필은 복구하거나 덮어쓰지 않았다.

검수 통과: settings-flow(설정/클래스/재접속, 저장실패·재시도, 음소거, 실제백업/진단 다운로드, 잘못된 파일/복구취소/복구실패·재시도, 실제전체화면 켜기·해제, classic 왕복), settings-ui(26 pressed 전체외곽/alpha,11개 설정·음량 selected 전환 크기,14종 나인슬라이스 모서리,941/390/320 렌더), ui-shell 회귀. 390px 실제 렌더 육안 확인. 사용자 실제 클릭 검수는 대기이며 링크는 http://127.0.0.1:8780/game/?revision=settings-v1#settings .


2026-11-14 장수 편성 시안 사용자 승인·실제 게임 적용. formation-screen.js/css와 formation-template.js, #formation 경로를 사용한다. 성문/병영/군웅대전 등 기존 편성 버튼에서 진입하며 저장·취소 후 진입한 화면으로 돌아간다. 시안과 실제 게임은 승인 템플릿을 공유한다. 공용 상하단/두루마리/본문x20~921/원래 세로 좌표/하단20 유지.

실제 owned 장수만 출전6명과 대기 목록에 표시하고 실제 장수 레벨을 읽는다. 대기 목록은 같은 카드 크기의 스크롤로0~43명을 처리한다. 기존 승인6장수의 투명 초상화와 나머지 기존 초상화를 재사용한다. 교체·순서 변경은 메모리 draft이며 저장 전 사용자 편성을 바꾸지 않는다. 취소/이동/새로고침 시 미저장 초안은 폐기한다. 저장은 store.transact로 최신 상태에 order만 적용하고 보유6명/중복금지/동시 편성 변경을 검증한다. 실패 시 원본 저장과 초안을 유지해 재시도 가능하다. 실제 전투 스냅샷이나 배치·소환 규칙은 변경하지 않는다.

synergyTiers/activeBonds는 초안 장수로 계산한 예상 효과를 표시하고 실제 전투는 기존 배치 판정을 사용한다. 순서는 기존 성문 배치 순서이며 자동 전투 위치나 소환 확률을 재정의하지 않는다. 대기 없는 상태는 교체를 비활성화하며 순서 변경은 가능하다. 긴 교체 장수명은 버튼을 잘라내거나 축소하지 않고 '선택 장수 교체' 라벨과 전체 aria-label/title을 사용한다. 성문 CSS 및 renderParty와 충돌하지 않도록 전용 formation-party 컨테이너를 사용한다.

검수: formation-flow(보유/실제레벨/대기필터/초안취소/교체·순서·인연/저장실패·재시도/재접속/진입화면복귀/대기0명·43명 스크롤), formation-ui(21개 enabled pressed 원본alpha·전체테두리,9종 selected 크기,14종 나인슬라이스 모서리,교체·순서·인연,941/390/320 렌더),390px 실제 화면 육안 확인. 사용자 실제 클릭 검수 대기. 사용자 저장에는 예시 장수/레벨/재화를 넣지 않았다. 확인 링크 http://127.0.0.1:8780/game/?revision=formation-v1#formation .

군략 선택 시안: game/previews/strategy-v1/에서 공용 artworkScreenTemplate, scroll-ui, artworkShell, paintArtworkLayout 및 nineSlice를 재사용한다. 선택은 동일 카드 좌표/크기를 유지하며 색만 바꾼다. 실제 저장 연결 전 메모리 전용 시안이며 review.cjs로 pressed/selected/14종 모서리와 3크기를 검수한다.

군략 선택 실제 적용: strategy-template.js를 시안/실제 화면이 공유한다. strategy-screen은 공용 artwork-screen 호스트 및 ui-shell 범위에 등록했다. 실제 저장과 레벨 검증은 화면 모듈에서 처리하며 기존 battle-run의 출정 스냅샷과 효과를 재사용한다. strategy-flow/strategy-ui를 test:ui에 포함한다.

상품 교환: exchange-template.js를 시안/실제 화면이 공유한다. 공용 artwork-screen, ui-shell, 나인슬라이스와 기존 shop.buy 확인·결과·거래 로직을 재사용한다. 별도 교환 정산 코드를 만들지 않는다. exchange-flow/exchange-ui를 test:ui에 포함한다.

S등급 선택: s-select-template.js를 시안/실제 화면이 공유하고 generalPortrait/generalArtwork로 초상화·전신 표시를 재사용한다. shop.chooseS는 기존 확인/결과/원자적 거래를 호출한다. s-select-flow/s-select-ui를 test:ui에 포함한다.

등용 결과는 recruit-results-template.js를 시안/실제가 공유한다. recruit-award-card로 전역 modal 카드 CSS 충돌을 방지한다. 지급은 기존 거래만 수행하고 화면은 pending 영수증 표시/동일ID 확인만 담당한다. recruit-results-flow/ui를 test:ui에 포함한다.

### 공용화 추가 기준 (2026-11-14)
- 최근9개 화면의 동일 호스트는 `createArtworkScreen({sharedShell:true,...})`와 `artwork-runtime.css`를 사용한다. 바탕/비율/숨김/상하단 컨트롤 CSS를 새 화면에 복사하지 않는다. 본문 좌표와 데이터 거래는 전용 모듈에 둔다.
- 빈 확장 패널은 `artworkPanel(box)`를 사용한다. 기존 `data-frame`과 `paintArtworkLayout`의 나인슬라이스 분할 규칙을 그대로 따른다.
- 초상화 카드는 `generalPortraitHolder(hero)`를 사용한다. 승인 crop과 기존 fallback만 선택하며, 상세 전신은 `generalArtwork`를 사용한다.
- 5열 획득 결과는 `createArtworkResultCard`/`paintArtworkResultSelection`을 재사용한다. 보물과 장수의 내부 원화 크기는 각 승인 스타일로 유지한다. 같은 결과의 선택 전환에는 DOM을 다시 만들지 않는다. 결과가 바뀌면 기존 나인슬라이스를 dispose한 뒤 재생성한다.
- 외관 보존 검수: 수정 전 `node game/tests/common-refactor-browser.cjs --capture`, 수정 후 같은 명령에서 `--capture`를 빼고 비교한다. 비교 기준은 test-artifacts/common-refactor에 저장되므로 최초 기준을 수정 후 결과로 덮어쓰지 않는다. 거래/pressed 검수는 각 화면 flow/ui 테스트를 함께 실행한다.

보물 결과도 recruit-results-screen의 공용 영수증/카드/확인 흐름을 사용한다. treasure-result 클래스는 보물 아이콘 표현만 담당한다. 보물함 이동은 {treasureId:instanceId}를 전달하며 기존 장수 기반 장착보물 진입도 유지한다. treasure-results-flow/ui를 test:ui에 포함한다.
모집 확률의 시안과 실제 화면은 rates-template.js의 공용 패널과 좌표를 공유한다. rates-screen.js는 공용 artwork-runtime과 실제 확률/보장 데이터를 사용한다.
상품·보급 시안과 실제 화면은 products-template.js의 공용 패널을 공유한다. 실제 화면은 artwork-runtime과 iapCommand를 사용한다.
군공 상점은 exchangeTemplate 및 exchange-screen.css의 공용 패널과 artwork-runtime을 재사용한다. 교환은 기존 arenaCommand를 호출한다.
공용 다이얼로그는 createGameDialog의 artwork 모드에서 dialog-art.css와 공용 나인슬라이스를 사용한다. 기존 dialog open/confirm 호출과 버튼 콜백을 재사용한다.
공용 토스트는 toast.js/css의 createToast와 blue 나인슬라이스를 사용한다. 새 호출은 toast(message, state)로 success/error/info를 명시할 수 있다.

## 2026-11-15 공용 다이얼로그 시각 요소
- 모집 확인창 사용자 승인. 같은 역할의 배너는 dialog-art-content.js의 dialogArtworkCallout을 재사용한다.
- 공용 다이얼로그의 의미별 아이콘 12종은 assets/ui-common/dialog-icons-v1.png 투명 atlas를 사용한다. styleDialogContent가 최초 열기와 동적 내용 삽입 모두 처리하며 기존 호출/거래/이벤트를 변경하지 않는다.
- 빈 목록/검색 결과/활동 기록/최대 성장/파견 없음 및 장수 정보 패널은 공용 파란 나인슬라이스를 사용한다. 제목 아이콘은 기존처럼 숨김. classic 화면에는 이번 아트 스타일을 강제하지 않는다.
- X는 승인된 36px 프레임/16px 픽셀 획, 기존 공용 입력과 alpha pressed를 유지한다.

공용 X는 close-icon.js의 applyCloseIcon(button,label) 사용. 프레임 나인슬라이스를 추가하지 않는다. 36px 클릭영역/26px 원화, mask-size와 mask-position을 원화와 맞추며 투명 외곽은 눌려도 바뀌지 않는다. 다이얼로그와 토스트가 같은 자산과 입력 처리를 공유한다.

### UI 자산 교체 규격

- 좌표와 본문 규격은 game/ui-spec.js의 941×1672 아트보드와 x20~921 본문 기준을 사용한다. 고정 배치는 data-box 또는 placeArtwork로 명시한다. 본문 패널의 안쪽 여백과 화면 바깥 정렬은 별도로 관리한다.
- 고정형 버튼은 artButton에 공용 자산 ID를 전달한다. 생성된 ui-common/components.js에서 파일과 배치 좌표를 찾는다. 교체 시 원본 생성 경로에서 같은 ID와 투명 캔버스 규격을 유지하고 verify:ui로 alpha와 selected를 확인한다. 고정 슬롯과 입력 연결은 자산 교체와 별개다.
- 크기가 바뀌는 패널은 data-frame, 동작 버튼은 data-tone 또는 nineSlice를 사용한다. ui-scalable/frames.js의 파일·slice·corner가 교체 지점이며 같은 렌더 출력의 alpha를 pressed에 쓴다. selected 전환은 같은 슬롯에서 색상만 바뀐다.
- 전체 화면은 공용 shell/template, 두루마리는 scroll-ui, 다이얼로그·토스트의 닫기는 close-icon을 사용한다. X 원화와 눌림 마스크 URL, 표시 크기는 각각 한곳에서 관리한다.
- 성문 원화의 우편·임무 배지는 기본 그림에 포함되어 있다. gate-lobby의 공용 배지 가림 레이어와 serviceAlerts를 사용하여 보상 상태에 맞춰 표시한다. 상태는 실제 수령 가능 기준이다.


## 2026-11-15 자산 ZIP 기준 v1

현재 UI/스프라이트 PNG는 픽셀을 유지한 채 asset-packs/v1/의 카테고리 ZIP으로 Git 추적한다. pull 뒤 `python tools/asset_packs.py restore`를 실행해야 기존 경로로 복원된다. 재생성/검수 전에 복원을 마친다. 생성 후에는 pack/verify와 변경된 ZIP/catalog를 함께 제출한다.
장수 재생성 입력은 art-source/ui-build/v1/general-turnarounds, 전투 재생성 입력은 art-source/ui-build/v1/battle-sprites로 이동했다. 게임 출력 경로·상하단·pressed·나인슬라이스·PNG 바이트는 변경하지 않았다. 최신49명 제작 원화와 현재 게임의6장수 입력은 별도 역할이며 혼용하지 않는다.
구체적 절차는 docs/자산_ZIP_복원_제출_가이드.md를 따른다. 과거 작업 기록의 삭제된 원화 폴더는 현재 입력 경로가 아니다.
