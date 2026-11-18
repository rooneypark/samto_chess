# 장비 모션 인계 — 2026-11-18~19 작업 / 11-19 최신

## 최종 확정 및 정리 — 아래 과거 경로보다 우선

사용자가 후면 공격1 v4까지 전부 최종 확정하고 최종본만 게시하도록 요청했다. 18클립 267프레임은 `art-source/motions/v1/2/final/`에 모았고 픽셀 해시와 타이밍을 유지했다. 현재 목록은 `art-source/motions/v1/2/sim-sources.json` 및 `manifest.json`이다. 아래 out/pixellab 경로는 이력이며 실행 경로로 사용하지 않는다. v4 봉 후퇴가 약하다는 관찰을 포함해 최종 승인됐다. 진행 중 생성은 없다.

이전 작업본 일괄 영구 삭제는 자동 승인 검토에서 차단되어 `C:/Users/pms10/Documents/samto_chess-retired-20261119/`로 이동했다. 저장소/릴리스 납품에서는 제외된다. 원격 업로드는 아래 최종 게시 기록을 참조한다.


## 다음 작업자는 먼저 읽기

사용자 최종 지시는 기존 정면·측면 확정본을 보존하고 후면 수정본을 적용하는 것이다. 새 생성은 지정한 방향/모션만 1건씩 진행한다. 후면 공격 1 봉 가시성 v4는 생성 완료·시뮬레이터 반영됐지만 시각적 문제는 미해결이다. 다시 submit하지 않는다. 서브디자이너에게 보내지 않는다.

## 최신 공격 1 추가 요청 결과

- 후면 공격 1 프롬프트 수정: `a1-rear-shaft-visible-v4`
- PixelLab job: `732f9e3a-e120-4353-b667-80c014c8e226`
- 조회: `python bone-motion/engine/zhangfei_rear_shaft_visible_v4_trial.py a1 fetch`
- 입력 원화, first_frame_keypoints, 15프레임 본/rig와 타이밍은 v3와 동일. request.json 비교에서 action 필드만 바뀐 것과 입력 PNG 바이트 일치를 확인했다.
- 프롬프트: 준비 2~5번에서 카메라 쪽으로 당기는 봉 뒤끝은 우측 몸 바깥에 명확히 보이고, 진짜 먼쪽 부분만 가린다. 6~8번에서 앞으로 찌른다. 얼굴 후면, 그립, 몸 관통 금지는 유지.
- 사용자 요청: 결과 확인 후 시뮬레이터 반영. 생성 성공을 시각적 성공으로 간주하지 말 것. 재실패해도 추가 유료 재생성을 임의로 하지 말 것.
- v4 생성 완료 및 사용자 요청에 따른 시뮬레이터 반영 완료. 원본 v3 보존. v4는 user_review_pending이며 새 최종 승인 아님.

## 애로사항과 재발 방지

