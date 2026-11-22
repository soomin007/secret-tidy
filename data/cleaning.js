// 청소 물건이다. 기획서에 구역별 배치가 없어서 임시로 정했다. 이름은 회의 뒤에 채운다.
// 쓰레기 5개(옷장 1, 책상 2, 침대 1, 바닥 1), 빨래 5벌(옷장 3, 바닥 2), 이불 1장(침대), 얼룩 2개(책상 1, 바닥 1)
// kind: trash 쓰레기(휴지통에 넣음), laundry 빨래(빨래 바구니에 넣음), blanket 이불(좌우로 쓸어 갬), stain 얼룩(문질러 닦음)

const CLEANING = [
  { id: 'c01', kind: 'trash', zone: 'closet', name: '[임시] 쓰레기 1' },
  { id: 'c02', kind: 'trash', zone: 'desk', name: '[임시] 쓰레기 2' },
  { id: 'c03', kind: 'trash', zone: 'desk', name: '[임시] 쓰레기 3' },
  { id: 'c04', kind: 'trash', zone: 'bed', name: '[임시] 쓰레기 4' },
  { id: 'c05', kind: 'trash', zone: 'floor', name: '[임시] 쓰레기 5' },
  { id: 'c06', kind: 'laundry', zone: 'closet', name: '[임시] 빨래 1' },
  { id: 'c07', kind: 'laundry', zone: 'closet', name: '[임시] 빨래 2' },
  { id: 'c08', kind: 'laundry', zone: 'closet', name: '[임시] 빨래 3' },
  { id: 'c09', kind: 'laundry', zone: 'floor', name: '[임시] 빨래 4' },
  { id: 'c10', kind: 'laundry', zone: 'floor', name: '[임시] 빨래 5' },
  { id: 'c11', kind: 'blanket', zone: 'bed', name: '[임시] 이불' },
  { id: 'c12', kind: 'stain', zone: 'desk', name: '[임시] 얼룩 1' },
  { id: 'c13', kind: 'stain', zone: 'floor', name: '[임시] 얼룩 2' }
];

// 놓는 곳이다. 숨김 장소는 구역마다 하나, 휴지통은 쓰레기가 있는 구역마다, 빨래 바구니는 빨래가 있는 구역마다 하나씩 둔다.
// type: hide 숨김 장소(판정 물건을 받음), trash 휴지통(쓰레기를 받음), laundry 빨래 바구니(빨래를 받음)
const DROP_SPOTS = [
  { id: 'closet_hide', type: 'hide', zone: 'closet', name: '옷장 안쪽 상자' },
  { id: 'closet_trash', type: 'trash', zone: 'closet', name: '휴지통' },
  { id: 'closet_laundry', type: 'laundry', zone: 'closet', name: '빨래 바구니' },
  { id: 'desk_hide', type: 'hide', zone: 'desk', name: '책상 서랍' },
  { id: 'desk_trash', type: 'trash', zone: 'desk', name: '휴지통' },
  { id: 'bed_hide', type: 'hide', zone: 'bed', name: '침대 밑' },
  { id: 'bed_trash', type: 'trash', zone: 'bed', name: '휴지통' },
  { id: 'floor_hide', type: 'hide', zone: 'floor', name: '바닥 수납함' },
  { id: 'floor_trash', type: 'trash', zone: 'floor', name: '휴지통' },
  { id: 'floor_laundry', type: 'laundry', zone: 'floor', name: '빨래 바구니' }
];
