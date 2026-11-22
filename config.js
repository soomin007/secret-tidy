// 게임의 수치와 규칙 스위치를 모두 이 파일 한곳에 둔다.
// 기획서에 없거나 기획서끼리 맞지 않는 규칙도 여기 값으로 바꿔 볼 수 있다. 기본값과 그 근거는 README의 설정값 표에 있다.

const CONFIG = {
  // 시간
  TIME_LIMIT_SEC: 300,              // 제한 시간(초)
  WARNING_SEC: 30,                  // 타이머가 빨개지는 남은 시간(초)
  FLASHBACK_SEC: 10,                // 회상 길이(초)
  PHOTO_REVIEW_COSTS_TIME: false,   // 본 사진을 다시 볼 때도 회상 시간이 드는지

  // 조사와 숨기기
  CAT_MAX_PLACEMENTS: 1,            // 고양이 배치 횟수. 0이면 제한 없음
  ALLOW_UNHIDE: false,              // 숨긴 물건을 다시 꺼낼 수 있는지
  SHOW_HIDDEN_COUNT: true,          // HUD에 숨긴 물건 개수를 표시할지

  // 청소 제스처
  BLANKET_STROKES: 3,               // 이불을 다 개는 쓸기 횟수
  BLANKET_MIN_RATIO: 0.5,           // 쓸기로 인정하는 최소 가로 이동(이불 폭 대비)
  STAIN_WIPE_DISTANCE: 1200,        // 얼룩 하나를 다 닦는 누적 이동 거리(논리 좌표 px)

  // 점수
  SCORE_BLANKET: 25,                // 이불을 다 갰을 때
  SCORE_STAINS: 25,                 // 얼룩을 모두 닦았을 때
  SCORE_TRASH_EACH: 5,              // 쓰레기 1개
  SCORE_LAUNDRY_EACH: 5,            // 빨래 1벌
  UNPROCESSED_PENALTY: 0,           // 처리하지 못한 쓰레기, 빨래 1개당 추가 감점. 기획서의 '미처리 1개당 -5점'이 추가 감점이라면 5
  MINE_HIDE_PENALTY: 10,            // 숨긴 내 물건 1개당 감점
  CURRENT_HIDE_PENALTY: 15,         // 숨긴 현 남친 물건 1개당 감점
  TIME_BONUS_PER_10SEC: 1,          // 남은 10초당 보너스
  TIME_BONUS_MAX: 10,               // 보너스 최대
  BONUS_REQUIRES_ALL_CLEAN: true,   // 청소를 모두 끝내야 보너스를 주는지
  SCORE_CAP: 100,                   // 최종 점수 상한. null이면 상한 없음

  // 엔딩
  BAD2_SCORE_BELOW: 50,             // 이 점수 미만이면 bad2
  TRUE_MIN_SCORE: 90,               // true 최소 점수
  TRUE_MINE_HIDE_ALLOWED: 0,        // true에서 허용하는 내 물건 숨김 수. 기획서 5장 감점표대로면 1
  TRUE_REQUIRES_EARLY_FINISH: false,// true에 일찍 끝냄이 필요한지
  SPECIAL_MIN_SCORE: 60,            // special 최소 점수
  SPECIAL_BEFORE_TRUE: false,       // special을 true보다 먼저 판정할지

  // 시험용
  DEBUG_KEYS: true,                 // 디버그 키 사용
  SHOW_TEST_STATS: true             // 결과 화면에 테스트용 기록 표시
};
