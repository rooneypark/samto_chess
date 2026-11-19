# Claude 이펙트 적용 인계
- manifest.json의 mode가 direct인 4종은 fx/<id>/01.png부터 순서대로 재생한다. 시간은 초가 아닌 ms이며, 같은 크기의 투명 PNG를 anchor 기준으로 놓는다. 개별 프레임을 다시 중앙 정렬하지 않는다. jab은 시전자에서 목표로 향하는 로컬 +X 축을 회전시키고 거리는 전투 위치에 맞춘다.
- reference인 34종은 pixellab/<id>/reference.png와 prompt.txt를 사용한다. 128×128은 생성 입력 크기다. 실제 출력 프레임 수·지속 시간·공간 크기·기준점은 manifest 및 EFFECT-GUIDE.md에 맞춰 검수한다. 참고 그림의 중앙을 게임의 접지점으로 쓰면 안 된다.
- reference/의 기존 여섯 장면 비교판을 함께 보면서 발밑·가슴·머리 기준점과 시전/명중 시점을 확인한다. 캐릭터별 색과 배정은 가이드의 장수 표를 따른다. 생성 요청 전 견적을 확인한다. PixelLab API의 sprite_frames는 입력 스트립의 프레임 수다.
- 이번 묶음은 ImageGen 제작 시안이며 게임 연결과 사용자 최종 승인은 별도다. 실시간 게임 코드와 기존 원화는 변경하지 않았다.

Git에서 받은 뒤 저장소 루트에서 `python tools/asset_packs.py restore`를 실행하면 릴리스에 보관한 PNG와 미리보기가 복원된다. 기존 비교판은 `art-source/effects/v1/reference/`, 제작 가이드는 `bone-motion/EFFECT-GUIDE.md`에 있다.
