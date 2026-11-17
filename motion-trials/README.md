# 모션 시험 (브랜치 전용)

PixelLab `animate-with-skeleton-v3`(베타)로 뼈대 좌표를 직접 지정해 모션을 뽑는 시험이다. 이 폴더의 PNG는 시험 결과를 다른 PC에서 바로 보기 위해 Git에 직접 올린다(릴리스 `assets-v1`은 건드리지 않는다). 게임에는 연결되어 있지 않다.

- `tools/pixellab_client.py` — API 호출. 토큰은 환경 변수 `PIXELLAB_API_KEY`에서만 읽고 어디에도 저장하지 않는다.
- `tools/motion_trial_zhangfei.py` — 장비 왼쪽 기본 공격. `poses`(호출 없음) → `key` → `clip`.

## zhangfei-side-attack (2026-11-17)

| 파일 | 내용 |
|---|---|
| `01-estimate-*.json` | 원화에서 추정한 맞춤 뼈대(몸 22관절 + 창 5관절). 1회분 |
| `02-rest-skeleton.png`, `02-planned-skeletons.png` | 원화 위 뼈대, 계산으로 만든 12프레임 뼈대 |
| `03-key-*` | 최대 신전 자세 1프레임만 생성. **실패**: 선 자세와 섞인 흐린 중간 그림이 나옴. 2회분 |
| `04-clip-*` | 12프레임 전체 생성. 3회분 |

결과 요약은 대화 기록 참고. 합계 6회분 사용.
