// 점수와 엔딩을 계산하는 순수 함수 모음이다. p5 함수를 쓰지 않고, 물건 상태 목록과 설정값만 받아 결과를 돌려준다.
// 합계 = 숨김 점수 + 청소 점수 + 시간 보너스 - 잘못 놓기 감점이고,
// 엔딩은 질문, 실망, 성공 순서로 먼저 맞는 하나만 고른다.

const Scoring = {
  // 청소 대상 종류. 이 종류의 물건 수가 전체 청소 건수다(데이터에서 센다).
  CLEAN_KINDS: ['trash', 'laundry', 'blanket', 'stain'],

  // 숨겨야 하는 종류인지. 사진은 PHOTO_MUST_HIDE가 true일 때만 숨겨야 한다.
  mustHide(kind, cfg) {
    return kind === 'ex_gift' || (kind === 'photo' && cfg.PHOTO_MUST_HIDE);
  },

  isCleanKind(kind) {
    return this.CLEAN_KINDS.includes(kind);
  },

  // 처리했는지. 드롭 대상에 넣었거나 이불과 얼룩 제스처를 끝냈으면 처리한 것이다.
  isHandled(item) {
    return item.status !== 'present';
  },

  // 아직 할 일이 남은 물건인지. 내 물건은 그대로 두는 것이 정답이라 세지 않는다.
  isPending(item, cfg) {
    if (this.isHandled(item)) return false;
    return this.mustHide(item.kind, cfg) || this.isCleanKind(item.kind);
  },

  // 구역별로 할 일이 남은 물건 수. 방 전체 화면(SHOW_ZONE_COUNTS)과 디버그 표시에서 쓴다.
  remainingByZone(items, zoneIds, cfg) {
    const counts = {};
    for (const id of zoneIds) counts[id] = 0;
    for (const item of items) {
      if (this.isPending(item, cfg)) counts[item.zone] = (counts[item.zone] || 0) + 1;
    }
    return counts;
  },

  // 결과를 계산한다.
  // items: [{ id, zone, kind, name, status }] (ITEMS 순서), remainingSec: 남은 초(정수), wrongDrops: 잘못 놓은 횟수
  compute(items, remainingSec, wrongDrops, cfg) {
    const mustHideItems = items.filter(i => this.mustHide(i.kind, cfg));
    const hiddenCorrect = mustHideItems.filter(i => i.status === 'stored');
    const unhidden = mustHideItems.filter(i => i.status !== 'stored');
    const wrongHidden = items.filter(i => i.kind === 'own_goods' && i.status === 'stored');
    const cleanItems = items.filter(i => this.isCleanKind(i.kind));
    const cleaned = cleanItems.filter(i => this.isHandled(i));
    const notCleaned = cleanItems.filter(i => !this.isHandled(i));

    const hideScore = hiddenCorrect.length * cfg.HIDE_CORRECT - wrongHidden.length * cfg.HIDE_WRONG_PENALTY;
    const cleanScore = cleaned.length * cfg.CLEAN_EACH;
    // 소수점 아래는 버린다. 0.2처럼 이진수로 딱 떨어지지 않는 배율의 계산 오차로 1점이 깎이지 않게 아주 작은 값을 더한다.
    const timeBonus = Math.floor(remainingSec * cfg.TIME_BONUS_PER_SEC + 1e-9);
    const penalty = wrongDrops * cfg.WRONG_DROP_PENALTY;
    const total = hideScore + cleanScore + timeBonus - penalty;
    // 청소 대상이 하나도 없으면 다 치운 것으로 본다.
    const cleanRate = cleanItems.length > 0 ? cleaned.length / cleanItems.length : 1;

    let ending = 'success';
    if (unhidden.length > 0) ending = 'question';
    else if (cleanRate < cfg.CLEAN_THRESHOLD) ending = 'disappointed';

    return {
      ending,
      // 질문 엔딩에서 애인이 집어 드는 물건. 숨기지 못한 것 가운데 데이터 순서상 첫 번째다.
      questionItem: unhidden.length > 0 ? unhidden[0] : null,
      hideScore,
      cleanScore,
      timeBonus,
      penalty,
      total,
      remainingSec,
      wrongDrops,
      hiddenCount: hiddenCorrect.length,
      wrongHiddenCount: wrongHidden.length,
      cleanedCount: cleaned.length,
      cleanTotal: cleanItems.length,
      cleanRate,
      unhidden,
      wrongHidden,
      notCleaned,
      // 계산에 쓴 배율. 결과 화면의 설명 줄이 이 값을 보여 준다.
      rates: {
        photoMustHide: cfg.PHOTO_MUST_HIDE,
        hideCorrect: cfg.HIDE_CORRECT,
        hideWrongPenalty: cfg.HIDE_WRONG_PENALTY,
        cleanEach: cfg.CLEAN_EACH,
        timeBonusPerSec: cfg.TIME_BONUS_PER_SEC,
        wrongDropPenalty: cfg.WRONG_DROP_PENALTY
      }
    };
  }
};
