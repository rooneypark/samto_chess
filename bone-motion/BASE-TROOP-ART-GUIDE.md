# 기본 병종 원화 가이드 (3방향)

기본 병종 다섯 가지(검병, 창병, 방패병, 궁병, 책사)의 기본 자세 원화를 정면·측면·후면으로 만들 때 쓰는 규격입니다.
이 원화에서 PixelLab이 전투 대기와 모든 동작을 그리므로, 여기서 정한 크기와 무기 길이가 끝까지 갑니다.

## 공통 규격

| 항목 | 값 |
|---|---|
| 캔버스 | 256×256 px, 투명 배경 PNG, 방향마다 한 장 |
| 방향 | 정면(`front.png`), 왼쪽을 보는 측면(`side.png`), 완전한 후면(`back.png`) |
| 발밑 기준점 | 두 발 사이 가운데가 (128, 224). 발바닥은 y=224 줄에 닿는다 |
| 몸 크기 | 발바닥에서 정수리까지 124px (책사는 111px). 투구 장식과 상투는 그 위로 더 올라가도 된다 |
| 그림체 | 확정 장수 원화와 같다: 굵고 어두운 윤곽선, 단색 면에 음영 2~3단계, 픽셀 그림 |
| 픽셀 | 가장자리는 또렷하게. 반투명 픽셀, 흐림, 그림자, 바닥, 이펙트, 글자 없음 |
| 저장 위치 | `bone-motion/art-in/<병종 id>/front.png`, `side.png`, `back.png` |

## 자세 (기본 자세)

- 똑바로 선 자세. 두 발은 어깨너비로 나란히, 무릎은 펴고, 팔은 몸에서 조금 떨어뜨린다.
- 무기는 오른손에 들고 몸 옆에 곧게 세운다. 방패와 활은 왼손에 든다.
- 세 방향이 같은 순간을 세 곳에서 본 그림이어야 한다. 자세, 무기 위치, 손 위치가 방향마다 달라지면 안 된다.
- 측면은 캐릭터가 화면 왼쪽을 본다. 오른쪽 보기는 게임이 뒤집어 쓴다. 왼쪽을 보면 보는 사람 쪽에 오는 것은 캐릭터의 왼팔이다(방패와 활이 앞쪽, 오른손 무기는 몸 건너편).
- 후면은 완전히 뒤에서 본 모습이다. 얼굴, 수염, 눈이 조금도 보이면 안 된다.

## 무기 길이 (가장 중요)

PixelLab은 무기 길이를 원화에서 가져오고 나중에 바꾸지 못합니다. 아래 길이로 그리고, **세 방향에서 같은 길이**여야 합니다.
(여포는 정면 217px, 후면 192px로 서로 달라서 나중에 손으로 맞춰야 했습니다.)

| 병종 | id | 본 | 무기 | 길이 (끝에서 끝) | 잡는 위치 |
|---|---|---|---|---|---|
| 검병 | swordsman | 한손 검 | 검 | 40px | 손잡이 |
| 창병 | spearman | 보행 창 | 창 | 128px | 자루 끝에서 34px 올라온 곳(뒷손). 두 손으로 드는 창이지만 기본 자세에서는 오른손으로 세워 든다 |
| 방패병 | infantry | 창·방패 | 짧은 창 + 방패 | 창 104px | 창은 오른손, 방패는 왼팔 |
| 궁병 | archer | 궁 | 활 | 68px | 활은 왼손, 오른손은 빈손. 화살통은 등 |
| 책사 | tactician | 책사 | 부채 | 24px | 오른손 |

- 무기는 캔버스 안에 다 들어와야 한다. 창을 세웠을 때 위로 잘리면 안 된다.
- 무기는 몸이나 다른 물건에 가려지지 않게 그린다. 가려진 부분은 길이를 잴 수 없다.

## 색 바꾸기를 위한 규칙

기본 병종은 한 벌을 만들고 진영 색만 바꿔 씁니다.

