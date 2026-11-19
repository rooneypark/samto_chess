# 이펙트 제작 가이드

평타와 전법 이펙트를 그릴 때 보는 문서입니다. 지금 시뮬레이터에 들어 있는 이펙트는 전부 임시 도형이고, 이 문서의 규격대로 그린 그림으로 바꿉니다.
표는 `sim/effects.js`에서 자동으로 뽑았습니다. 배정을 바꾸면 `node bone-motion/engine/make_effect_guide.mjs`로 다시 만듭니다.

## 시안 보는 곳

- 종류별 시안: `simulator.cmd`를 실행한 뒤 주소를 `/bone-motion/sim/effects.html`로 바꿉니다. 38가지가 각각 반복 재생되고, 색·속도·평타/전법 크기를 바꿔 볼 수 있습니다. "멈춰서 4장면으로 보기"를 켜면 시작·중간·끝 모양을 볼 수 있습니다.
- 전투 속 모습: `/bone-motion/sim/battle.html`에서 장수를 골라 전투를 돌립니다.

## 공통 규격

- **배율**: 캐릭터 그림과 1:1입니다. 격자 한 칸이 100px, 보병 키가 약 124px입니다. 표의 크기는 모두 이 배율의 px입니다.
- **기준점**: 발밑은 캐릭터 그림의 접지점(256 캔버스의 128, 224)입니다. 대상 가슴은 발밑에서 위로 36px, 자신 가슴은 위로 50px입니다.
- **방향**: 자신에서 대상으로 가는 이펙트(화살, 찌르기, 베기 등)는 오른쪽을 향하게 한 벌만 그립니다. 게임이 방향에 맞게 돌립니다. 하늘에서 떨어지거나 바닥에 깔리는 이펙트는 돌리지 않습니다.
- **시간과 장수**: 표의 시간이 재생 길이입니다. 권장 장수는 초당 15장 기준입니다.
- **평타**: 타격 프레임에 시작해서 0.2초 안에 끝납니다. 근접 평타는 표의 시간에 0.6을 곱한 값이 실제 길이입니다(표에는 곱한 값을 적었습니다).
- **전법**: 같은 종류라도 평타보다 1.25배 크고 1.25배 길게 재생하며 빛 번짐이 붙습니다. 전법용 그림은 표의 크기와 시간에 1.25를 곱해 그립니다.
- **색**: 흰 심에 장수 색 테두리가 기본입니다. 장수 색은 아래 장수별 표에 있습니다. 한 벌을 흰색·회색으로 그려 두고 게임에서 색을 입혀도 됩니다.
- **파일**: 배경이 투명한 PNG. `fx/<종류>/01.png`부터 번호 순서로 둡니다. 장수 전용으로 따로 그리면 `fx/<종류>-<장수 id>/`에 둡니다.
- **겹치는 순서**: 시안은 전부 캐릭터 위에 그립니다. 바닥에 깔리는 것(진, 충격파 고리, 시전 고리, 강화 고리)은 캐릭터 아래에 두는 쪽을 권합니다.

## 한 번의 공격에서 나오는 것

| 상황 | 나오는 이펙트 |
|---|---|
| 근접 평타 | 동작에 맞는 자국 1개 + 맞는 섬광(spark). 중무기·긴자루 도끼의 내려치기에는 작은 충격파가 더 붙습니다 |
| 원거리 평타 | 장수별 발사체 1개 |
| 전법 (모든 장수) | 자신에게 시전 빛기둥(cast)과 전법 이름 → 장수별 이펙트 → 맞는 대상마다 명중 섬광(burst) |
| 지원 전법 | 자신에게 시전 빛기둥과 자신용 이펙트 → 효과를 받는 아군마다 지원 이펙트 |

## 종류

### 근접 평타

