# 하단 selected 공용 틀

사용자가 지정한 상점 selected를 기준으로 한 178×144 틀이다. `selected-frame.png`는 최초 승인 상점과 동일한 원본(`gate-nav-home`을 고정 슬롯에 맞춘 틀 + 녹색 빈 질감)에서 생성한다. 병영이나 다른 화면의 selected 틀을 별도로 재사용하지 않는다.

`game/tools/build-navigation.cjs`가 `build-ui-shell.cjs` 안에서 실행된다. 다섯 메뉴는 같은 프레임과 알파를 쓰고 콘텐츠만 달라진다. 아이콘은 검은 외곽을 포함해 닫힌 경계를 추적하고 **원본 1:1 크기**로 공통 내부 공간에 배치한다. normal/selected 양쪽에 완전히 같은 콘텐츠를 합성하며 선택 시 축소나 이동을 하지 않는다. normal 틀은 selected 틀의 팔레트만 바꾸므로 영역과 alpha도 같다. 성문 입구는 배경이 아니라 어두운 내부로 보존한다. 글자 하이라이트를 보존하고 아이콘과 글자의 배치는 두 상태에서 완전히 동일하게 유지한다.

pressed는 각 완성 이미지의 RGB를 72%로 조정하고 alpha는 동일하게 유지한다. `verify-navigation.cjs`는 다섯 메뉴의 원본 1:1 콘텐츠, normal/selected의 전체 실루엣과 콘텐츠 픽셀, 안/바깥 프레임 및 pressed를 검사한다. 밝은색·어두운색·대조색 검수 이미지는 `test-artifacts/navigation/`에 저장한다.

실제 적용 화면: 성문·병영·상점. 동맹·군웅대전의 selected 자산도 같은 기준으로 준비했으며 해당 화면은 기존 UI를 유지한다.
