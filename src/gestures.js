// 이불 개기와 얼룩 닦기의 판정과 진행도를 계산하는 순수 함수 모음이다.
// p5 함수를 쓰지 않고 숫자만 주고받으므로 브라우저 밖에서도 그대로 시험할 수 있다.
// 기준값(BLANKET_STROKES, BLANKET_MIN_RATIO, STAIN_WIPE_DISTANCE)은 cfg로 받는다. 게임에서는 config.js의 CONFIG를 넘긴다.

const Gestures = {
  FOLDED_HEIGHT: 0.3,   // 다 갠 이불의 높이(처음 높이 대비 비율)

  // 이불: 누른 점(start)과 뗀 점(end)으로 쓸기 1회를 인정할지 정한다.
  // 가로 이동이 이불 폭의 BLANKET_MIN_RATIO 이상이고 세로 이동보다 클 때만 인정한다.
  isBlanketStroke(start, end, blanketWidth, cfg) {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    return dx >= blanketWidth * cfg.BLANKET_MIN_RATIO && dx > dy;
  },

  // 쓸기 횟수를 0~1 진행도로 바꾼다. BLANKET_STROKES번 쓸면 1이다.
  blanketProgress(strokes, cfg) {
    return Math.min(1, strokes / cfg.BLANKET_STROKES);
  },

  // 쓸기 횟수에 따라 줄어드는 이불 높이의 비율. 처음은 1이고 다 개면 FOLDED_HEIGHT다.
  foldedHeightRatio(strokes, cfg) {
    return 1 - (1 - this.FOLDED_HEIGHT) * this.blanketProgress(strokes, cfg);
  },

  // 얼룩: 마우스가 prev에서 cur로 움직이는 동안 얼룩 안에서 움직인 거리.
  // inside는 점이 얼룩 안에 있는지 알려 주는 함수다. 두 점이 모두 안에 있을 때만 세고, 밖으로 나간 움직임은 세지 않는다.
  wipeSegment(prev, cur, inside) {
    if (!inside(prev) || !inside(cur)) return 0;
    return Math.hypot(cur.x - prev.x, cur.y - prev.y);
  },

  // 누적 거리를 0~1 진행도로 바꾼다. STAIN_WIPE_DISTANCE에 닿으면 1이다.
  wipeProgress(distance, cfg) {
    return Math.min(1, distance / cfg.STAIN_WIPE_DISTANCE);
  }
};