- **진영 색이 들어갈 자리를 정한다**: 옷(상의나 치마), 허리띠, 투구 술 가운데 한두 곳. 병종 다섯 가지가 같은 자리를 쓰면 통일감이 난다.
- 그 자리는 **한 가지 색 계열의 밝기 단계 3~4개**로만 칠한다. 원화에서는 빨강 계열로 칠해 두면 바꾸기 쉽다.
- 그 색 계열은 피부, 금속, 가죽, 나무, 머리카락 등 다른 곳에 쓰지 않는다.
- 진영 색 자리와 다른 색 사이에 윤곽선을 둔다. 섞이는 중간색을 만들지 않는다.

## 기본 병종답게

- 장수보다 수수하게: 장식, 금테, 문양을 줄인다.
- **망토, 긴 끈, 긴 머리띠처럼 길게 늘어지는 천은 넣지 않는다.** 동작을 그릴 때 번지거나 잔상이 생기는 원인이 됐다.
- 다섯 병종의 키, 머리 크기, 윤곽선 굵기를 맞춘다.

## 그림 생성 도구에 넣는 프롬프트 (영어)

공통 문구 뒤에 병종 문구를 붙이고, 방향마다 방향 문구를 바꿉니다.

**공통**

```
Pixel art game sprite of a Three Kingdoms era Chinese foot soldier, low top-down 3/4 game camera, full body, standing still in a neutral pose: feet shoulder-width apart, knees straight, arms slightly away from the body. Thick dark outline, flat colours with 2-3 shade steps, crisp pixel edges, no anti-aliasing, no semi-transparent pixels. Transparent background, no ground, no shadow, no effects, no text. 256x256 canvas, the soles of the feet on the row y=224, the point between the feet at x=128. The body is 124 px tall from soles to the top of the head. Plain rank-and-file equipment: little decoration, no cape, no long ribbons or sashes. The tunic and the waist sash are the team colour: painted in one red hue with 3-4 shade steps, and that hue is used nowhere else on the figure.
```

**방향**

```
FRONT VIEW: seen from directly in front, face visible.
LEFT-FACING SIDE VIEW: the same figure in the same pose, turned to face the left edge of the canvas. Its left arm is the one nearer the viewer (a shield or a bow is on the near side); the right hand and its weapon are on the far side.
STRICT REAR VIEW: the same figure in the same pose seen from directly behind; no part of the face is visible.
```

**병종**

```
Swordsman: a one-handed straight sword, 40 px from pommel to point, held upright in the right hand beside the body. Leather and cloth armour, a simple helmet.
Spearman: a spear exactly 128 px long from butt to point, held upright in the right hand beside the body, the hand 34 px above the butt, the butt just above the ground. Light armour, a simple helmet.
Shield soldier: a spear exactly 104 px long held upright in the right hand, and a round or rectangular shield on the left forearm, held at the side. Heavier armour.
Archer: a bow 68 px tall held in the left hand at the side, the string toward the body, the right hand empty; a quiver on the back. Light cloth and leather, a cap.
Strategist: a small feather fan 24 px long held in the right hand at chest height; a long robe to the ankles and a scholar's cap. This figure is 111 px tall instead of 124.
```

세 방향을 따로 생성하면 옷과 무기가 방향마다 달라지기 쉽습니다. 정면을 먼저 확정한 뒤, 그 그림을 참고 그림으로 넣어 측면과 후면을 만드는 순서를 권합니다.

## 받은 뒤 확인하는 것

1. 세 장 모두 256×256이고 배경이 투명한가.
2. 발바닥이 y=224에 있고, 두 발 사이가 x=128인가.
3. 몸 키가 124px(책사 111px)인가. 다섯 병종이 서로 같은가.
4. 무기 길이가 표와 같고, 세 방향에서 같은가.
5. 후면에 얼굴이 보이지 않는가.
6. 진영 색 자리가 한 가지 색 계열로만 칠해졌고, 그 색이 다른 곳에 없는가.
7. 반투명 픽셀이나 떨어진 점이 없는가.

검사 도구: `python -X utf8 bone-motion/engine/artcheck.py <id>` (무료 항목만 보려면 `--estimate` 없이).
