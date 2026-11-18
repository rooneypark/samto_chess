# 원화 넣는 곳

장수마다 폴더가 하나씩 있다. 폴더 이름은 게임의 장수 ID다. 각 폴더에 아래 세 파일을 넣는다.

| 파일 | 내용 |
|---|---|
| `front.png` | 정면 (캐릭터가 화면 쪽을 봄) |
| `side.png` | 왼쪽 측면 (캐릭터가 화면 왼쪽을 봄) |
| `back.png` | 후면 (캐릭터가 화면 안쪽을 봄) |

## 장수별 요청서 (먼저 읽을 것)

장수 폴더마다 `guide/`가 있다. 원화를 그릴 때는 그 안의 네 파일을 쓴다.

| 파일 | 내용 |
|---|---|
| `guide/REQUEST.md` | 그 장수의 요청서: 살릴 특징, 키·폭·무기 길이, 방향별 좌표, 지킬 것, 넘기기 전에 잴 것 |
| `guide/guide-front-256.png`, `guide-side-256.png`, `guide-back-256.png` | 실제 크기(256×256) 안내. 이 그림을 밑에 깔고 그린다. 납품 그림과 좌표가 1:1로 맞는다 |
| `guide/guide-front.png`, `guide-side.png`, `guide-back.png` | 같은 안내를 4배(1024×1024)로 키워 글자와 치수를 넣은 것. 읽는 용도이고 이 크기로 납품하지 않는다. 회색 인형 = 몸, 빨간 선 = 무기, 주황 점 = 손, 파란 선 = 머리 꼭대기, 초록 선 = 바닥 |

요청서와 가이드는 `python -X utf8 bone-motion/engine/hero_guides.py`로 만든다. 장수별 수치는 `bone-motion/hero-profiles.json`에 있고, 고칠 때는 `engine/hero_guides.py`의 `OVERRIDE`를 고친 뒤 다시 실행한다.

### 표준과 다르게 그리는 장수

본은 보병·책사·기마 3개, 모션은 유형 11개를 함께 쓴다. 장수의 고유한 특징은 아래 수치와 그림(얼굴, 수염, 복식, 무기 모양)으로 살린다. 여기에 없는 장수는 표준 크기다.

| 장수 | 유형 | 키 | 폭 | 무기 길이 |
|---|---|---|---|---|
| 관우 | 기마 월도·화극 | 100% | 110% | 148px (표준 148) |
| 장비 | 보행 창 | 100% | 115% | 140px (표준 128) |
| 여포 | 기마 월도·화극 | 100% | 110% | 148px (표준 148) |
| 전위 | 쌍무기 | 105% | 115% | 36px (표준 36) |
| 곽가 | 책사·지원 | 100% | 92% | - |
| 허저 | 중무기 | 106% | 115% | 78px (표준 78) |
| 서황 | 중무기 | 103% | 108% | 78px (표준 78) |
| 악진 | 한손 검·단도 | 96% | 100% | 34px (표준 40) |
| 위연 | 한손 검·단도 | 100% | 100% | 50px (표준 40) |
| 주창 | 한손 검·단도 | 103% | 108% | 50px (표준 40) |
| 손상향 | 궁 | 100% | 92% | - |
| 정봉 | 한손 검·단도 | 100% | 100% | 34px (표준 40) |
| 동탁 | 한손 검·단도 | 100% | 122% | 50px (표준 40) |
| 안량 | 한손 검·단도 | 103% | 108% | 50px (표준 40) |
| 문추 | 보행 창 | 103% | 108% | 128px (표준 128) |
| 초선 | 책사·지원 | 100% | 92% | - |
| 화웅 | 한손 검·단도 | 103% | 108% | 50px (표준 40) |

### 무기를 얼마나 키울 수 있나

무기는 원화에 그린 길이 그대로 모션에 나온다(PixelLab은 무기 길이를 원화에서 가져온다). 그래서 길이의 한계는 "그 유형의 모든 클립에서 무기 끝이 캔버스 안에 있는가"로 정한다. 표준에서 더 키울 수 있는 길이는 다음과 같다.

| 유형 | 더 키울 수 있는 길이 |
|---|---|
| 보행 창 | +14px |
| 한손 검·단도 | +16px |
| 창·방패 | +16px |
| 쌍무기 | +18px |
| 중무기 | +2px |
| 군령 | +17px |
| 기마 창 | +5px |
| 기마 월도·화극 | +4px |
| 사슬낫 | +18px |

