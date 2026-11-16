// 물건 서른 개의 임시 데이터다. 장소별 개수(옷장 7, 책상 8, 침대 6, 바닥 9)는 발표 자료를 따랐고,
// 종류 배분은 회의 전까지 쓰는 임시 배분이다. 실제 물건 목록과 메모 문구는 회의 뒤에 채운다.

// x와 y는 근접 컷(1280×720) 안에서 물건 사각형의 왼쪽 위 모서리이고, w와 h는 크기다.
// 물건은 가구 면(책상 윗면, 옷장 선반, 침대, 바닥) 위에 놓이게 두었다. 물건끼리, 물건과 드롭 대상끼리 겹치지 않게 둔다.
// look은 src/art.js가 그리는 임시 모양이다. 선물과 내 물건은 같은 모양 묶음(box, book, pouch, mug, bottle)에서 섞어 골라,
// 모양으로는 구분되지 않고 메모를 읽어야만 구분되게 했다. 이름도 같은 꼴('[임시] 소품 A')로 붙였다.
// 종류(kind): ex_gift 선물, photo 사진, own_goods 내 물건, trash 쓰레기, laundry 빨래, blanket 이불, stain 얼룩

const ITEMS = [
  // 옷장 7개: 선물 2, 내 물건 2, 빨래 3. 위 칸 선반에 다섯, 아래 칸에 하나, 서랍 속에 하나
  { id: 'closet_gift_1', zone: 'closet', kind: 'ex_gift', look: 'box', name: '[임시] 소품 A', memo: '[임시] 전 애인에게 받은 물건', x: 80, y: 236, w: 130, h: 64 },
  { id: 'closet_own_1', zone: 'closet', kind: 'own_goods', look: 'box', name: '[임시] 소품 B', memo: '[임시] 내가 직접 산 물건', x: 226, y: 236, w: 130, h: 64 },
  { id: 'closet_laundry_1', zone: 'closet', kind: 'laundry', look: 'folded', name: '[임시] 빨래 1', memo: '[임시] 빨래 바구니에 넣을 옷', x: 440, y: 230, w: 140, h: 70 },
  { id: 'closet_gift_2', zone: 'closet', kind: 'ex_gift', look: 'pouch', name: '[임시] 소품 C', memo: '[임시] 전 애인에게 받은 물건', x: 705, y: 222, w: 130, h: 64 },
  { id: 'closet_laundry_2', zone: 'closet', kind: 'laundry', look: 'pants', name: '[임시] 빨래 2', memo: '[임시] 빨래 바구니에 넣을 옷', x: 1010, y: 230, w: 140, h: 70 },
  { id: 'closet_own_2', zone: 'closet', kind: 'own_goods', look: 'pouch', name: '[임시] 소품 D', memo: '[임시] 내가 직접 산 물건', x: 96, y: 456, w: 130, h: 64 },
  { id: 'closet_laundry_3', zone: 'closet', kind: 'laundry', look: 'socks', name: '[임시] 빨래 3', memo: '[임시] 빨래 바구니에 넣을 옷', x: 315, y: 537, w: 140, h: 70 },

  // 책상 8개: 선물 1, 사진 1, 내 물건 2, 쓰레기 3, 얼룩 1
  { id: 'desk_own_1', zone: 'desk', kind: 'own_goods', look: 'mug', name: '[임시] 소품 E', memo: '[임시] 내가 직접 산 물건', x: 150, y: 196, w: 130, h: 64 },
  { id: 'desk_photo_1', zone: 'desk', kind: 'photo', name: '[임시] 사진 1', memo: '[임시] 전 애인과 찍은 사진', x: 300, y: 146, w: 120, h: 90 },
  { id: 'desk_trash_1', zone: 'desk', kind: 'trash', look: 'paper', name: '[임시] 쓰레기 1', memo: '[임시] 버려야 할 쓰레기', x: 540, y: 214, w: 120, h: 60 },
  { id: 'desk_gift_1', zone: 'desk', kind: 'ex_gift', look: 'book', name: '[임시] 소품 F', memo: '[임시] 전 애인에게 받은 물건', x: 775, y: 165, w: 130, h: 64 },
  { id: 'desk_trash_2', zone: 'desk', kind: 'trash', look: 'wrapper', name: '[임시] 쓰레기 2', memo: '[임시] 버려야 할 쓰레기', x: 940, y: 300, w: 120, h: 60 },
  { id: 'desk_stain_1', zone: 'desk', kind: 'stain', name: '[임시] 얼룩 1', memo: '[임시] 문질러서 닦는 얼룩', x: 330, y: 300, w: 220, h: 130 },
  { id: 'desk_own_2', zone: 'desk', kind: 'own_goods', look: 'book', name: '[임시] 소품 G', memo: '[임시] 내가 직접 산 물건', x: 660, y: 352, w: 130, h: 64 },
  { id: 'desk_trash_3', zone: 'desk', kind: 'trash', look: 'paper', name: '[임시] 쓰레기 3', memo: '[임시] 버려야 할 쓰레기', x: 111, y: 315, w: 120, h: 60 },

  // 침대 6개: 선물 1, 내 물건 1, 쓰레기 1, 빨래 2, 이불 1. 머리맡은 왼쪽이다.
  { id: 'bed_own_1', zone: 'bed', kind: 'own_goods', look: 'pouch', name: '[임시] 소품 H', memo: '[임시] 내가 직접 산 물건', x: 100, y: 200, w: 130, h: 64 },
  { id: 'bed_blanket_1', zone: 'bed', kind: 'blanket', name: '[임시] 이불', memo: '[임시] 좌우로 쓸어서 개는 이불', x: 330, y: 160, w: 460, h: 230 },
  { id: 'bed_gift_1', zone: 'bed', kind: 'ex_gift', look: 'book', name: '[임시] 소품 I', memo: '[임시] 전 애인에게 받은 물건', x: 870, y: 180, w: 130, h: 64 },
  { id: 'bed_laundry_1', zone: 'bed', kind: 'laundry', look: 'shirt', name: '[임시] 빨래 4', memo: '[임시] 빨래 바구니에 넣을 옷', x: 1060, y: 280, w: 140, h: 70 },
  { id: 'bed_trash_1', zone: 'bed', kind: 'trash', look: 'wrapper', name: '[임시] 쓰레기 4', memo: '[임시] 버려야 할 쓰레기', x: 840, y: 320, w: 120, h: 60 },
  { id: 'bed_laundry_2', zone: 'bed', kind: 'laundry', look: 'socks', name: '[임시] 빨래 5', memo: '[임시] 빨래 바구니에 넣을 옷', x: 420, y: 419, w: 140, h: 70 },

  // 바닥 9개: 선물 2, 사진 1, 내 물건 1, 쓰레기 3, 빨래 1, 얼룩 1
  { id: 'floor_gift_1', zone: 'floor', kind: 'ex_gift', look: 'mug', name: '[임시] 소품 J', memo: '[임시] 전 애인에게 받은 물건', x: 70, y: 168, w: 130, h: 64 },
  { id: 'floor_trash_1', zone: 'floor', kind: 'trash', look: 'can', name: '[임시] 쓰레기 5', memo: '[임시] 버려야 할 쓰레기', x: 300, y: 200, w: 120, h: 60 },
  { id: 'floor_photo_1', zone: 'floor', kind: 'photo', name: '[임시] 사진 2', memo: '[임시] 전 애인과 찍은 사진', x: 460, y: 140, w: 120, h: 90 },
  { id: 'floor_own_1', zone: 'floor', kind: 'own_goods', look: 'bottle', name: '[임시] 소품 K', memo: '[임시] 내가 직접 산 물건', x: 665, y: 165, w: 130, h: 64 },
  { id: 'floor_trash_2', zone: 'floor', kind: 'trash', look: 'paper', name: '[임시] 쓰레기 6', memo: '[임시] 버려야 할 쓰레기', x: 880, y: 196, w: 120, h: 60 },
  { id: 'floor_laundry_1', zone: 'floor', kind: 'laundry', look: 'pants', name: '[임시] 빨래 6', memo: '[임시] 빨래 바구니에 넣을 옷', x: 1090, y: 236, w: 140, h: 70 },
  { id: 'floor_gift_2', zone: 'floor', kind: 'ex_gift', look: 'bottle', name: '[임시] 소품 L', memo: '[임시] 전 애인에게 받은 물건', x: 135, y: 315, w: 130, h: 64 },
  { id: 'floor_stain_1', zone: 'floor', kind: 'stain', name: '[임시] 얼룩 2', memo: '[임시] 문질러서 닦는 얼룩', x: 400, y: 300, w: 240, h: 130 },
  { id: 'floor_trash_3', zone: 'floor', kind: 'trash', look: 'wrapper', name: '[임시] 쓰레기 7', memo: '[임시] 버려야 할 쓰레기', x: 740, y: 330, w: 120, h: 60 }
];
