// 여러 장면이 함께 쓰는 화면 도구를 모은다. 색, 버튼, HUD, 메모 카드, 안내 문구, DEBUG 표시가 여기 있다.
// 물건, 덮개, 드롭 대상의 모양은 src/art.js가 그리고, 여기서는 그 위에 글자와 디버그 표시를 얹는다.
// 모든 좌표는 1280×720 논리 좌표이고, 창 크기에 맞춘 확대와 축소는 sketch.js가 맡는다.

const UI = {
  W: 1280,
  H: 720,

  COLOR: {
    margin: [17, 17, 17],          // 그림 밖 여백
    ink: [52, 48, 43],             // 기본 글자
    subInk: [118, 111, 102],       // 보조 글자
    line: [70, 64, 56],            // 테두리
    paper: [244, 241, 235],        // 결과 화면 바탕
    button: [58, 54, 49],
    buttonHover: [96, 89, 80],
    buttonDisabled: [190, 184, 175],
    warning: [196, 52, 44],        // 30초 이하 타이머
    introBg: [38, 36, 34],
    memo: [255, 251, 232],         // 메모 카드
    cover: ART.C.cover,            // 닫힌 덮개의 바탕색. 물건 종류 색과 겹치지 않는 회녹색
    debugBadge: [255, 214, 0]
  },

  // 디버그 표시(D)를 켰을 때만 쓰는 종류별 색. 평소에는 선물과 내 물건과 사진이 모두 같은 흰색이다.
  // 메모를 읽어야만 선물과 내 물건을 구분할 수 있다는 것이 이 게임의 핵심 판단이다.
  DEBUG_FILL: {
    ex_gift: [246, 176, 176],
    own_goods: [170, 222, 182],
    photo: [247, 219, 133]
  },
  // ITEM_LABELS가 'kind'일 때 물건 위에 쓰는 종류 이름. 선물과 내 물건은 똑같이 '소품'이다.
  KIND_LABEL: {
    ex_gift: '소품',
    own_goods: '소품',
    photo: '사진',
    trash: '쓰레기',
    laundry: '빨래',
    blanket: '이불',
    stain: '얼룩'
  },

  // 근접 컷에서 장소 이름 아래에 두는 버튼
  BACK_BUTTON: { x: 16, y: 72, w: 150, h: 44, label: '방 전체로' },
  // 오른쪽 위 남은 시간 칸
  TIMER_BOX: { x: 1114, y: 16, w: 150, h: 56 },
  // 물건을 들고 있는 동안 화면 아래 가운데에 뜨는 메모 카드
  MEMO_CARD: { x: 320, y: 628, w: 640, h: 78 },

  // 데이터의 이름과 메모는 아직 임시라서 모두 '[임시]'로 시작한다. 화면에는 그 머리말을 빼고 쓰고,
  // 임시라는 표시는 메모 카드와 결과 화면 구석에 한 번만 둔다.
  plain(str) {
    return String(str).replace(/^\[임시\]\s*/, '');
  },

  inRect(p, r) {
    return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  },

  // 글자가 maxW 안에 들어갈 때까지 글자 크기를 줄이고, 실제로 쓴 크기를 돌려준다.
  fitTextSize(str, maxW, size, minSize) {
    textSize(size);
    while (size > minSize && textWidth(str) > maxW) {
      size -= 1;
      textSize(size);
    }
    return size;
  },

  // 300 → "5분", 270 → "4분 30초", 45 → "45초"
  formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    if (m === 0) return s + '초';
    if (s === 0) return m + '분';
    return m + '분 ' + s + '초';
  },

  // 버튼 하나를 그린다. opts.variant가 'light'면 흰 바탕에 짙은 글자다.
  // opts.disabled는 물건을 들고 있는 동안처럼 버튼이 반응하지 않을 때 쓴다. opts.back이면 글자 앞에 왼쪽 화살촉을 그린다.
  drawButton(btn, opts = {}) {
    const light = opts.variant === 'light';
    push();
    strokeWeight(2);
    if (opts.disabled) {
      fill(...this.COLOR.buttonDisabled);
      stroke(...this.COLOR.buttonDisabled);
    } else if (light) {
      fill(opts.hover ? 232 : 255);
      stroke(...this.COLOR.line);
    } else {
      fill(...(opts.hover ? this.COLOR.buttonHover : this.COLOR.button));
      stroke(...this.COLOR.button);
    }
    rect(btn.x, btn.y, btn.w, btn.h, 8);

    noStroke();
    const ink = light && !opts.disabled ? this.COLOR.ink : [255, 255, 255];
    fill(...ink);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    const size = this.fitTextSize(btn.label, btn.w - (opts.back ? 44 : 20), opts.textSize || 20, 12);
    let cx = btn.x + btn.w / 2;
    if (opts.back) {
      const tw = textWidth(btn.label);
      cx += 9;
      const ax = cx - tw / 2 - 14;
      const ay = btn.y + btn.h / 2;
      stroke(...ink);
      strokeWeight(2.5);
      noFill();
      line(ax + 5, ay - 6, ax - 1, ay);
      line(ax - 1, ay, ax + 5, ay + 6);
      noStroke();
      fill(...ink);
    }
    textSize(size);
    text(btn.label, cx, btn.y + btn.h / 2);
    pop();
  },

  // HUD는 방 전체, 근접 컷, 회상에서 항상 그린다.
  // 왼쪽 위에 현재 장소 이름, 오른쪽 위에 남은 시간을 두고, 근접 컷에서는 이름 아래에 "방 전체로" 버튼을 둔다.
  drawHud(placeName, opts = {}) {
    push();
    textStyle(BOLD);
    textSize(22);
    const nameW = textWidth(placeName) + 36;
    fill(255, 255, 255, 240);
    stroke(...this.COLOR.line);
    strokeWeight(1.5);
    rect(16, 16, nameW, 44, 8);
    noStroke();
    fill(...this.COLOR.ink);
    textAlign(LEFT, CENTER);
    text(placeName, 34, 38);

    if (opts.backButton) {
      this.drawButton(this.BACK_BUTTON, { hover: opts.backHover, disabled: opts.backDisabled, textSize: 19, back: true });
    }

    const warn = GameTimer.isWarning();
    const box = this.TIMER_BOX;
    fill(255, 255, 255, 240);
    stroke(...(warn ? this.COLOR.warning : this.COLOR.line));
    strokeWeight(warn ? 3 : 1.5);
    rect(box.x, box.y, box.w, box.h, 8);
    noStroke();
    fill(...(warn ? this.COLOR.warning : this.COLOR.ink));
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(34);
    text(GameTimer.format(GameTimer.remaining), box.x + box.w / 2, box.y + box.h / 2 + 1);
    pop();
  },

  // 물건 위에 쓸 글자. mode는 CONFIG.ITEM_LABELS이고, 디버그 표시를 켜면 언제나 이름 전체를 쓴다.
  itemLabel(state, mode, debug) {
    const kind = state.def.kind;
    const folded = kind === 'blanket' && state.status === 'done' ? ' (다 갬)' : '';
    if (debug || mode === 'name') return this.plain(state.def.name) + folded;
    if (mode === 'kind') return (this.KIND_LABEL[kind] || '') + folded;
    return '';
  },

  // 물건 하나를 r 위치에 그린다. 모양은 src/art.js가 그리고, ITEM_LABELS에 따른 글자를 아래쪽에 얹는다.
  // opts: { hover, lift, debug }
  drawItem(state, r, opts = {}) {
    ART.item(state, r, opts);
    const label = this.itemLabel(state, CONFIG.ITEM_LABELS, opts.debug);
    if (label) {
      push();
      textStyle(NORMAL);
      const size = this.fitTextSize(label, r.w - 10, 14, 10);
      const w = Math.min(textWidth(label), r.w - 10) + 12;
      const y = r.y + r.h - 12 - (opts.lift || (opts.hover ? 3 : 0));
      noStroke();
      fill(255, 255, 255, 215);
      rect(r.x + r.w / 2 - w / 2, y - 10, w, 20, 4);
      fill(...this.COLOR.ink);
      textAlign(CENTER, CENTER);
      textSize(size);
      text(label, r.x + r.w / 2, y);
      pop();
    }
    if (opts.debug) {
      const kind = state.def.kind;
      let extra = '';
      if (kind === 'blanket') extra = ' 쓸기 ' + state.foldStrokes + '/' + CONFIG.FOLD_STROKES;
      if (kind === 'stain') extra = ' 닦기 ' + Math.round(state.wipeDistance) + '/' + CONFIG.WIPE_DISTANCE;
      this.drawDebugFrame(r, state.def.id + extra);
    }
  },

  // 덮개. 닫힌 덮개는 이름에 맞는 모양(서랍, 책 더미, 베개 등)을 같은 덮개 색으로 그리고, 연 덮개는 흐리게 남긴다.
  // 열 수 있는 것은 모두 같은 색이라서, 하나를 열어 보면 나머지도 열 수 있다는 것을 알게 된다. opts: { hover, debug }
  drawCover(cover, opts = {}) {
    ART.cover(cover, opts);
    const d = cover.def;
    if (opts.debug) this.drawDebugFrame(d, d.id + (d.hides.length ? ' ' + d.hides.join(', ') : ' (빈 덮개)'));
  },

  // 디버그 표시: 판정 영역 테두리와 id
  drawDebugFrame(r, label) {
    push();
    noFill();
    stroke(220, 0, 160);
    strokeWeight(1);
    rect(r.x, r.y, r.w, r.h);
    noStroke();
    fill(220, 0, 160);
    textStyle(NORMAL);
    textSize(11);
    textAlign(LEFT, BOTTOM);
    text(label, r.x, r.y - 2);
    pop();
  },

  // 드롭 대상(숨김 상자, 휴지통, 빨래 바구니). 이름표에 이름과 넣은 개수를 쓴다.
  // 물건을 들고 그 위에 올라가 있으면 highlight가 true다.
  drawTarget(target, count, highlight, debug) {
    ART.target(target, count, highlight, this.plain(target.label));
    if (debug) this.drawDebugFrame(target, target.type);
  },

  // 메모 카드: 이름은 굵게, 출처 메모는 한 줄로 쓴다. 물건을 들고 있는 동안만 보인다.
  // 오른쪽 위 '임시 문구'는 이름과 메모가 아직 임시라는 표시다.
  drawMemoCard(def) {
    const c = this.MEMO_CARD;
    push();
    fill(...this.COLOR.memo);
    stroke(...this.COLOR.line);
    strokeWeight(2);
    rect(c.x, c.y, c.w, c.h, 10);
    noStroke();

    textStyle(NORMAL);
    textSize(13);
    const tag = '임시 문구';
    const tagW = textWidth(tag) + 14;
    fill(240, 232, 200);
    rect(c.x + c.w - tagW - 12, c.y + 10, tagW, 22, 4);
    fill(...this.COLOR.subInk);
    textAlign(CENTER, CENTER);
    text(tag, c.x + c.w - 12 - tagW / 2, c.y + 21);

    textAlign(LEFT, CENTER);
    fill(...this.COLOR.ink);
    textStyle(BOLD);
    const name = this.plain(def.name);
    this.fitTextSize(name, c.w - 72 - tagW, 20, 12);
    text(name, c.x + 24, c.y + 25);
    textStyle(NORMAL);
    fill(...this.COLOR.subInk);
    const memo = this.plain(def.memo);
    this.fitTextSize(memo, c.w - 48, 17, 11);
    text(memo, c.x + 24, c.y + 54);
    pop();
  },

  // 놓기가 거절됐을 때처럼 잠깐 띄우는 안내 문구
  drawToast(message) {
    push();
    textStyle(NORMAL);
    textSize(18);
    const w = textWidth(message) + 44;
    noStroke();
    fill(40, 37, 33, 232);
    rect(this.W / 2 - w / 2, 84, w, 40, 20);
    fill(255);
    textAlign(CENTER, CENTER);
    text(message, this.W / 2, 104);
    pop();
  },

  // 디버그 표시(D)를 켜면 타이머 아래에 실시간 점수와 구역별 남은 개수를 띄운다.
  drawDebugInfo(lines) {
    push();
    textStyle(NORMAL);
    textSize(13);
    const w = Math.max(...lines.map(l => textWidth(l))) + 20;
    const x = this.TIMER_BOX.x + this.TIMER_BOX.w - w;
    noStroke();
    fill(0, 0, 0, 170);
    rect(x, 80, w, lines.length * 19 + 10, 4);
    fill(255, 236, 120);
    textAlign(LEFT, CENTER);
    lines.forEach((l, i) => text(l, x + 10, 95 + i * 19));
    pop();
  },

  // 디버그 표시나 일시정지가 켜져 있으면 왼쪽 아래 구석에 띄워, 테스트 화면을 실제 플레이로 착각하지 않게 한다.
  drawDebugBadge(paused) {
    const label = paused ? 'DEBUG 일시정지' : 'DEBUG';
    push();
    textStyle(BOLD);
    textSize(16);
    const w = textWidth(label) + 20;
    noStroke();
    fill(...this.COLOR.debugBadge);
    rect(10, this.H - 38, w, 28, 4);
    fill(0);
    textAlign(LEFT, CENTER);
    text(label, 20, this.H - 24);
    pop();
  }
};