- 길이를 못 키우는 무기는 **날·머리 부분의 크기와 폭**으로 존재감을 준다(관우의 월도 날, 허저의 철퇴 머리).
- 몸을 줄여서 무기가 길어 보이게 하지 않는다.

## 조건

- 256×256 PNG, 투명 배경. 그림 안에 바닥·그림자·배경을 넣지 않는다.
- 발이 땅에 닿는 기준점은 (128, 224). 세 장 모두 같은 자리, 같은 축척.
- 자세는 그 장수 유형의 **전투 대기 첫 프레임**이다. `bone-motion/out/idle-reference/`의 해당 유형 그림(512px, 2배)을 따라 그린다. 세 장은 같은 자세를 세 방향에서 본 것이어야 한다.
- 손이 무기를 잡는 위치와 발 위치는 본 자세와 같게 한다. 얼굴, 옷, 갑옷, 무기 모양은 장수에 맞게 그린다.
- 무기를 든 채로 그린다. 무기 끝이 캔버스 밖으로 잘리지 않게 한다.
- 오른쪽 측면은 넣지 않는다. 왼쪽 측면을 좌우 반전해 쓴다.
- 무기 길이나 체격이 본과 다르면 같은 폴더에 `notes.txt`로 적어 둔다(예: "칼 길이 52px", "키 +5%"). 크기 허용 범위는 통합가이드 0.8절.

## 무기 치수 (본과 같아야 한다)

무기 길이와 손이 잡는 자리가 본과 다르면 모션에서 무기가 어색해진다. 장비 첫 납품에서 창이 171px(본은 128px)이라 찌르기가 "가운데를 잡고 미는" 모양이 됐다(2026-11-18).

| 전투 유형 | 무기 전체 길이 | 손이 잡는 자리 (무기 끝에서) |
|---|---|---|
| 보행 창 | 128px (날 24px 포함) | 뒷손(오른손) 34px, 앞손(왼손) 62px |
| 한손 검·단도 | 40px | 오른손 6px |
| 창·방패 | 창 104px, 방패 지름 24px | 오른손 40px, 방패는 왼팔 |
| 쌍무기 | 각 36px | 6px |
| 중무기 | 78px (머리 20px 포함) | 왼손 8px, 오른손 34px |
| 사슬·채찍 | 66px | 오른손이 손잡이 끝 |
| 궁 | 활 68px | 왼손이 가운데 |
| 군령 | 검 36px | 오른손 6px |
| 책사·지원 | 부채 24px | 오른손이 손잡이 끝 |
| 기마 창 | 140px | 오른손 50px |
| 기마 월도·화극 | 148px (날 36px 포함) | 오른손 55px |
| 사슬낫 (감녕) | 낫 30px | 오른손 6px, 사슬은 왼손에 모아 쥠 |

- 길이는 무기 끝에서 끝까지 잰 값이다. ±5px 안이면 그대로 쓴다.
- 측면 그림에서 재면 가장 정확하다. `idle-reference`의 측면 그림에 무기가 본 길이로 그려져 있으니 그 위에 겹쳐 맞춘다.
- 장수 특징 때문에 더 길거나 짧아야 하면 `notes.txt`에 길이를 적는다. 그 장수의 모션을 그 길이로 다시 맞춘다.

## 장수 폴더

