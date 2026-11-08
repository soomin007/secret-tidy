// 이불 개기와 얼룩 닦기의 판정과 진행도를 계산하는 순수 함수 모음이다.
// p5 함수를 쓰지 않고 숫자만 주고받으므로 브라우저 밖에서도 그대로 시험할 수 있다.
// 기준값(FOLD_STROKES, FOLD_MIN_RATIO, WIPE_DISTANCE 등)은 cfg로 받는다. 게임에서는 config.js의 CONFIG를 넘긴다.

const Gestures = {
  // 이불: 누른 점(start)과 뗀 점(end)으로 쓸기 1회를 인정할지 정한다.
  // 가로 이동이 이불 폭의 FOLD_MIN_RATIO 이상이고 세로 이동보다 클 때만 인정한다.
  isFoldStroke(start, end, blanketWidth, cfg) {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    return dx >= blanketWidth * cfg.FOLD_MIN_RATIO && dx > dy;
  },

  // 쓸기 횟수를 0~1 진행도로 바꾼다. FOLD_STROKES회 쓸면 1이다.
  foldProgress(strokes, cfg) {
    return Math.min(1, strokes / cfg.FOLD_STROKES);
  },

  // 진행도에 따라 줄어드는 이불 높이의 비율. 처음은 1이고 다 개면 BLANKET_FOLDED_HEIGHT다.
  foldedHeightRatio(progress, cfg) {
    return 1 - (1 - cfg.BLANKET_FOLDED_HEIGHT) * progress;
  },

  // 얼룩: 마우스가 prev에서 cur로 움직이는 동안 얼룩 영역(rect) 안에서 움직인 거리.
  // 두 점이 모두 영역 안에 있을 때만 세고, 영역 밖으로 나간 움직임은 세지 않는다.
  wipeSegment(prev, cur, rect) {
    if (!this.inside(prev, rect) || !this.inside(cur, rect)) return 0;
    return Math.hypot(cur.x - prev.x, cur.y - prev.y);
  },

  // 누적 거리를 0~1 진행도로 바꾼다. WIPE_DISTANCE에 닿으면 1이다.
  wipeProgress(distance, cfg) {
    return Math.min(1, distance / cfg.WIPE_DISTANCE);
  },

  inside(p, r) {
    return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  }
};
