# 삼토체스 장수 컷인 원화 49종

2026-11-15. 승인된 관우 컷인 그림체를 기준으로 현재 장수 정의 49명에게 각 한 장씩 생성했다. **개별 이미지 검토 대기, 실제 전투 미연결**이다. 원화 제작은 내장 `image_gen` 도구를 사용했다.

- `manifest.json`: 장수 ID·이름·세력·정면 레퍼런스·최종 파일·생성 프롬프트·수정 기록. 이 파일의 `file`만 최종 선택본으로 취급한다.
- 각 ID 폴더의 PNG: 투명 원본. `prompt.txt`는 생성 및 후속 수정 지시를 보관한다. 버전 없는 이름을 일괄 로드하면 유비·조조 등의 폐기된 자세가 사용될 수 있으므로 금지한다.
- 유비 `0/critical-v3.png`: 두 손 각각 손잡이만 잡는 쌍검. 조조 `32/critical-v2.png`: 한 손은 검 손잡이, 다른 손은 분리. 여포 `119/critical-v2.png`: 말 머리 제거.
- `validation.json`: 49명 누락 여부, 크기, alpha 외곽, 원본 SHA-256. 이미지 가장자리 alpha>16인 픽셀은 0개다.
- 검토 화면 `game/previews/critical-cutins-v1/`: 세력 필터, 밝은색/어두운색/대조색/격자 배경, 확대, 900ms 컷인 재생. 제공 WEBP는 원본 캔버스를 그대로 보존한 무손실 변환이며 보이는 RGB와 alpha의 완전 일치를 검사한다.

## 재사용 규칙

글자·이름·전법명·UI 프레임을 이미지 위에 붙이지 않는다. 인물과 무기 동작만으로 시전을 읽을 수 있게 한다. 그림은 한 장이며 공격 동작 프레임/이동 모션이 아니다. 무기를 쥔 손은 손잡이 또는 자루에만 위치하고, 칼날에 닿지 않아야 한다. 투명 픽셀의 숨은 RGB에 빛 정보가 있어도 alpha가 0이면 화면에 표시되지 않는다. 검수는 RGB 미리보기만 보지 말고 반드시 실제 배경에 alpha 합성해서 한다.

원본 비율과 전체 외곽을 유지하고 `contain`으로 배치한다. 전신 체격 보정과 컷인의 화면 점유율은 서로 다른 기준이다. 현재 컷인 미리보기는 동작 확인용이며 실제 전투 연결은 사용자 검토 뒤 별도 작업이다.

## 생성 및 검수

```text
node game/previews/critical-cutins-v1/build.mjs
node game/previews/critical-cutins-v1/review.cjs
node game/previews/motion-v1/review.cjs
python tools/asset_packs.py pack
python tools/asset_packs.py verify
```

PNG 파일은 기존 저장소 정책대로 `asset-packs/v1/critical-cutins-*`의 무손실 압축 묶음에 보관한다. `tools/asset_packs.py restore`로 복원한 뒤 사용한다. 생성 프롬프트 전체는 manifest와 각 폴더의 텍스트에 포함된다.
