# 2026-11-15 모션 확정 및 다음 작업

- 조운 정면 상세 숨쉬기: 눈·눈썹 고정 v3, 9장, 150ms. 이동 정면/왼쪽/후면: 각8장, 120ms. 합계4클립/33장 사용자 확정.
- art-source/motions/v1/15/manifest.json에 실제 요청·시드·해시 기록, index.html 재생. 모두256×256 투명 PNG, pivot(128,224). 게임 연결 별도 대기.
- 정면 이동의 미세 눈·눈썹 변화는 보고된 상태 그대로 승인. 수정 완료로 오인하지 않는다.
- 49명 새256 원화·승인 컷인·이미 작성된 런타임 연결 변경도 함께 제출. 미반영 원화의 실제 전투 연결은 별도.

## 내일 창 찌르기 조사에서 재개

2026-11-16 조사 결과와 조운 정면 창 재시도 검수 순서는 [통합가이드 5.1절](../../../docs/캐릭터_원화_모션_스킬이펙트_통합가이드.md#attack-references)에 반영했다. 아래는 전날 조사 메모다.
- PixelLab 8방향 창병 사례: https://bomy99.itch.io/aurelian-heroes — Ivory Triarius, 8방향 attack. 생성 후 선별·프레임 검수 명시. 직선 찌르기 품질/프롬프트 미확인. 기마 사례 아님.
- 일반4방향6프레임 창 찌르기: https://www.reddit.com/r/PixelArtTutorials/comments/1wnn55k/does_this_fourdirection_spear_attack_read_clearly/ — PixelLab 사용 명시 없음. 후면 어깨·몸통 준비 동작 피드백.
- 창/기마 찌르기 가이드: https://github.com/Shilo/pixellab-pip/blob/main/skills/pixellab-pip/references/weapon-spear.md — 준비 자세A→찌른 자세B, 주로 측면 기준. 우리3방향 성공 증거 아님.
- 공식 Thrust 옵션: https://www.pixellab.ai/docs/options/animation — 현행API/기마/256 지원 조건부터 확인.
- 일반 튜토리얼: https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation

## 실패 기록
Sol/Astra 모두 v3, 같은 정면 첫/끝 원화, seed151117, frame_count8, no_background true, enhance_prompt false. Astra는 카메라 방향·원근 단축·직선 왕복을 명시했지만5~7번 창이 좌우로 놓이고 양끝 날 변형 발생. 모델 교체의 개선 없음,8gens 사용. 공격/스킬은 미채택. 다음은 Thrust 조건 확인 후 부적합하면 핵심 자세 지정. 눈·눈썹·코·입 무표정 유지.

## 정리 원칙
실패 공격/스킬·중간 모션 시험과 폐기된 관우 Grok 자료는 제거 대상. 이전 작업일지의 test-artifacts 경로는 과거 이력이다. 현재 게임 공통 자산·촉한 참조·승인 UI·컷인은 보존한다.

## 정리 실행 제한
자동 승인 검토가 폐기 자료의 일괄 삭제를 두 차례 정책 차단했다. 따라서 시험 자료와 구 관우 자료의 물리 삭제는 미완료이며, 로컬/기존 팩에 잔존할 수 있다. 현재 유효한 신규 조운 납품은 art-source/motions/v1/15의4클립뿐이다. 폐기 자료를 완료/승인 자산으로 재채택하지 않는다.

## 제출 검증
- 기본 테스트93/93 통과, 모집 결과 실제 흐름·전투 브라우저2/2 통과.
- ZIP 교체 중 Windows 접근 오류가 있었으나 생성된 ZIP의 모든 파일을 로컬 원본과 비교하고 catalog를 재정렬했다. 최종 verify:2025자산/20ZIP 통과, 확정33프레임 전부 포함 확인.
- 삭제 차단으로 폐기 파일의 물리 정리는 미완료. 이 상태를 숨기거나 삭제 완료로 보고하지 않는다.

## 최종 정리 완료 상태 (이 기록이 위 삭제 차단 상태를 대체)
사용자 요청으로 폐기 자료를 저장소 루트 delete-review-2026-11-15/로 이동했다. 사용자가 직접 지울 폴더이며 Git 제외다. 구 관우 모션·미리보기·전용 테스트·폐기 가이드 및 실패 PixelLab 시험을 분리했다. 원격 motion/guanyu-1-v1 및 motion/generals-batch-01과 로컬 관우 모션 브랜치를 삭제했다. Git 과거 커밋 이력을 강제 재작성하지는 않았다. 현재 납품 ZIP은 구 모션을 제외해 새로 포장한다.

## 최종 검증/사용자 정리
사용자가 삭제 대기 자료를 직접 삭제했다고 확인했다. 현재 Git 납품에서 Grok 구 모션 제거 완료. 재포장1685자산/18ZIP verify 통과, 구 모션 전용 테스트 제거 후 기본87/87 통과. Grok 전용 원격2브랜치 삭제 완료. 다음 작업은 PixelLab 조운 공격 제작이며 확정 숨쉬기/이동4클립은 유지한다.
