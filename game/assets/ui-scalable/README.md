# 크기 변경용 공용 프레임

상점 시안 작업 중 사용자가 요청한 나인슬라이스 전용 신규 원본이다. 기존 버튼을 억지로 늘린 초기안은 사용하지 않는다. 사용자가 확정한 상점의 실제 등용 UI에서 사용한다.

- 생성 원본: `button-sheet-v1.png` (built-in image_gen, 투명 배경 요청).
- 분리 자산: `blue.png`, `green.png`. 원본의 실제 외곽 alpha를 측정하고 닫힌 버튼 내부를 불투명하게 정리했다. 외곽 밖은 투명하고 원본 RGB는 유지한다.
- 분할선: 원본 각 변에서 112px. 장식 전체가 모서리 조각 안에 들어간다.
- 게임 기준 모서리: 941px 화면에서 28px 고정. 폭/높이가 달라져도 모서리는 동일하며 직선 변/중앙만 늘어난다. 기본 컴포넌트 최소 크기는 60×60px를 권장한다.
- 컴포넌트: `game/nine-slice.js`. 실제 크기와 DPR 변경을 감지해 이미지와 pressed alpha를 함께 다시 렌더한다. 공용 `initArtPress()` 입력 처리를 사용한다.
- 아이콘·문자는 빈 프레임과 별도 DOM/스프라이트로 배치한다. 원본 프레임에 글자를 구워 넣지 않는다.

```js
import {nineSlice} from './nine-slice.js';
import {initArtPress} from './art-controls.js';
initArtPress(game);
const dispose = await nineSlice(button, 'green', {box:[405,1135,500,138]});
// 가운데가 투명한 큰 패널도 같은 모서리 크기로 사용 가능하다.
await nineSlice(panel, 'blue', {button:false, center:false});
// 노드를 제거할 때 관찰자를 해제한다.
dispose();
```

재생성·검수:

```sh
node game/tools/build-nine-slice.cjs
node game/previews/shop-v1/build.cjs
node game/tests/run-browser.cjs shop-ui ui-components
```

검수는 두 색상 × 7개 폭/높이에서 네 모서리 RGBA가 동일한지, 중앙에 투명 구멍이 없는지, 실제 버튼 19개의 pressed가 alpha 밖을 바꾸지 않는지 확인한다. 320/390/1440 화면 및 밝은색·어두운색·대조색 배경 이미지도 저장한다. 원화·생성 프롬프트 출처는 `design-delivery/v2/05-mockups/shop-recruitment-v1-generation.json`에 있다.

`review.cjs`는 기준 시안 PNG도 다시 쓰므로, 회귀 검증에는 위 실제 게임 테스트를 사용한다. 화면 재렌더링/종료 시 `disposeNineSlices(root)`로 관찰자를 해제한다.