| 종류 | 이름 | 쓰임 | 기준점 | 크기 | 시간 | 권장 장수 |
|---|---|---|---|---|---|---|
| jab | 짧은 찌르기 | 근접 평타 | 자신 가슴 → 대상 너머 33 | 굵기 4.4 | 162ms | 3장 |
| cut | 짧은 베기 | 근접 평타 | 대상 가슴 | 반지름 31 초승달, 굵기 7.7 | 174ms | 3장 |
| chop | 내려 베기 | 근접 평타 | 대상 가슴 | 폭 22, 높이 82 | 174ms | 3장 |
| rise | 올려 베기 | 근접 평타 | 대상 가슴 | 폭 22, 높이 82 | 174ms | 3장 |
| thud | 방패 치기 | 근접 평타 | 대상 가슴 | 고리 지름 20에서 64 | 180ms | 3장 |
| whip | 채찍 줄 | 근접 평타 | 자신 가슴 → 대상 가슴 | 굵기 5, 휘는 폭 46 | 192ms | 3장 |
| cross | X자 베기 | 근접 전법·평타 | 대상 가슴 | 60×60 | 320ms | 5장 |
| spark | 맞는 섬광 | 모든 근접 평타 | 대상 가슴 | 섬광 지름 24, 광선 6개 길이 12 | 170ms | 3장 |

### 원거리 평타

| 종류 | 이름 | 쓰임 | 기준점 | 크기 | 시간 | 권장 장수 |
|---|---|---|---|---|---|---|
| arrow | 화살 | 궁병 평타·전법 | 자신 가슴 → 대상 가슴 (화살비는 하늘 → 대상) | 길이 24, 굵은 화살 34 | 210ms | 3장 |
| missile | 빛줄기 | 원거리 평타 | 자신 가슴 → 대상 가슴 | 굵기 3, 길이는 거리의 30% | 160ms | 3장 |
| orb | 구슬 | 원거리 평타 | 자신 가슴 → 대상 가슴 | 구슬 지름 16, 터질 때 지름 56 | 300ms | 5장 |
| petal | 꽃잎 | 원거리 평타 | 자신 가슴 → 대상 가슴 | 꽃잎 10×5, 4장 | 340ms | 5장 |
| needle | 침 | 원거리 평타 | 자신 가슴 → 대상 가슴 | 굵기 1.5 | 110ms | 3장 |
| order | 표적 표시 | 지휘 평타 | 대상 가슴 | 지름 52에서 32로 조여 듦 | 300ms | 5장 |

### 전법 공통

| 종류 | 이름 | 쓰임 | 기준점 | 크기 | 시간 | 권장 장수 |
|---|---|---|---|---|---|---|
| cast | 시전 빛기둥 | 모든 전법 공통 | 자신 발밑 | 빛기둥 56×240, 고리 최대 212×72 | 620ms | 9장 |
| burst | 명중 섬광 | 모든 전법 공통 | 대상 가슴과 발밑 | 섬광 지름 52에서 78, 광선 12개, 불꽃 10개 | 420ms | 6장 |

### 근접 전법

| 종류 | 이름 | 쓰임 | 기준점 | 크기 | 시간 | 권장 장수 |
|---|---|---|---|---|---|---|
| slash | 큰 베기 | 근접 전법 | 대상 가슴 | 반지름 36 초승달, 굵기 9 | 280ms | 4장 |
| pierce | 관통 찌르기 | 근접 전법 | 자신 가슴 → 대상 너머 60 | 굵기 8 | 260ms | 4장 |
| dash | 돌진 궤적 | 근접 전법 | 자신 발밑 → 대상 발밑 | 줄 5개, 폭 28 | 240ms | 4장 |
| shock | 충격파 | 근접 전법 | 대상(또는 자신) 발밑 | 고리 148×48, 균열 길이 30~56 | 500ms | 8장 |
| spin | 회전 베기 | 근접 전법 | 자신 허리 | 고리 108×39 | 440ms | 7장 |
| roar | 함성 | 근접·지휘 전법 | 자신 발밑 | 고리 3개, 최대 340×118 | 620ms | 9장 |
| shield | 보호막 | 방어 전법 | 자신 또는 아군 몸통 | 타원 72×112 | 850ms | 13장 |
| fury | 기세 | 강화 전법 | 자신 발밑에서 위로 | 줄 9개, 폭 64, 높이 110 | 720ms | 11장 |
| flurry | 잔 베기 | 근접 전법 | 대상 가슴 | 길이 40 선 5개 | 440ms | 7장 |
| blink | 순간이동 연기 | 근접 전법 | 자신 자리와 대상 자리 | 연기 지름 64, 두 곳 | 340ms | 5장 |
| bind | 밧줄 | 방해 전법 | 대상 몸통 | 고리 3개 60×16 | 680ms | 10장 |
| drain | 흡수 | 근접 전법 | 대상 가슴 → 자신 가슴 | 점 7개, 지름 8 | 540ms | 8장 |
| stun | 기절 별 | 전법 부가 | 대상 머리 위 (발에서 112) | 별 3개, 지름 12 | 850ms | 13장 |

