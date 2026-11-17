# 도감 탭 시안 — 사용자 검토 대기

- 사용자 요청: 장수·보물 도감은 실제 적용 전에 시안부터 확인.
- `game/previews/codex-v2/`에 공용 프레임을 재사용한 장수/보물 탭 시안 작성. 세력/등급 필터, 페이지, 선택 상세, 획득처 안내 제공.
- 실제 장수 49명과 현재 런타임 보물 12종 정의 사용. 신규 원화 32종은 runtimeApplied:false이며 게임 보물 ID와 임의 연결하지 않음. 보물 아이콘은 현 보물함의 공용 아이콘 사용.
- 보유/수집은 메모리 예시. 실제 도감과 사용자 저장 변경 없음. 보물 수집 보상 신설 없음.
- 941/390/320px 탭·필터 검수 및 스크린샷 확인. 보물 긴 이름이 카드 밖으로 나가지 않도록 아이콘 위/이름 아래 배치.
- 설정 옵션명은 기존 Georgia/Batang 계열을 유지하고 버튼과 같은 굵기 적용. 설정 흐름 검사는 첫 실행 navigation 경합 후 재실행 통과.
- 사용자 시안 승인 후 실제 도감 연결. 설정 글자 사용자 확인은 대기.

## 사용자 승인 및 실제 적용
- 사용자가 위 시안을 승인하고 붓글씨 도감 제목과 실제 구현 요청.
- codex-template/ui에 장수·보물 탭 적용. 보물 12종의 실제 보유 종류/개수, 등급, 1성 효과, 모집 경로 연결. 획득처 버튼은 상점으로 이동. 장수 세력 수집 보상은 기존 거래 유지.
- 내장 image_gen으로 투명 제목 `game/assets/ui-common/header-lettering/codex-tabs.png` 생성하고 공용 header-lettering에 등록. 참조 codex.png, 프롬프트: exact Korean text 도감, warm pale gold brush calligraphy, subtle brown outline, transparent background, no frame or extra text.
- codex-tabs-browser: 실제 보유 개수, 2탭/5필터/페이지, 3크기, 저장 불변, 상점 이동 통과. codex-flow-browser 기존 보상/재접속/중복방지 통과. 실제 사용자 클릭 검수 대기.
- pack/verify 완료: 1783자산/17묶음. publish는 GitHub CLI 실행 파일 부재(WinError 2)로 미완료. 원격 푸시하지 않음.
