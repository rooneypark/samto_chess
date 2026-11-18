# 장비 최종 모션 · 2026-11-19 사용자 확정

대기·공격1/2/3·이동·스킬 × 정면/측면/후면, 18클립 267프레임. `final/`만 최종 이미지다. `manifest.json`은 런타임 호환 목록, `sim-sources.json`은 시뮬레이터 입력이다. 프레임 픽셀·타이밍을 변경하지 않고 최종 경로로 모았다. 정면 대기02~15, 측면/후면 이동01~14를 채택했다. 후면 공격1은 shaft-visible-v4이며 봉 후퇴가 약하다는 관찰 후 사용자가 최종 확정했다.

이미지는 Git 대신 assets-v1 릴리스 ZIP으로 배포한다. `python tools/asset_packs.py restore` 후 `simulator.cmd`로 확인한다. 구본/중간본은 삭제했으며 `source_history`는 이력 식별자이지 살아있는 경로가 아니다. 최종 요청 명세가 남아 있는 경우 `rigs-final/`에 보존했다. [작업 인계](../../../../docs/2026-11-19-zhangfei-motion-handoff.md).
