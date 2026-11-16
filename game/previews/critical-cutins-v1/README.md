# 장수 컷인 검토 화면

실행: http://127.0.0.1:8780/game/previews/critical-cutins-v1/

49장수의 투명 원화를 세력별로 보고, 선택한 이미지를 확대하거나 900ms 컷인으로 재생한다. 이름은 검토 화면의 별도 제목이며 원화에 포함되지 않는다. 밝은색·어두운색·대조색·투명 격자를 바꿔 누끼를 확인할 수 있다. 공용 `nineSlice` 및 `initArtPress`를 재생/닫기 버튼에 재사용한다. 작은 검토용 버튼은 18px 모서리를 사용한다.

`build.mjs`는 PNG 원본을 무손실 WEBP로 변환하고 명단·검수표·3배경 비교판을 생성한다. `review.cjs`는 49개 원본과 표시 자산의 visible RGB/alpha 일치, 이미지 로드, 세력 필터, 1280/390/320px 배치, pressed, 확대/닫기/재생, 동작 줄이기, 저장소 미접근을 검사한다. 비교판은 `test-artifacts/cutins-{dark,light,contrast}.png`에 저장한다.

원본·선택 버전·프롬프트는 `art-source/critical-cutins/v1/manifest.json`을 따른다. 게임의 실제 전투 이벤트나 지급 처리는 변경하지 않는다.