### 책사·지원 전법

| 종류 | 이름 | 쓰임 | 기준점 | 크기 | 시간 | 권장 장수 |
|---|---|---|---|---|---|---|
| bolt | 번개 | 책사 전법 | 하늘 → 대상 발밑 | 높이 380, 폭 44, 바닥 빛 60×20 | 340ms | 5장 |
| rock | 낙석 | 책사 평타·전법 | 하늘 → 대상 발밑 | 바위 지름 36, 낙하 300, 먼지 고리 92×28 | 430ms | 7장 |
| ice | 얼음 조각 | 책사 평타·전법 | 하늘 → 대상 발밑 | 조각 16×34, 낙하 260 | 380ms | 6장 |
| fire | 불기둥 | 책사 전법 | 대상 발밑 | 폭 80, 높이 86, 바닥 빛 80×22 | 560ms | 8장 |
| wind | 회오리 | 책사 평타·전법 | 대상 발밑 | 아래 폭 20, 위 폭 80, 높이 90 | 560ms | 8장 |
| rune | 진 | 책사·지원 전법 | 대상(또는 자신) 발밑 | 팔각 두 겹 92×30 | 650ms | 10장 |
| chain | 사슬 | 책사 전법 | 대상들의 가슴을 잇는다 | 굵기 3 점선 | 650ms | 10장 |
| heal | 회복 빛 | 지원 전법 | 아군 발밑에서 위로 | 십자 10×10 여섯 개, 상승 90 | 650ms | 10장 |
| aura | 강화 고리 | 지원 전법 | 아군 발밑 | 고리 60×18에서 88×26, 상승 40 | 650ms | 10장 |

## 근접 평타가 정해지는 규칙

본 동작의 이름으로 자국이 정해집니다. 위에서부터 먼저 맞는 줄을 씁니다.

| 동작 이름에 들어 있는 말 | 종류 |
|---|---|
| 방패 치기 | 방패 치기(thud) |
| 찌르, 직창 | 짧은 찌르기(jab) |
| 교차 | X자 베기(cross) |
| 올려 | 올려 베기(rise) |
| 내리꽂, 내려, 찍 | 내려 베기(chop) |
| 후리, 당기 | 채찍 줄(whip) |
| 그 밖 (베기, 휘두르기, 걸기) | 짧은 베기(cut) |

### 병종별 평타 동작과 자국

