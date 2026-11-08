// 장소 네 곳의 정보다. roomRect는 방 전체 화면에서 누르는 영역이고, targets는 그 장소 근접 컷의 드롭 대상이다.
// 좌표는 모두 1280×720 논리 좌표이고, x와 y는 사각형의 왼쪽 위 모서리다.

// 방 전체 배치는 발표 이미지의 구도를 대략 따라 왼쪽 책상, 가운데 침대, 오른쪽 옷장, 아래쪽 바닥으로 두었다.
// 드롭 대상 종류는 hide(숨김), trash(휴지통), laundry(빨래) 셋이고, 장소마다 그 장소 물건에 필요한 것만 둔다.
// 같은 종류의 대상은 어느 장소에서나 같은 자리에 두어 손이 기억하게 했다.

const ZONES = [
  {
    id: 'closet',
    name: '옷장',
    roomRect: { x: 890, y: 120, w: 330, h: 380 },
    targets: [
      { type: 'hide', label: '[임시] 숨김 상자', x: 990, y: 420, w: 240, h: 170 },
      { type: 'laundry', label: '빨래 바구니', x: 740, y: 450, w: 210, h: 140 }
    ]
  },
  {
    id: 'desk',
    name: '책상',
    roomRect: { x: 60, y: 120, w: 330, h: 380 },
    targets: [
      { type: 'hide', label: '[임시] 숨김 상자', x: 990, y: 420, w: 240, h: 170 },
      { type: 'trash', label: '휴지통', x: 50, y: 440, w: 190, h: 140 }
    ]
  },
  {
    id: 'bed',
    name: '침대',
    roomRect: { x: 440, y: 160, w: 400, h: 300 },
    targets: [
      { type: 'hide', label: '[임시] 숨김 상자', x: 990, y: 420, w: 240, h: 170 },
      { type: 'trash', label: '휴지통', x: 50, y: 440, w: 190, h: 140 },
      { type: 'laundry', label: '빨래 바구니', x: 740, y: 450, w: 210, h: 140 }
    ]
  },
  {
    id: 'floor',
    name: '바닥',
    roomRect: { x: 60, y: 540, w: 860, h: 150 },
    targets: [
      { type: 'hide', label: '[임시] 숨김 상자', x: 990, y: 420, w: 240, h: 170 },
      { type: 'trash', label: '휴지통', x: 50, y: 440, w: 190, h: 140 },
      { type: 'laundry', label: '빨래 바구니', x: 740, y: 450, w: 210, h: 140 }
    ]
  }
];
