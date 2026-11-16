# 캐릭터 모션 체커

저장소 루트의 `checker.cmd`을 더블클릭한다. Python 3.10 이상이 필요하며 별도 패키지 설치나 PowerShell 실행 정책 변경은 필요 없다. macOS/Linux에서는 저장소 루트에서 `python3 tools/character-checker/build.py --open`을 실행한다.

최신 자산 ZIP에서 49명 3방향 원화 147장과 조운의 승인 모션 전체(2026-11-16 기준 10클립 123장: 정면 숨쉬기, 3방향 이동·공격·전법)를 읽어 ZIP·PNG·manifest SHA-256 및 256×256 RGBA 규격을 검증한다. 클립 목록은 `art-source/motions/v1/15/manifest.json`에서 읽으므로 클립을 추가해도 도구를 고칠 필요가 없다. 측면 공격·전법은 기준점의 가로 위치가 달라 기준선 표시가 클립별 기준점을 따른다. 검색, 세력/모션 필터, 방향 비교, 재생/정지, 이전/다음 프레임, 프레임 슬라이더, 배속, 밝은/어두운 배경을 지원한다. 1:1 표시를 기본으로 하고 2배 확대도 모든 원화에 동일하게 적용한다. 공통 기준점은 (128,224)다. 다른 장수는 정지 원화만 표시한다.

결과는 `test-artifacts/character-checker/samto-character-motion-checker.html`이다. 이미지를 내장한 단일 HTML이므로 복사한 뒤 인터넷·서버·Python 없이 브라우저로 열 수 있다. 같은 위치의 `.verification.json`에는 파일별 해시와 수량이 기록된다. 결과 파일은 Git 제외이며 원본 PNG를 중복 커밋하지 않는다. 실패 시 콘솔에 원인을 남기고 배치 창이 닫히지 않으며, 브라우저의 이미지/재생 오류는 화면에 표시한다.

원화 전체의 사용자 최종 검수와 실제 게임 연결은 별도다. 조운 정면 이동의 승인 당시 미세한 눈·눈썹 변화도 원본 그대로 보인다. 이 도구는 게임·저장·기존 갤러리·런처·원본 자산을 수정하지 않는다. 8×8 전투 배치 검수 화면은 아니다.

## 요화 검토 모션 (2026-11-16)

로컬 `test-artifacts/liaohua-skill-move-review-v1/review.json`이 있으면 이동·스킬 검토본 6종과 확정 공격 3종을 함께 읽는다. 없으면 `art-source/motions/v1/liaohua/manifest.json`의 확정 공격만 표시한다. 조운 10종은 기존 ZIP 검증 경로를 유지한다. 각 장수 선택에 따라 클립 목록이 바뀌고 확정/검토 대기를 명시한다. 로컬 검토 파일도 PNG 규격과 manifest 해시를 검증하며 최종 자산으로 간주하지 않는다.

동시 비교와 스킬 6자세 화면은 `test-artifacts/liaohua-skill-move-review-v1/index.html`이다. 저장소 루트 HTTP 서버에서 열며 게임이나 저장 데이터에는 연결하지 않는다.