| 병종 | 동작 → 자국 |
|---|---|
| 보행 창 | A1 정면 직창 → jab<br>A2 상단 내리꽂기 → chop<br>A3 도약 내려찍기 → chop<br>B1 가로 휘두르기 → cut<br>B2 세로 내려치기 → chop<br>B3 올려치기 → rise |
| 한손 검 | A1 사선 내려베기 → chop<br>A2 올려베기 → rise<br>A3 전진 찌르기 → jab<br>B1 수평 베기 → cut<br>B2 찌르고 올려베기 → jab<br>B3 도약 내려베기 → chop |
| 창·방패 | A1 방패 뒤 직창 → jab<br>A2 방패 밀고 찌르기 → jab<br>A3 어깨 위 내리꽂기 → chop<br>B1 방패 치기 → thud<br>B2 가로 휘두르기 → cut<br>B3 올려치기 → rise |
| 쌍무기 | A1 우 베기·좌 받침 → cut<br>A2 올려베기·하단 막기 → rise<br>A3 교차 베기 → cross<br>B1 좌우 연속 베기 → cut<br>B2 좌우 연속 찌르기 → jab<br>B3 도약 쌍검 내려베기 → chop |
| 중무기 | A1 내려찍기 → chop<br>A2 가로 후려치기 → cut<br>A3 올려치기 → rise<br>B1 짧게 찍기 → chop<br>B2 두 번 찍기 → chop<br>B3 크게 돌려 내려찍기 → chop |
| 사슬·채찍 | A1 후려치기 → cut<br>A2 올려 후리기 → rise<br>A3 내려 후리기 → chop<br>B1 가로 후리기 → whip<br>B2 두 번 후리기 → whip<br>B3 감아 당기기 → whip |
| 군령 | A3 직접 베기 → cut<br>B3 직접 찌르기 → jab |
| 기마 월도 | A1 대각 내려베기 → chop<br>A2 올려베기 → rise<br>A3 가로 베기 → cut<br>B1 찌르기 → jab<br>B2 이단 베기 → cut<br>B3 앞발 굴러 내려베기 → chop |
| 기마 창 | A1 기마 직창 → jab<br>A2 세로 내려치기 → chop<br>A3 가로 휘두르기 → cut<br>B1 올려치기 → rise<br>B2 이단 찌르기 → jab<br>B3 앞발 굴러 내려치기 → chop |
| 사슬낫 (감녕) | A1 안쪽 걸어베기 → cut<br>A2 올려 걸기 → rise<br>A3 깊이 내려찍기 → chop<br>B1 찌르고 올려 걸기 → jab<br>B2 도약 내려찍기 → chop<br>B3 돌아 걸기 → cut |
| 긴자루 도끼 | A1 세로 내려치기 → chop<br>A2 가로 휘두르기 → cut<br>A3 올려치기 → rise |
| 기마 장화극 | A1 사선 베기 → cut<br>A2 쳐올리기 → cut<br>B3 앞발 굴러 내려베기 → chop |
| 기마 장창 | A2 세로 내려치기 → chop<br>A3 두 손 돌려치기 → cut<br>B1 올려치기 → rise |

## 장수별 배정

색은 그 장수의 이펙트 테두리 색입니다. 근접 장수의 평타는 위 규칙을 따르고, 색만 장수 색을 씁니다.

