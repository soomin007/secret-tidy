// 여러 장면이 함께 쓰는 그리기 도구를 모은다. 색, 버튼, HUD, 안내 문구, DEBUG 표시가 여기 있다.
// 모든 좌표는 1280×720 논리 좌표이고, 창 크기에 맞춘 확대와 축소는 sketch.js가 맡는다.
// 그래픽은 일부러 색 상자와 글자 수준에 머문다. 완성본처럼 보이면 안 된다.

const UI = {
  W: 1280,
  H: 720,

  COLOR: {
    margin: [17, 17, 17],          // 그림 밖 여백
    ink: [34, 34, 34],             // 기본 글자
    subInk: [96, 96, 96],          // 보조 글자
    line: [68, 68, 68],            // 테두리
    button: [45, 45, 45],
    buttonHover: [92, 92, 92],
    buttonDisabled: [178, 178, 178],
    warning: [214, 40, 40],        // 30초 이하 타이머
    introBg: [32, 36, 44],
    roomBg: [222, 217, 207],
    zoneBg: [236, 233, 226],
    zoneRect: [247, 244, 237],
    debugBadge: [255, 214, 0]
  },

  // 물건 종류별 바탕색. 선물과 내 물건은 일부러 같은 색과 모양으로 그린다.
  // 메모를 읽어야만 둘을 구분할 수 있다는 것이 이 게임의 핵심 판단이다.
  KIND_FILL: {
    ex_gift: [255, 255, 255],
    own_goods: [255, 255, 255],
    photo: [255, 255, 255],
    trash: [234, 226, 197],
    laundry: [206, 226, 243],
    blanket: [222, 212, 239],
    stain: [196, 160, 112]
  },
  // 디버그 표시(D)를 켰을 때만 쓰는 종류별 색
  DEBUG_FILL: {
    ex_gift: [246, 176, 176],
    own_goods: [170, 222, 182],
    photo: [247, 219, 133]
  },

  // 근접 컷에서 장소 이름 아래에 두는 버튼
  BACK_BUTTON: { x: 16, y: 72, w: 150, h: 44, label: '방 전체로' },
  // 오른쪽 위 남은 시간 칸
  TIMER_BOX: { x: 1114, y: 16, w: 150, h: 56 },
  // 물건을 들고 있는 동안 화면 아래 가운데에 뜨는 메모 카드
  MEMO_CARD: { x: 320, y: 628, w: 640, h: 78 },

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

  // 버튼 하나를 그린다. opts.variant가 'light'면 흰 바탕에 검은 글자다.
  // opts.disabled는 물건을 들고 있는 동안처럼 버튼이 반응하지 않을 때 쓴다.
  drawButton(btn, opts = {}) {
    const light = opts.variant === 'light';
    push();
    strokeWeight(2);
    if (opts.disabled) {
      fill(...this.COLOR.buttonDisabled);
      stroke(...this.COLOR.buttonDisabled);
    } else if (light) {
      fill(opts.hover ? 228 : 255);
      stroke(...this.COLOR.line);
    } else {
      fill(...(opts.hover ? this.COLOR.buttonHover : this.COLOR.button));
      stroke(...this.COLOR.button);
    }
    rect(btn.x, btn.y, btn.w, btn.h, 10);

    noStroke();
    fill(light && !opts.disabled ? 34 : 255);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    this.fitTextSize(btn.label, btn.w - 20, opts.textSize || 20, 12);
    text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    pop();
  },

  // HUD는 방 전체, 근접 컷, 회상에서 항상 그린다.
  // 왼쪽 위에 현재 장소 이름, 오른쪽 위에 남은 시간을 두고, 근접 컷에서는 이름 아래에 "방 전체로" 버튼을 둔다.
  drawHud(placeName, opts = {}) {
    push();
    textStyle(BOLD);
    textSize(22);
    const nameW = textWidth(placeName) + 36;
    fill(255, 255, 255, 235);
    stroke(...this.COLOR.line);
    strokeWeight(1.5);
    rect(16, 16, nameW, 44, 8);
    noStroke();
    fill(...this.COLOR.ink);
    textAlign(LEFT, CENTER);
    text(placeName, 34, 38);

    if (opts.backButton) {
      this.drawButton(this.BACK_BUTTON, { hover: opts.backHover, disabled: opts.backDisabled, textSize: 19 });
    }

    const warn = GameTimer.isWarning();
    const box = this.TIMER_BOX;
    fill(255, 255, 255, 235);
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

  // 물건 하나를 r 위치에 그린다. 둥근 사각형 가운데에 이름을 쓰고, 마우스를 올리면 테두리를 굵게 한다.
  // 사진은 이중 테두리로 액자처럼 그리고, 얼룩은 닦은 만큼 옅게 그린다. opts: { hover, debug }
  drawItem(state, r, opts = {}) {
    const kind = state.def.kind;
    const fillColor = (opts.debug && this.DEBUG_FILL[kind]) || this.KIND_FILL[kind] || [255, 255, 255];
    const alpha = kind === 'stain' ? CONFIG.STAIN_START_ALPHA * (1 - ItemManager.wipeProgress(state)) : 255;
    const label = state.def.name + (kind === 'blanket' && state.status === 'done' ? ' (다 갬)' : '');

    push();
    fill(...fillColor, alpha);
    stroke(...this.COLOR.line, alpha);
    strokeWeight(opts.hover ? 4.5 : 2);
    rect(r.x, r.y, r.w, r.h, 10);
    if (kind === 'photo') {
      noFill();
      strokeWeight(1.5);
      rect(r.x + 7, r.y + 7, r.w - 14, r.h - 14, 4);
    }

    noStroke();
    fill(...this.COLOR.ink, alpha);
    textAlign(CENTER, CENTER);
    textStyle(NORMAL);
    this.fitTextSize(label, r.w - 14, 15, 10);
    text(label, r.x + r.w / 2, r.y + r.h / 2);

    if (opts.debug) {
      let extra = '';
      if (kind === 'blanket') extra = ' 쓸기 ' + state.foldStrokes + '/' + CONFIG.FOLD_STROKES;
      if (kind === 'stain') extra = ' 닦기 ' + Math.round(state.wipeDistance) + '/' + CONFIG.WIPE_DISTANCE;
      this.drawDebugFrame(r, state.def.id + extra);
    }
    pop();
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

  // 드롭 대상은 점선 테두리 사각형에 이름과 넣은 개수를 쓴다.
  // 물건을 들고 그 위에 올라가 있으면 highlight가 true다.
  drawTarget(target, count, highlight, debug) {
    push();
    fill(255, 255, 255, highlight ? 175 : 90);
    stroke(...this.COLOR.line);
    strokeWeight(highlight ? 4 : 2);
    drawingContext.setLineDash([10, 7]);
    rect(target.x, target.y, target.w, target.h, 12);
    drawingContext.setLineDash([]);

    noStroke();
    textAlign(CENTER, CENTER);
    fill(...this.COLOR.ink);
    textStyle(BOLD);
    this.fitTextSize(target.label, target.w - 20, 18, 12);
    text(target.label, target.x + target.w / 2, target.y + 28);
    textStyle(NORMAL);
    textSize(16);
    fill(...this.COLOR.subInk);
    text('넣은 물건 ' + count + '개', target.x + target.w / 2, target.y + target.h / 2 + 16);

    if (debug) this.drawDebugFrame(target, target.type);
    pop();
  },

  // 메모 카드: 이름은 굵게, 출처 메모는 한 줄로 쓴다. 물건을 들고 있는 동안만 보인다.
  drawMemoCard(def) {
    const c = this.MEMO_CARD;
    push();
    fill(255, 251, 232);
    stroke(...this.COLOR.line);
    strokeWeight(2);
    rect(c.x, c.y, c.w, c.h, 10);

    noStroke();
    textAlign(LEFT, CENTER);
    fill(...this.COLOR.ink);
    textStyle(BOLD);
    this.fitTextSize(def.name, c.w - 48, 20, 12);
    text(def.name, c.x + 24, c.y + 25);
    textStyle(NORMAL);
    fill(...this.COLOR.subInk);
    this.fitTextSize(def.memo, c.w - 48, 17, 11);
    text(def.memo, c.x + 24, c.y + 54);
    pop();
  },

  // 놓기가 거절됐을 때처럼 잠깐 띄우는 안내 문구
  drawToast(message) {
    push();
    textStyle(NORMAL);
    textSize(18);
    const w = textWidth(message) + 44;
    noStroke();
    fill(30, 30, 30, 228);
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
