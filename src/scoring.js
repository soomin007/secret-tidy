// 점수와 엔딩 판정(기획서 5장과 9장)을 계산하는 순수 함수 모음이다.
// p5 함수를 쓰지 않고 평범한 값만 주고받으므로, tools/check-scoring.js가 node에서 그대로 불러 쓴다.
// 최종 점수 = 청소 점수 - 감점 + 시간 보너스이고, SCORE_CAP이 숫자면 그 값을 넘지 않게 자른다.
// 엔딩은 bad1, bad2, true, special, normal 순서로 처음 맞는 하나다. SPECIAL_BEFORE_TRUE가 true면 true와 special의 순서를 바꾼다.

const Scoring = {
  // 한 판의 상태를 점수 계산에 넘길 값으로 바꾼다. data의 ITEMS, CLEANING, PHOTOS 순서를 따른다.
  snapshot(state, remainingSec, early) {
    return {
      items: ITEMS.map(it => ({ id: it.id, no: it.no, name: it.name, category: it.category, hidden: state.isHidden(it.id) })),
      cleaning: CLEANING.map(c => ({ id: c.id, kind: c.kind, done: state.cleaning[c.id].done })),
      photos: PHOTOS.map(p => ({ id: p.id, kind: p.kind, title: p.title, seen: state.photos[p.id].seen })),
      remainingSec,
      early
    };
  },

  compute(snap, cfg) {
    const byNo = (a, b) => a.no - b.no;
    const unhiddenEx = snap.items.filter(i => i.category === 'ex' && !i.hidden).sort(byNo);
    const hiddenCurrent = snap.items.filter(i => i.category === 'current' && i.hidden).sort(byNo);
    const hiddenMine = snap.items.filter(i => i.category === 'mine' && i.hidden).sort(byNo);

    const ofKind = kind => snap.cleaning.filter(c => c.kind === kind);
    const allDone = list => list.length > 0 && list.every(c => c.done);
    const doneCount = list => list.filter(c => c.done).length;
    const trash = ofKind('trash');
    const laundry = ofKind('laundry');
    const unprocessed = trash.length + laundry.length - doneCount(trash) - doneCount(laundry);

    const clean = {
      blanket: allDone(ofKind('blanket')) ? cfg.SCORE_BLANKET : 0,
      stains: allDone(ofKind('stain')) ? cfg.SCORE_STAINS : 0,
      trash: doneCount(trash) * cfg.SCORE_TRASH_EACH,
      laundry: doneCount(laundry) * cfg.SCORE_LAUNDRY_EACH,
      unprocessed: -unprocessed * cfg.UNPROCESSED_PENALTY,
      trashCount: doneCount(trash),
      laundryCount: doneCount(laundry),
      unprocessedCount: unprocessed
    };
    clean.total = clean.blanket + clean.stains + clean.trash + clean.laundry + clean.unprocessed;
    const allClean = allDone(ofKind('blanket')) && allDone(ofKind('stain')) && unprocessed === 0;

    const penalty = {
      mine: hiddenMine.length * cfg.MINE_HIDE_PENALTY,
      current: hiddenCurrent.length * cfg.CURRENT_HIDE_PENALTY
    };
    penalty.total = penalty.mine + penalty.current;

    // 시간 보너스는 일찍 끝냈을 때만 준다. BONUS_REQUIRES_ALL_CLEAN이 true면 청소도 모두 끝냈어야 한다.
    let timeBonus = 0;
    if (snap.early && (!cfg.BONUS_REQUIRES_ALL_CLEAN || allClean)) {
      timeBonus = Math.min(Math.floor(snap.remainingSec / 10) * cfg.TIME_BONUS_PER_10SEC, cfg.TIME_BONUS_MAX);
    }

    const rawTotal = clean.total - penalty.total + timeBonus;
    const total = typeof cfg.SCORE_CAP === 'number' ? Math.min(rawTotal, cfg.SCORE_CAP) : rawTotal;

    const currentPhotos = snap.photos.filter(p => p.kind === 'current');
    const currentPhotosSeen = currentPhotos.filter(p => p.seen).length;

    const trueOk = hiddenMine.length <= cfg.TRUE_MINE_HIDE_ALLOWED && total >= cfg.TRUE_MIN_SCORE &&
      (!cfg.TRUE_REQUIRES_EARLY_FINISH || snap.early);
    const specialOk = currentPhotos.length > 0 && currentPhotosSeen === currentPhotos.length && total >= cfg.SPECIAL_MIN_SCORE;
    const order = cfg.SPECIAL_BEFORE_TRUE ? [['special', specialOk], ['true', trueOk]] : [['true', trueOk], ['special', specialOk]];

    let ending = 'normal';
    if (unhiddenEx.length > 0) ending = 'bad1';
    else if (hiddenCurrent.length > 0 || total < cfg.BAD2_SCORE_BELOW) ending = 'bad2';
    else if (order[0][1]) ending = order[0][0];
    else if (order[1][1]) ending = order[1][0];

    return {
      ending,
      missed: unhiddenEx.length ? unhiddenEx[0] : null,   // bad1에서 보여 줄 물건: 숨기지 못한 ex 중 번호가 가장 작은 것
      clean,
      allClean,
      penalty,
      timeBonus,
      rawTotal,      // 상한 적용 전
      total,         // 상한 적용 후, 최종 점수
      unhiddenEx,
      hiddenCurrent,
      hiddenMine,
      currentPhotosSeen,
      currentPhotosTotal: currentPhotos.length,
      remainingSec: snap.remainingSec,
      early: snap.early
    };
  }
};

if (typeof module !== 'undefined') module.exports = Scoring;