| 폴더 | 장수 | 전투 유형 | 따라 그릴 자세 |
|---|---|---|---|
| `1` | 관우 | 기마 월도·화극 | `idle-reference/10-mounted_blade-front.png` 외 2장 |
| `2` | 장비 | 보행 창 | `idle-reference/01-foot_spear-front.png` 외 2장 |
| `15` | 조운 | 기마 창 | `idle-reference/11-mounted_spear-front.png` 외 2장 |
| `16` | 황충 | 궁 | `idle-reference/07-bow-front.png` 외 2장 |
| `35` | 제갈량 | 책사·지원 | `idle-reference/09-caster-front.png` 외 2장 |
| `0` | 유비 | 쌍무기 | `idle-reference/04-dual-front.png` 외 2장 |
| `32` | 조조 | 군령 | `idle-reference/08-command-front.png` 외 2장 |
| `33` | 하후돈 | 보행 창 | `idle-reference/01-foot_spear-front.png` 외 2장 |
| `34` | 장료 | 기마 월도·화극 | `idle-reference/10-mounted_blade-front.png` 외 2장 |
| `77` | 주유 | 한손 검·단도 | `idle-reference/02-sword-front.png` 외 2장 |
| `119` | 여포 | 기마 월도·화극 | `idle-reference/10-mounted_blade-front.png` 외 2장 |
| `infantry` | 의용보병 | 창·방패 | `idle-reference/03-spear_shield-front.png` 외 2장 |
| `archer` | 의용궁병 | 궁 | `idle-reference/07-bow-front.png` 외 2장 |
| `tactician` | 군영참모 | 책사·지원 | `idle-reference/09-caster-front.png` 외 2장 |
| `simayi` | 사마의 | 책사·지원 | `idle-reference/09-caster-front.png` 외 2장 |
| `dianwei` | 전위 | 쌍무기 | `idle-reference/04-dual-front.png` 외 2장 |
| `guojia` | 곽가 | 책사·지원 | `idle-reference/09-caster-front.png` 외 2장 |
| `xuchu` | 허저 | 중무기 | `idle-reference/05-heavy-front.png` 외 2장 |
| `xiahouyuan` | 하후연 | 궁 | `idle-reference/07-bow-front.png` 외 2장 |
| `xuhuang` | 서황 | 중무기 | `idle-reference/05-heavy-front.png` 외 2장 |
| `xunyu` | 순욱 | 책사·지원 | `idle-reference/09-caster-front.png` 외 2장 |
| `yuejin` | 악진 | 한손 검·단도 | `idle-reference/02-sword-front.png` 외 2장 |
| `caohong` | 조홍 | 창·방패 | `idle-reference/03-spear_shield-front.png` 외 2장 |
| `machao` | 마초 | 기마 창 | `idle-reference/11-mounted_spear-front.png` 외 2장 |
| `pangtong` | 방통 | 책사·지원 | `idle-reference/09-caster-front.png` 외 2장 |
| `jiangwei` | 강유 | 보행 창 | `idle-reference/01-foot_spear-front.png` 외 2장 |
| `weiyan` | 위연 | 한손 검·단도 | `idle-reference/02-sword-front.png` 외 2장 |
| `liaohua` | 요화 | 한손 검·단도 | `idle-reference/02-sword-front.png` 외 2장 |
| `zhoucang` | 주창 | 한손 검·단도 | `idle-reference/02-sword-front.png` 외 2장 |
| `sunce` | 손책 | 쌍무기 | `idle-reference/04-dual-front.png` 외 2장 |
| `luxun` | 육손 | 책사·지원 | `idle-reference/09-caster-front.png` 외 2장 |
| `sunquan` | 손권 | 군령 | `idle-reference/08-command-front.png` 외 2장 |
| `ganning` | 감녕 | 사슬낫 (감녕 변형) | `idle-reference/12-sickle-front.png` 외 2장 |
| `taishici` | 태사자 | 궁 | `idle-reference/07-bow-front.png` 외 2장 |
| `lumeng` | 여몽 | 보행 창 | `idle-reference/01-foot_spear-front.png` 외 2장 |
| `huanggai` | 황개 | 사슬·채찍 | `idle-reference/06-flexible-front.png` 외 2장 |
| `lusu` | 노숙 | 책사·지원 | `idle-reference/09-caster-front.png` 외 2장 |
| `sunshangxiang` | 손상향 | 궁 | `idle-reference/07-bow-front.png` 외 2장 |
| `dingfeng` | 정봉 | 한손 검·단도 | `idle-reference/02-sword-front.png` 외 2장 |
| `panzhang` | 반장 | 사슬·채찍 | `idle-reference/06-flexible-front.png` 외 2장 |
| `zhangjue` | 장각 | 책사·지원 | `idle-reference/09-caster-front.png` 외 2장 |
| `dongzhuo` | 동탁 | 한손 검·단도 | `idle-reference/02-sword-front.png` 외 2장 |
| `yuanshao` | 원소 | 군령 | `idle-reference/08-command-front.png` 외 2장 |
| `huatuo` | 화타 | 책사·지원 | `idle-reference/09-caster-front.png` 외 2장 |
| `yanliang` | 안량 | 한손 검·단도 | `idle-reference/02-sword-front.png` 외 2장 |
| `wenchou` | 문추 | 보행 창 | `idle-reference/01-foot_spear-front.png` 외 2장 |
| `diaochan` | 초선 | 책사·지원 | `idle-reference/09-caster-front.png` 외 2장 |
| `huaxiong` | 화웅 | 한손 검·단도 | `idle-reference/02-sword-front.png` 외 2장 |
| `gongsunzan` | 공손찬 | 기마 창 | `idle-reference/11-mounted_spear-front.png` 외 2장 |
장비(ID 2) 전용 사모는 전체 140px, 날 32~36px, 뒷손 34px·앞손 62px다. 표준 보행 창에서 늘어난 12px는 창끝 쪽에 둔다.
