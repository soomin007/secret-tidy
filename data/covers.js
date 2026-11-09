// 근접 컷에서 눌러야 열리는 덮개다. 옷더미나 서랍처럼 물건을 가리는 것을 상자 하나로 흉내 낸다.
// hides에 적은 물건은 덮개를 열기 전까지 보이지도 집히지도 않고, hides가 빈 덮개는 열어 봐도 아무것도 없다.
// 덮개는 가리는 물건을 다 덮고, 다른 물건이나 드롭 대상과는 겹치지 않게 둔다(tools/check.js가 검사한다).

const COVERS = [
  // 옷장
  { id: 'closet_pile', zone: 'closet', name: '옷더미', x: 745, y: 205, w: 160, h: 95, hides: ['closet_gift_2'] },
  { id: 'closet_drawer', zone: 'closet', name: '옷장 서랍', x: 415, y: 405, w: 170, h: 100, hides: ['closet_laundry_3'] },
  { id: 'closet_bag', zone: 'closet', name: '쇼핑백', x: 600, y: 310, w: 110, h: 90, hides: [] },

  // 책상
  { id: 'desk_drawer', zone: 'desk', name: '책상 서랍', x: 725, y: 165, w: 160, h: 95, hides: ['desk_gift_1'] },
  { id: 'desk_books', zone: 'desk', name: '책 더미', x: 275, y: 485, w: 150, h: 90, hides: ['desk_trash_3'] },
  { id: 'desk_notes', zone: 'desk', name: '공책 더미', x: 900, y: 290, w: 120, h: 80, hides: [] },

  // 침대
  { id: 'bed_pillow', zone: 'bed', name: '베개', x: 85, y: 185, w: 160, h: 95, hides: ['bed_own_1'] },
  { id: 'bed_cushion', zone: 'bed', name: '쿠션', x: 405, y: 435, w: 170, h: 100, hides: ['bed_laundry_2'] },
  { id: 'bed_throw', zone: 'bed', name: '담요', x: 90, y: 320, w: 150, h: 80, hides: [] },

  // 바닥
  { id: 'floor_box', zone: 'floor', name: '택배 상자', x: 135, y: 285, w: 160, h: 95, hides: ['floor_gift_2'] },
  { id: 'floor_bag', zone: 'floor', name: '가방', x: 665, y: 155, w: 160, h: 95, hides: ['floor_own_1'] },
  { id: 'floor_towel', zone: 'floor', name: '수건', x: 1030, y: 315, w: 130, h: 85, hides: [] }
];