| 장수 | 병종 | 전법 | 색 | 평타 | 전법: 대상에게 | 전법: 자신에게 | 전법: 아군에게 |
|---|---|---|---|---|---|---|---|
| 관우 | 기마 월도 | 청룡참 | `#5fd08a` | jab, rise, cut | 큰 베기(slash) + 충격파(shock) | - | - |
| 장비 | 보행 창 | 장판의 함성 | `#ff7a4a` | jab, chop, chop | - | 함성(roar) + 보호막(shield) | - |
| 조운 | 기마 창 | 용맹돌진 | `#bfe3ff` | jab, chop, cut | 관통 찌르기(pierce) | - | - |
| 황충 | 궁 | 백발백중 | `#ffd76a` | 화살(arrow) | 화살(arrow) 굵게 | - | - |
| 제갈량 | 책사·지원 | 팔진의 책략 | `#9fe6d0` | 회오리(wind) | 진(rune) + 회오리(wind) | - | - |
| 유비 | 쌍무기 | 인의 | `#ffe08a` | cut, rise, chop | - | 함성(roar) | 회복 빛(heal) + 보호막(shield) |
| 조조 | 군령 | 위무지세 | `#c86ad8` | cut, cut, jab (지시 동작은 표적 표시) | - | 함성(roar) | 강화 고리(aura) |
| 하후돈 | 보행 창 | 불굴 | `#d05a5a` | jab, cut, chop | - | 보호막(shield) + 충격파(shock) | - |
| 장료 | 기마 월도 | 급습 | `#8fb8ff` | chop, jab, cut | 돌진 궤적(dash) + 큰 베기(slash) | - | - |
| 주유 | 한손 검 | 화공 | `#ff5a3a` | chop, cut, jab | 불기둥(fire) | - | - |
| 여포 | 기마 장화극 | 무쌍 | `#e0414f` | cut, cut, chop | 충격파(shock) | 회전 베기(spin) + 기세(fury) | - |
| 의용보병 | 창·방패 | 굳건한 방어 | `#c9d6e6` | thud, cut, chop | - | 보호막(shield) + 충격파(shock) + 함성(roar) | - |
| 의용궁병 | 궁 | 집중 사격 | `#f4dea0` | 화살(arrow) | 화살(arrow) 3발 | - | - |
| 군영참모 | 책사·지원 | 응급 처치 | `#b9a2ff` | 빛줄기(missile) | - | 진(rune) | 회복 빛(heal) + 강화 고리(aura) |
| 사마의 | 책사·지원 | 낙뢰 | `#c9b4ff` | 구슬(orb) | 번개(bolt) | - | - |
| 전위 | 쌍무기 | 악래 | `#c86a3a` | cut, rise, cross | - | 함성(roar) + 기세(fury) | - |
| 곽가 | 책사·지원 | 십승십패 | `#d6f3ff` | 얼음 조각(ice) | 얼음 조각(ice) | - | - |
| 허저 | 중무기 | 호치 | `#ffb24a` | chop, rise, chop | - | 보호막(shield) + 기세(fury) | - |
| 하후연 | 궁 | 신속 | `#f4dea0` | 화살(arrow) | 화살(arrow) | - | - |
| 서황 | 긴자루 도끼 | 대부 강타 | `#e6d2a0` | chop, cut, rise | 큰 베기(slash) + 충격파(shock) + 기절 별(stun) | - | - |
| 순욱 | 책사·지원 | 왕좌지재 | `#b9a2ff` | 빛줄기(missile) | - | 진(rune) + 함성(roar) | 강화 고리(aura) + 회복 빛(heal) |
| 악진 | 한손 검 | 선등 | `#e8ecf4` | cut, jab, chop | 큰 베기(slash) | - | - |
| 조홍 | 창·방패 | 사수 | `#9fb8d8` | cut, chop, rise | - | 보호막(shield) + 충격파(shock) + 기세(fury) | - |
| 마초 | 기마 장창 | 서량철기 | `#f2f2f2` | chop, rise, cut | 돌진 궤적(dash) + 충격파(shock) + 기절 별(stun) | - | - |
| 방통 | 책사·지원 | 연환계 | `#c8ccd4` | 낙석(rock) | 사슬(chain) + 낙석(rock) | - | - |
| 강유 | 보행 창 | 북벌의 창 | `#9fe6d0` | cut, chop, chop | 관통 찌르기(pierce) + 밧줄(bind) | - | - |
| 위연 | 한손 검 | 기습 | `#ff5a5a` | jab, jab, chop | X자 베기(cross) + 흡수(drain) | - | - |
| 요화 | 한손 검 | 선봉 불퇴 | `#d8e0ea` | chop, rise, chop | 큰 베기(slash) | 보호막(shield) | - |
| 주창 | 한손 검 | 호위 | `#c9d6e6` | cut, rise, chop | - | 함성(roar) + 기세(fury) | 보호막(shield) + 강화 고리(aura) |
| 손책 | 쌍무기 | 소패왕 | `#ffc44a` | cut, cut, rise | - | 기세(fury) + 함성(roar) | - |
| 육손 | 책사·지원 | 화소연영 | `#ff8a3a` | 구슬(orb) | 불기둥(fire) | - | - |
| 손권 | 군령 | 강동의 주인 | `#6ad0c8` | cut, cut, jab (지시 동작은 표적 표시) | - | 함성(roar) | 보호막(shield) |
| 감녕 | 사슬낫 (감녕) | 금범적 | `#7fd6c0` | jab, chop, cut | 순간이동 연기(blink) + X자 베기(cross) | - | - |
| 태사자 | 궁 | 삼연사 | `#f4dea0` | 화살(arrow) | 화살(arrow) 3발 | - | - |
| 여몽 | 보행 창 | 백의도강 | `#f4f4f4` | cut, chop, chop | 순간이동 연기(blink) + 관통 찌르기(pierce) | - | - |
| 황개 | 사슬·채찍 | 고육계 | `#ff7a3a` | rise, whip, chop | - | 불기둥(fire) + 기세(fury) | - |
| 노숙 | 책사·지원 | 동맹의 가교 | `#b9a2ff` | 구슬(orb) | - | 진(rune) + 회오리(wind) | 회복 빛(heal) + 강화 고리(aura) |
| 손상향 | 궁 | 궁요희 | `#ffb7a0` | 화살(arrow) | 화살(arrow) 6발 화살비 | - | - |
| 정봉 | 한손 검 | 설중분단 | `#d6f3ff` | rise, jab, chop | 큰 베기(slash) + 얼음 조각(ice) | - | - |
| 반장 | 사슬·채찍 | 포박 | `#b08a5a` | whip, whip, chop | 밧줄(bind) | - | - |
| 장각 | 책사·지원 | 태평요술 | `#ffe36a` | 빛줄기(missile) | 번개(bolt) | - | - |
| 동탁 | 한손 검 | 폭정 | `#c85a8a` | chop, rise, jab | 흡수(drain) | 회전 베기(spin) | - |
| 원소 | 군령 | 명문의 위세 | `#f0dba4` | cut, cut, jab (지시 동작은 표적 표시) | - | 함성(roar) | 강화 고리(aura) |
| 화타 | 책사·지원 | 청낭서 | `#b9a2ff` | 침(needle) | - | 진(rune) + 함성(roar) | 회복 빛(heal) + 강화 고리(aura) |
| 안량 | 한손 검 | 선봉 돌파 | `#ffd76a` | chop, cut, rise | 관통 찌르기(pierce) | - | - |
| 문추 | 보행 창 | 추격 | `#ffb07a` | cut, chop, rise | 잔 베기(flurry) + 관통 찌르기(pierce) | - | - |
| 초선 | 책사·지원 | 경국지색 | `#b9a2ff` | 꽃잎(petal) | - | 진(rune) + 함성(roar) | 강화 고리(aura) + 보호막(shield) |
| 화웅 | 한손 검 | 관문의 맹장 | `#ff8a4a` | cut, rise, jab | 큰 베기(slash) | 기세(fury) | - |
| 공손찬 | 기마 장창 | 백마의종 | `#ffffff` | chop, rise, cut | 순간이동 연기(blink) + 관통 찌르기(pierce) | - | - |

