# 삼토체스 병종별 중립 본 · 검토안
- Blender 파일: INFANTRY / TACTICIAN / CAVALRY 컬렉션. 기마는 Horse·Rider 두 아마추어이며 모델이나 동작은 들어 있지 않다.
- JSON의 기준은 256×256, 발굽 또는 발 접지 pivot (128,224), x 정면 오른쪽 / y 캐릭터 정면 방향 / z 위다.
- Blender에서는 100px = 1 단위이고 캐릭터 정면은 -Y다. 화면 비교용으로 컬렉션 사이에 x 간격만 두었으며 뼈의 로컬 좌표에는 반영하지 않았다.
- 말과 기수는 중립 안착점을 공유하며 이후 모션 작업에서 해당 접점에 제약을 붙인다. 현재 제약·키프레임 없음.
- 원화에서 가려진 몸 관절은 추정. 옷/갑옷/리본/무기 없이 체형만 검토한다.
- `blender -b -t 1 -P export-neutral.py`로 재생성하고 `blender -b -t 1 samto-class-neutral.blend -P verify-neutral.py`로 다시 열어 검수한다.