1. **후면 원화와 본 방향 불일치.** back.png는 완전 후면인데 기존 공용 GUARD의 hip_turn=30/chest_turn=50 및 양손 전환으로 몸과 얼굴이 틀어졌다. 원화 탓으로 단정하지 말고 원화·본·실제 요청 좌표를 각각 비교한다. 최종 후면 대기는 회전 0, hip_lean=2/chest_lean=4, 양손 준비 자세다. 한손 중립 대기 시안은 반려다. 정면/측면과 같은 준비 동작을 유지한다.
2. **대기가 바뀌면 종속 모션도 재정렬.** 새 확정 후면 대기 `idle-rear-straight-color-fix-v1/01.png`가 후면 공격·이동·스킬 기준이다. 이전 비틀린 후면 세트는 폐기 기록이며 재도입하지 않는다. 발목 흰 하이라이트 제거본을 사용한다.
3. **공격 1·2 손/팔 관통.** IK 도달과 그립 오차만 검사해서는 몸통 관통을 잡지 못한다. 몸통 두께, 손·전완·상완·봉의 충돌과 카메라 가림을 따로 검사한다. `review_rear_contact_fix_v2.py`와 `prepare_rear_attack_contact_v3.py` 사용. 계산상 충돌 통과는 생성 이미지의 관통 없음 보증이 아니다.
4. **공격 1 봉이 사라짐.** v3 실제 본에는 1~5 준비 후퇴, 8번 찌르기, 15번 복귀가 있다. 그러나 생성 이미지 5~13번에서 봉이 거의 가려져 후퇴/찌르기가 읽히지 않는다. 시뮬레이터 누락이 아니라 원본 문제다. 'far-side hands and shaft are occluded by back armor' 문장이 전체 봉 가림을 유도했을 가능성이 있다(원인 확정은 아님). 뒤로 나온 가까운 봉과 먼쪽 봉을 구분하여 명시한다. 손 관통 방지 때문에 무기 전체를 숨기지 않는다. 프롬프트만 바꿔 반드시 해결된다고 보장하지 않는다.
5. **이동 발 방향이 전달되지 않음.** 기본 LEFT LEG/RIGHT LEG는 발목이다. 내부 foot yaw만 0으로 고쳐도 발끝 관절을 전송하지 않으면 신발 방향 제약이 전달되지 않는다. `prepare_move_foot_axis_v3.py`는 toe/heel 4점을 추가한 28점 rig다. 후면 발끝은 캐릭터 진행 방향(화면 위)으로 향하고 뒤꿈치·발바닥이 보여야 한다. 보폭, 접지, 몸 기울기, 루프와 신발 실루엣을 따로 본다. 관절 방향이 맞아도 생성 신발은 대각선일 수 있다.
6. **이동 15번 튐.** 측면은 얼굴/머리/상투/머리띠/어깨를 연속 보정하다 반대 어깨까지 고정하는 부작용이 있었다. 사용자 채택은 보정 전 원본 01~14, 15번만 제외다. 후면도 마지막 신발이 정지 대기로 바뀌는 15번을 제외한 원본 01~14로 최종 확정했다. 후면 신발을 새로 그린 적은 없다. 프레임마다 46ms, 총 644ms 유지. 반려된 얼굴/어깨 보정본을 복구하지 않는다. 이상 프레임을 먼저 번호로 특정하고 전후·루프를 비교한다.
7. **승인과 상태 구분.** 원화 승인, 본 승인, 생성 완료, 사용자 모션 승인, 시뮬레이터 적용, 게임 적용, 릴리스 납품을 구분한다. 이번은 로컬 시뮬레이터 적용이며 게임 배포/릴리스/commit/push는 수행하지 않았다. 후면 공격 1은 전체 승인 이후 봉 가시성 이슈가 재개된 상태다.
8. **비용/중복 요청 방지.** 요청 범위를 넘겨 추가 생성하지 않는다. submission-started.json 또는 job.json이 있으면 같은 작업을 재제출하지 말고 기존 ID를 조회한다. 실패/지연을 완료라고 말하지 않는다. 토큰은 로그/문서에 넣지 않는다. 여러 건 동시 요청이 품질 하락 원인이라는 증거는 없다.

## 현재 시뮬레이터 소스

모든 경로는 `bone-motion/out/pixellab/2/` 아래다. 아래 파일과 `export_zhangfei_sim_clips.py`의 SOURCES를 함께 갱신한다.

| 모션 | 정면 | 측면 | 후면 |
|---|---|---|---|
| idle | `idle-basic-v1/front/playback-trimmed.json` | `idle-basic-v1/left-hand-fix-v1/manifest.json` | `idle-rear-straight-color-fix-v1/manifest.json` |
| a1 | `a1-front-v1/manifest.json` | `a1-left-recovery-fix-v1/manifest.json` | `a1-rear-shaft-visible-v4/result.json` (검토 중) |
| a2 | `a2-front-local-fix-v1/manifest.json` | `a2-left-review-v1/manifest.json` | `a2-rear-contact-v3/result.json` |
| a3 | `a3-front-recovery-review-v1/manifest.json` | `a3-left-local-fix-v1/manifest.json` | `a3-rear-reset-v1/result.json` |
| move | `move-front-v1/result.json` | `move-left-original-trim15-v1/manifest.json` | `move-rear-original-trim15-review-v1/manifest.json` |
| s1 | `s1-front-v1/result.json` | `s1-left-v1/result.json` | `s1-rear-reset-v1/result.json` |