## 이펙트 그림 만드는 법

### 준비물

| 준비물 | 어디에 있나 |
|---|---|
| 종류별 규격 (크기, 시간, 장수, 기준점) | 위의 "종류" 표 |
| 종류별 시안 그림 | `art-source/effects/v1/reference/<종류>.png` (여섯 장면을 사람 모양과 함께), `<종류>-peak.png` (가장 뚜렷한 한 장면, 투명 배경) |
| 움직이는 시안 | `sim/effects.html` |
| 장수 색 | 위의 "장수별 배정" 표 |
| 그림체 기준 | 확정 원화 `art-source/characters/v1/` (굵은 어두운 윤곽선, 단색 면, 픽셀 그림) |

시안 그림은 `bone-motion/engine/make_effect_refs.cjs`로 다시 뽑습니다.

### 방법 1. 사람이나 다른 Claude가 그린다

이 문서와 `art-source/effects/v1/reference/` 폴더를 통째로 넘기고, 아래 내용을 그대로 요청합니다.

- 종류마다 "종류" 표의 권장 장수만큼 그립니다. 시안의 여섯 장면이 시작, 가장 큰 순간, 사라지는 순간의 기준입니다.
- 캔버스는 종류마다 하나로 고정하고, 모든 프레임에서 기준점의 위치가 같아야 합니다. 기준점 좌표를 `fx/<종류>/anchor.json`에 `{"canvas": [가로, 세로], "anchor": [x, y], "anchorIs": "대상 가슴"}` 꼴로 적습니다.
- 배경은 투명, 흰 심과 색 테두리로 그립니다. 색 테두리는 중간 밝기의 한 가지 색으로 그려 두면 게임에서 장수 색으로 바꿉니다.
- 캐릭터는 그리지 않습니다. 시안의 회색 사람 모양은 크기와 위치를 보라는 표시입니다.
- 결과는 `art-source/effects/v1/fx/<종류>/01.png …`에 넣습니다.

