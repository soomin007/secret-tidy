// 게임의 수치와 규칙 스위치를 모두 이 파일 한곳에 둔다.
// 회의에서 규칙이 정해지면 코드는 그대로 두고 이 값만 바꾼다.
// 기획서 표에 없던 값은 맨 아래에 따로 모았고, 고른 이유는 README의 '가정' 목록에 있다.

const CONFIG = {
  // 시간
  TIME_LIMIT_SEC: 300,             // 제한 시간(초)
  WARNING_SEC: 30,                 // 타이머가 빨개지는 시점(초)
  FLASHBACK_SEC: 10,               // 회상 길이(초)
  // true면 사진마다 회상은 한 번이다.
  // false면 사진을 숨기지 않고 제자리에 내려놓을 때마다, 다음에 누를 때 회상이 다시 재생된다.
  FLASHBACK_ONCE_PER_PHOTO: true,

  // 판정과 점수
  PHOTO_MUST_HIDE: true,           // 사진도 숨겨야 하는지. false면 사진은 회상만 일으키는 함정이 된다
  HIDE_CORRECT: 10,                // 선물이나 사진 하나를 숨길 때 점수
  HIDE_WRONG_PENALTY: 5,           // 내 물건 하나를 숨길 때 감점
  CLEAN_EACH: 5,                   // 청소 1건 점수
  TIME_BONUS_PER_SEC: 0.2,         // 남은 1초당 점수
  WRONG_DROP_PENALTY: 0,           // 엉뚱한 통에 놓을 때 감점
  CLEAN_THRESHOLD: 0.6,            // 청소율이 이보다 낮으면 실망 엔딩

  // 제스처
  FOLD_STROKES: 3,                 // 이불을 다 개는 쓸기 횟수
  FOLD_MIN_RATIO: 0.5,             // 쓸기로 인정하는 최소 가로 이동(이불 폭 대비)
  WIPE_DISTANCE: 1200,             // 얼룩을 다 닦는 누적 이동 거리(논리 좌표 px)

  // 기능 스위치
  ALLOW_EARLY_FINISH: true,        // "문 열어 주기" 조기 종료 허용
  SHOW_ZONE_COUNTS: false,         // 방 전체에 구역별 남은 개수 표시
  DEBUG_KEYS: true,                // 디버그 키 사용

  // 아래는 기획서 표에 없어서 새로 둔 값이다.
  // 드롭 대상마다 받아 주는 물건 종류. 목록에 없는 종류를 놓으면 제자리로 돌아간다.
  TARGET_ACCEPTS: {
    hide: ['ex_gift', 'photo', 'own_goods'],
    trash: ['trash'],
    laundry: ['laundry']
  },
  BLANKET_FOLDED_HEIGHT: 0.3,      // 다 갠 이불의 높이(처음 높이 대비 비율)
  STAIN_START_ALPHA: 200,          // 닦기 전 얼룩의 불투명도(0~255)
  TOAST_SEC: 1.6,                  // 놓기가 거절됐을 때 안내 문구가 떠 있는 시간(초)
  DEBUG_TIME_STEP_SEC: 30          // 디버그 키 [ 와 ] 가 빼고 더하는 시간(초)
};