## 적용/검수 위치

- exporter: `bone-motion/engine/export_zhangfei_sim_clips.py`; 실행 후 `bone-motion/sim/zhangfei-clips.js` 생성. PNG 복사 없이 확정 소스 참조.
- 시뮬레이터: `simulator.cmd` / `bone-motion/sim/battle.html`. 6모션×3방향=18클립, 267개 참조 프레임의 256×256 RGBA/경로/타이밍 수 검증 완료.
- 이동도 loopFrame(art,renderTime)으로 재생하도록 수정. 마지막 프레임에 고정시키는 frameOf 사용 금지. 기존 공속+35%, 이동+20%, 공격력−15% 설정 유지.
- 프레임 검수: `bone-motion/sim/rear-frame-review.html` 이전/다음, ←→, Space, 문제 프레임 표시, 신발 확대. 메모/표시는 이 화면 localStorage이며 게임 저장과 무관.
- 후면 이동 승인 목록: `move-rear-original-trim15-review-v1/manifest.json`; 원본은 `move-rear-foot-axis-v3/01.png`~`14.png`, 15.png는 보존하되 재생 제외.
- 정면/후면 pivot=(128,224), 측면=(160,224). 측면 +32px은 캔버스 배치 보정이며 게임 위치 순간 이동이 아니다.
- 큰 사모 전체 약163.4px·날55.1px 유지. 무기에 맞춰 몸/날을 임의 축소하지 않는다.

## 진행 기록

- 2026-11-19: 전체 확정 세트 시뮬레이터 적용. 이후 후면 공격 1 봉 가시성 지적으로 v4 1건 생성 요청. 이후 생성 완료·반영.

- v4 실물 검수: 5~13번의 긴 봉 후퇴 실루엣은 여전히 충분히 보이지 않는다. 프롬프트만으로 해결되지 않았음을 사용자에게 보고했다. 다음은 본의 후면 투영/몸 가림과 봉 끝 위치를 먼저 검토해야 하며, 새 본 수정·재생성은 사용자 추가 지시 없이 진행하지 않는다.

## 최종 게시 검수 · 2026-11-19

- 최종 18클립/267프레임 모두 원본 SHA-256 및 타이밍 보존, catalog 포함 확인. ZIP 전체 2,343자산/18묶음 검증 통과.
- assets-v1의 motions-2 ZIP 갱신 완료, 나머지17개 묶음은 동일. 구 장비 9클립 이미지/중간본은 현재 릴리스에서 제외.
- npm test 92/92, verify:assets 통과(기존 다른 장수 미완성 placeholder35개 보고는 유지).
- 브라우저: codex-tabs, gate-lobby, missions-flow, rates-ui, toast-ui, ui-shell, treasure-flow/ui, recruit-results-flow/ui, approved-motion 통과. toast 검사만 기존 fit.js 축소 배율을 반영하도록 수정했으며 실제 알림 UI 배치는 변경하지 않았다.
- Git 미게시 코드/문서도 포함하여 누락/토큰 패턴/바이너리 직접 추가를 점검했다. 장비 임시 제작 스크립트74개는 저장소 밖 구본 보관소로 옮겼다. 최종 exporter/검수 화면과 재사용 도구·실수 방지 문서는 유지한다.
- 사용자 요청에 따라 원격 게시 확인 후 PC를 종료한다. 영구 삭제는 자동 검토에서 거부되어 구본 보관소가 로컬에 남아 있다.