### 방법 2. PixelLab으로 만든다

PixelLab API 문서(2026-11-19 확인)에 따르면 캐릭터 뼈대 없이 이펙트를 만들 수 있는 기능이 있습니다. 아직 시험해 보지 않았고, 비용은 문서에 적힌 값이라 실제 견적(`quoted_generations`)으로 다시 확인해야 합니다.

| 기능 | 넣는 것 | 나오는 것 | 문서상 비용 |
|---|---|---|---|
| `/vfx` (이펙트 전용) | 설명 글(`description`), 프레임 수(`sprite_frames` 1~32), 속도(`sprite_fps`), 품질(`artist`: lite 또는 pro). 참고 그림(`sprite`)은 선택 | 최대 512×512, 최대 32프레임 | 128px 이하 lite 1회분, pro 6회분, 참고 그림을 쓰면 3~28회분 |
| `/animate-with-text-v3` | 첫 프레임 그림(`first_frame`, 최대 256×256) 필수, 동작 글(`action`), 프레임 수(`frame_count` 4~16 짝수), 투명 배경(`no_background`). 끝 프레임(`last_frame`)은 선택 | 최대 256×256, 4~16프레임 | 문서에 없음 |
| `/create-image-pixen` | 설명 글, 크기, 투명 배경(256×256까지) | 정지 그림 1장 (첫 프레임을 만들 때) | 문서에 없음 |

PixelLab으로 가려면 필요한 것은 세 가지입니다.

1. **설명 글**: 아래 표의 영어 문장에 공통 문구를 붙입니다.
2. **첫 프레임 그림** (`/animate-with-text-v3`를 쓸 때만): `<종류>-peak.png`를 그 종류 크기로 잘라 쓰거나, 방법 1로 한 장만 먼저 그립니다. 256×256을 넘는 종류(번개, 함성, 시전 빛기둥)는 절반 크기로 만들어 게임에서 키웁니다.
3. **프레임 수와 크기**: "종류" 표의 권장 장수와 크기.

공통 문구: `pixel art visual effect sprite, transparent background, no character, no weapon, no text, thick dark outline is not needed, white core with a single mid-bright color edge, clean shapes, readable at small size, low top-down game camera`

권장 순서: `/vfx`로 성격이 다른 세 가지(짧은 베기 cut, 번개 bolt, 보호막 shield)를 lite로 먼저 한 번씩 만들어 보고(문서상 3회분), 쓸 만하면 나머지를 넣습니다. 38가지를 lite로 한 번씩이면 문서상 38회분입니다.

