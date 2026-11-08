// 물건 서른 개의 임시 데이터다. 장소별 개수(옷장 7, 책상 8, 침대 6, 바닥 9)는 발표 자료를 따랐고,
// 종류 배분은 회의 전까지 쓰는 임시 배분이다. 실제 물건 목록과 메모 문구는 회의 뒤에 채운다.

// x와 y는 근접 컷(1280×720) 안에서 물건 사각형의 왼쪽 위 모서리이고, w와 h는 크기다.
// 그림이 들어오면 사람이 좌표만 고쳐 맞춘다. 물건끼리, 물건과 드롭 대상끼리 겹치지 않게 둔다.
// 선물(ex_gift)과 내 물건(own_goods)은 이름도 같은 꼴('[임시] 소품 A')로 붙여서, 메모를 읽어야만 구분되게 했다.
// 종류(kind): ex_gift 선물, photo 사진, own_goods 내 물건, trash 쓰레기, laundry 빨래, blanket 이불, stain 얼룩

const ITEMS = [
  // 옷장 7개: 선물 2, 내 물건 2, 빨래 3
  { id: 'closet_gift_1', zone: 'closet', kind: 'ex_gift', name: '[임시] 소품 A', memo: '[임시] 전 애인에게 받은 물건', x: 90, y: 170, w: 130, h: 64 },
  { id: 'closet_own_1', zone: 'closet', kind: 'own_goods', name: '[임시] 소품 B', memo: '[임시] 내가 직접 산 물건', x: 310, y: 200, w: 130, h: 64 },
  { id: 'closet_laundry_1', zone: 'closet', kind: 'laundry', name: '[임시] 빨래 1', memo: '[임시] 빨래 바구니에 넣을 옷', x: 530, y: 160, w: 140, h: 70 },
  { id: 'closet_gift_2', zone: 'closet', kind: 'ex_gift', name: '[임시] 소품 C', memo: '[임시] 전 애인에게 받은 물건', x: 760, y: 220, w: 130, h: 64 },
  { id: 'closet_laundry_2', zone: 'closet', kind: 'laundry', name: '[임시] 빨래 2', memo: '[임시] 빨래 바구니에 넣을 옷', x: 990, y: 180, w: 140, h: 70 },
  { id: 'closet_own_2', zone: 'closet', kind: 'own_goods', name: '[임시] 소품 D', memo: '[임시] 내가 직접 산 물건', x: 150, y: 380, w: 130, h: 64 },
  { id: 'closet_laundry_3', zone: 'closet', kind: 'laundry', name: '[임시] 빨래 3', memo: '[임시] 빨래 바구니에 넣을 옷', x: 430, y: 420, w: 140, h: 70 },

  // 책상 8개: 선물 1, 사진 1, 내 물건 2, 쓰레기 3, 얼룩 1
  { id: 'desk_own_1', zone: 'desk', kind: 'own_goods', name: '[임시] 소품 E', memo: '[임시] 내가 직접 산 물건', x: 110, y: 170, w: 130, h: 64 },
  { id: 'desk_photo_1', zone: 'desk', kind: 'photo', name: '[임시] 사진 1', memo: '[임시] 전 애인과 찍은 사진', x: 320, y: 150, w: 120, h: 90 },
  { id: 'desk_trash_1', zone: 'desk', kind: 'trash', name: '[임시] 쓰레기 1', memo: '[임시] 버려야 할 쓰레기', x: 530, y: 165, w: 120, h: 60 },
  { id: 'desk_gift_1', zone: 'desk', kind: 'ex_gift', name: '[임시] 소품 F', memo: '[임시] 전 애인에게 받은 물건', x: 740, y: 180, w: 130, h: 64 },
  { id: 'desk_trash_2', zone: 'desk', kind: 'trash', name: '[임시] 쓰레기 2', memo: '[임시] 버려야 할 쓰레기', x: 960, y: 170, w: 120, h: 60 },
  { id: 'desk_stain_1', zone: 'desk', kind: 'stain', name: '[임시] 얼룩 1', memo: '[임시] 문질러서 닦는 얼룩', x: 420, y: 320, w: 220, h: 130 },
  { id: 'desk_own_2', zone: 'desk', kind: 'own_goods', name: '[임시] 소품 G', memo: '[임시] 내가 직접 산 물건', x: 730, y: 330, w: 130, h: 64 },
  { id: 'desk_trash_3', zone: 'desk', kind: 'trash', name: '[임시] 쓰레기 3', memo: '[임시] 버려야 할 쓰레기', x: 290, y: 500, w: 120, h: 60 },

  // 침대 6개: 선물 1, 내 물건 1, 쓰레기 1, 빨래 2, 이불 1
  { id: 'bed_own_1', zone: 'bed', kind: 'own_goods', name: '[임시] 소품 H', memo: '[임시] 내가 직접 산 물건', x: 100, y: 200, w: 130, h: 64 },
  { id: 'bed_blanket_1', zone: 'bed', kind: 'blanket', name: '[임시] 이불', memo: '[임시] 좌우로 쓸어서 개는 이불', x: 330, y: 160, w: 460, h: 230 },
  { id: 'bed_gift_1', zone: 'bed', kind: 'ex_gift', name: '[임시] 소품 I', memo: '[임시] 전 애인에게 받은 물건', x: 870, y: 180, w: 130, h: 64 },
  { id: 'bed_laundry_1', zone: 'bed', kind: 'laundry', name: '[임시] 빨래 4', memo: '[임시] 빨래 바구니에 넣을 옷', x: 1060, y: 280, w: 140, h: 70 },
  { id: 'bed_trash_1', zone: 'bed', kind: 'trash', name: '[임시] 쓰레기 4', memo: '[임시] 버려야 할 쓰레기', x: 840, y: 320, w: 120, h: 60 },
  { id: 'bed_laundry_2', zone: 'bed', kind: 'laundry', name: '[임시] 빨래 5', memo: '[임시] 빨래 바구니에 넣을 옷', x: 420, y: 450, w: 140, h: 70 },

  // 바닥 9개: 선물 2, 사진 1, 내 물건 1, 쓰레기 3, 빨래 1, 얼룩 1
  { id: 'floor_gift_1', zone: 'floor', kind: 'ex_gift', name: '[임시] 소품 J', memo: '[임시] 전 애인에게 받은 물건', x: 90, y: 170, w: 130, h: 64 },
  { id: 'floor_trash_1', zone: 'floor', kind: 'trash', name: '[임시] 쓰레기 5', memo: '[임시] 버려야 할 쓰레기', x: 290, y: 160, w: 120, h: 60 },
  { id: 'floor_photo_1', zone: 'floor', kind: 'photo', name: '[임시] 사진 2', memo: '[임시] 전 애인과 찍은 사진', x: 480, y: 150, w: 120, h: 90 },
  { id: 'floor_own_1', zone: 'floor', kind: 'own_goods', name: '[임시] 소품 K', memo: '[임시] 내가 직접 산 물건', x: 680, y: 170, w: 130, h: 64 },
  { id: 'floor_trash_2', zone: 'floor', kind: 'trash', name: '[임시] 쓰레기 6', memo: '[임시] 버려야 할 쓰레기', x: 890, y: 160, w: 120, h: 60 },
  { id: 'floor_laundry_1', zone: 'floor', kind: 'laundry', name: '[임시] 빨래 6', memo: '[임시] 빨래 바구니에 넣을 옷', x: 1080, y: 220, w: 140, h: 70 },
  { id: 'floor_gift_2', zone: 'floor', kind: 'ex_gift', name: '[임시] 소품 L', memo: '[임시] 전 애인에게 받은 물건', x: 150, y: 300, w: 130, h: 64 },
  { id: 'floor_stain_1', zone: 'floor', kind: 'stain', name: '[임시] 얼룩 2', memo: '[임시] 문질러서 닦는 얼룩', x: 380, y: 290, w: 240, h: 130 },
  { id: 'floor_trash_3', zone: 'floor', kind: 'trash', name: '[임시] 쓰레기 7', memo: '[임시] 버려야 할 쓰레기', x: 760, y: 310, w: 120, h: 60 }
];