| 종류 | 설명 글 (영어, 공통 문구 앞에 붙인다) |
|---|---|
| 짧은 찌르기(jab) | a short straight thrust streak, thin bright line with a white core, pointing right, appears and fades in a flash |
| 짧은 베기(cut) | a short crescent slash arc, white core with a colored edge, sweeping once and fading |
| 내려 베기(chop) | a vertical downward slash mark, slightly curved, drawn from top to bottom then fading |
| 올려 베기(rise) | a vertical upward slash mark, slightly curved, drawn from bottom to top then fading |
| 방패 치기(thud) | a blunt impact ring that expands once with four short white rays, shield bash hit |
| 채찍 줄(whip) | a thin whip line that bends in an arc and snaps straight to the right |
| X자 베기(cross) | two crossing slashes forming an X, the second a moment after the first |
| 맞는 섬광(spark) | a small white hit flash with six short rays, very brief |
| 화살(arrow) | a single arrow flying to the right in a shallow arc, white arrowhead, no bow, no archer |
| 빛줄기(missile) | a short streak of light flying straight to the right |
| 구슬(orb) | a glowing magic orb with a short trail flying to the right, then bursting into a ring |
| 꽃잎(petal) | four flower petals fluttering to the right in a wavy path |
| 침(needle) | a very thin fast needle streak flying to the right |
| 표적 표시(order) | a round target mark with four tick lines that tightens onto a point and fades |
| 시전 빛기둥(cast) | a tall pillar of light rising from a ring on the ground, sparkles floating up, then fading |
| 명중 섬광(burst) | a bright starburst flash with twelve rays and flying sparks, plus a ground ring, then fading |
| 큰 베기(slash) | a large crescent slash arc with a white core and thick colored edge, one powerful sweep |
| 관통 찌르기(pierce) | a long piercing thrust streak that shoots to the right through a point and beyond |
| 돌진 궤적(dash) | five parallel speed lines along the ground streaking to the right |
| 충격파(shock) | a ground shockwave: two flat rings expanding on the ground with short cracks radiating out |
| 회전 베기(spin) | a flat spinning slash ring at waist height, seen from a low top-down camera |
| 함성(roar) | three flat rings expanding outward on the ground one after another, a war cry shockwave |
| 보호막(shield) | a translucent oval barrier dome with a moving highlight, appears, holds, fades |
| 기세(fury) | short streaks of energy rising upward from the ground like an aura |
| 잔 베기(flurry) | five small quick slashes at random angles, one after another |
| 순간이동 연기(blink) | a puff of smoke that shrinks and vanishes, vanish effect |
| 밧줄(bind) | three rope rings that tighten around an upright body shape and fade |
| 흡수(drain) | seven small glowing motes flying to the left in a loose stream |
| 기절 별(stun) | three small stars circling in a flat ring |
| 번개(bolt) | a lightning bolt striking down from the top of the frame to the ground, flickering, with a glow where it lands |
| 낙석(rock) | a boulder falling from above, hitting the ground and breaking into dust and a dust ring |
| 얼음 조각(ice) | sharp ice shards falling diagonally from the upper left, shattering on the ground |
| 불기둥(fire) | a pillar of flames rising from the ground, flickering, with a glowing base, then dying down |
| 회오리(wind) | a small whirlwind, narrow at the bottom and wide at the top, spinning in place |
| 진(rune) | an octagonal formation circle drawn on the ground, two nested octagons slowly rotating, flat on the ground |
| 사슬(chain) | a taut chain stretched horizontally between two points, links sliding along it |
| 회복 빛(heal) | small plus-shaped lights rising upward and fading |
| 강화 고리(aura) | two flat rings rising from the ground and fading, a buff effect |

## 그림으로 바꿔 끼우는 법

- 누가 어떤 종류를 쓰는지는 `sim/effects.js`의 `HERO` 표에 있습니다. 종류를 바꾸거나 색을 바꿀 때는 이 표만 고칩니다.
- 종류마다 그리는 함수는 같은 파일의 `KINDS`에 있습니다. 그림이 준비된 종류는 그 함수를 "기준점에 프레임 그림을 그리는 코드"로 바꿉니다. 나머지 종류는 임시 도형으로 계속 나옵니다.
- 시뮬레이터의 피해 규칙은 단순합니다. 가로 한 줄, 지나가는 길 같은 범위는 아직 없어서 이펙트가 대상 자리에만 나옵니다. 게임에 넣을 때는 전법 설명의 범위에 맞춰 배치합니다.
