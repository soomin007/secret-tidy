// 게임 방법 안내다. GUIDE를 한 페이지씩 보여 주고, 클릭이나 [다음]으로 넘긴다.
// 마지막 페이지의 [시작]이나 어느 페이지에서든 [건너뛰기]를 누르면 타이머가 시작되고 방 전체로 간다.
// 마지막 페이지에서는 빈 곳을 눌러도 넘어가지 않는다. 실수로 타이머를 켜지 않게 하려는 것이다.
// 쪽마다 그 동작을 보여 주는 작은 아이소메트릭 그림을 크게 두고, 그 아래에 쪽 제목과 원문 줄을 짧게 붙인다.
// 그림은 게임 화면과 같은 블록, 이름표, 점선 화살표, 손 표시로 그리고 움직이지 않는다.

const SceneGuide = {
  SKIP_BUTTON: { x: 1104, y: 24, w: 150, h: 48, label: '건너뛰기' },
  NEXT_BUTTON: { x: 1040, y: 618, w: 200, h: 56 },
  PANEL: { x: 60, y: 96, w: 1160, h: 504 },
  TEXT_TOP: 448,   // 그림 아래 글자가 시작하는 y. 그림은 패널 위쪽 96~436 안에 그린다

  // 쪽마다 그림 아래에 붙이는 원문 줄의 번호(GUIDE.pages[i].lines). 그림이 보여 주는 동작을 말하는 줄만 고르고,
  // 분위기를 내는 줄은 화면에 내지 않는다. 05쪽은 세 동작의 줄을 그림 밑 설명(CAPTIONS)으로 나눠 붙인다.
  // data/content.js의 문구는 그대로 두고 고르기만 한다.
  LINES: [[0, 2], [1], [0, 1], [0, 1], [0, 1], [], [0, 1]],
  CAPTIONS: { 5: [1, 2, 3] },

  ITEM: [246, 243, 236],
  page: 0,

  enter() {
    this.page = 0;
  },

  update() {},

  isLast() {
    return this.page === GUIDE.pages.length - 1;
  },

  nextButton() {
    return Object.assign({ label: this.isLast() ? '시작' : '다음' }, this.NEXT_BUTTON);
  },

  draw(m) {
    background(...UI.COLOR.dark);
    const pg = GUIDE.pages[this.page];
    const p = this.PANEL;

    noStroke();
    fill(170, 163, 153);
    textStyle(BOLD);
    textSize(16);
    textAlign(LEFT, CENTER);
    text(GUIDE.title, p.x, 48);

    fill(...UI.COLOR.paper);
    stroke(...UI.COLOR.line);
    strokeWeight(2);
    rect(p.x, p.y, p.w, p.h);

    push();
    this.PICTURES[this.page].call(this);
    pop();

    // 그림 아래 글자: 쪽 제목과 고른 원문 줄. 자리에 들어갈 때까지 글자 크기를 줄인다.
    let y = this.TEXT_TOP;
    noStroke();
    if (pg.title) {
      fill(...UI.COLOR.ink);
      textStyle(BOLD);
      UI.fitTextSize(pg.title, p.w - 80, 26, 18);
      textAlign(LEFT, TOP);
      text(pg.title, p.x + 40, y);
      y += 42;
    }
    const lines = this.LINES[this.page].map(i => pg.lines[i]);
    if (lines.length) {
      textStyle(NORMAL);
      const room = p.y + p.h - 22 - y;
      let size = 20;
      let blocks = [];
      for (; size >= 15; size--) {
        textSize(size);
        blocks = lines.map(l => UI.wrapLines(l, p.w - 80));
        const n = blocks.reduce((s, b) => s + b.length, 0);
        if (n * size * 1.45 + (blocks.length - 1) * 6 <= room) break;
      }
      textSize(size);
      fill(...UI.COLOR.ink);
      for (const b of blocks) {
        UI.drawLines(b, p.x + 40, y, size * 1.45, LEFT);
        y += b.length * size * 1.45 + 6;
      }
    }

    fill(...UI.COLOR.subInk);
    textStyle(NORMAL);
    textSize(17);
    textAlign(RIGHT, BOTTOM);
    text((this.page + 1) + ' / ' + GUIDE.pages.length, p.x + p.w - 24, p.y + p.h - 14);

    const next = this.nextButton();
    UI.drawButton(next, { hover: UI.inRect(m, next), variant: 'light', textSize: 22 });
    UI.drawButton(this.SKIP_BUTTON, { hover: UI.inRect(m, this.SKIP_BUTTON), variant: 'light', textSize: 19 });

    // 누르기 전에 타이머가 켜진다는 것을 알린다. 마지막 페이지에서는 [시작] 아래, 나머지 페이지에서는 [건너뛰기] 아래에 둔다.
    const note = '누르면 ' + UI.formatDuration(CONFIG.TIME_LIMIT_SEC) + ' 타이머가 시작돼요';
    fill(170, 163, 153);
    textSize(15);
    if (this.isLast()) {
      textAlign(CENTER, TOP);
      text(note, next.x + next.w / 2, next.y + next.h + 8);
    } else {
      textAlign(RIGHT, TOP);
      text(note, this.SKIP_BUTTON.x + this.SKIP_BUTTON.w, this.SKIP_BUTTON.y + this.SKIP_BUTTON.h + 8);
    }
  },

  isClickable(m) {
    return !this.isLast() || UI.inRect(m, this.nextButton()) || UI.inRect(m, this.SKIP_BUTTON);
  },

  click(p) {
    if (UI.inRect(p, this.SKIP_BUTTON) || (this.isLast() && UI.inRect(p, this.nextButton()))) {
      Game.startPlay();
      return;
    }
    if (!this.isLast()) this.page += 1;
  },

  // ---------- 그림 도구 ----------

  // 바닥 위 블록. (cx, cy)는 블록 바닥 가운데의 화면 좌표다. 윗면 가장 안쪽 꼭짓점의 y(back)를 함께 돌려준다.
  block(cx, cy, w, d, h, color) {
    const o = { x: cx - (w - d) / 2, y: cy - (w + d) / 4 };
    Iso.drawBlock(o, { u: 0, v: 0, w, d, h }, color || this.ITEM);
    return { x: cx, back: cy - (w + d) / 4 - h, front: cy + (w + d) / 4 };
  },

  // 위가 열린 상자. 앞쪽 모서리에 이름표를 붙인다.
  openBox(cx, cy, w, d, h, label) {
    const o = { x: cx - (w - d) / 2, y: cy - (w + d) / 4 };
    Iso.drawOpenBox(o, { u: 0, v: 0, w, d, h }, SceneZone.FILL.spot);
    this.tag(cx + (w - d) / 2, cy + (w + d) / 4 - h / 2, label, { size: 15 });
  },

  // (x, y)를 가운데로 하는 이름표. 줄바꿈(\n)으로 두 줄을 쓸 수 있다. opts: { size, bold }
  tag(x, y, label, opts = {}) {
    const size = opts.size || 16;
    const lines = label.split('\n');
    push();
    textStyle(opts.bold === false ? NORMAL : BOLD);
    textSize(size);
    const w = Math.max(...lines.map(l => textWidth(l))) + 22;
    const h = lines.length * size * 1.25 + 12;
    fill(255, 254, 250);
    stroke(...UI.COLOR.line);
    strokeWeight(1.2);
    rect(x - w / 2, y - h / 2, w, h);
    noStroke();
    fill(...UI.COLOR.ink);
    UI.drawLines(lines, x, y - (lines.length * size * 1.25) / 2 + size * 0.12, size * 1.25, CENTER);
    pop();
  },

  // 블록 바로 위에 세운 이름표(게임 화면과 같은 자리)
  tagOn(b, label, opts) {
    const n = label.split('\n').length;
    const h = n * 16 * 1.25 + 12;
    this.tag(b.x, b.back + 12 - h / 2, label, opts);
  },

  // HUD와 같은 모양의 타이머
  timer(x, y, label, warn) {
    push();
    fill(255);
    stroke(...(warn ? UI.COLOR.warning : UI.COLOR.line));
    strokeWeight(warn ? 3 : 1.5);
    rect(x - 80, y - 30, 160, 60);
    noStroke();
    fill(...(warn ? UI.COLOR.warning : UI.COLOR.ink));
    textStyle(BOLD);
    textSize(34);
    textAlign(CENTER, CENTER);
    text(label, x, y + 1);
    pop();
  },

  arrow(ax, ay, bx, by) {
    Iso.drawArrow({ x: ax, y: ay }, { x: bx, y: by });
  },

  // 엇갈린 ×표. 그 방향으로 하면 안 된다는 뜻이다.
  cross(x, y) {
    push();
    stroke(...UI.COLOR.warning);
    strokeWeight(4);
    line(x - 10, y - 10, x + 10, y + 10);
    line(x - 10, y + 10, x + 10, y - 10);
    pop();
  },

  // 방 전체 그림을 s배로 줄여 (cx, cy)에 바닥 가운데가 오게 그린다. 방 좌표의 점을 바꾸는 함수를 돌려준다.
  miniRoom(cx, cy, s) {
    const c = { x: LAYOUT.room.o.x, y: LAYOUT.room.o.y + LAYOUT.room.size / 2 };
    push();
    translate(cx, cy);
    scale(s);
    translate(-c.x, -c.y);
    SceneRoom.drawRoom(null, false);
    pop();
    return q => ({ x: cx + (q.x - c.x) * s, y: cy + (q.y - c.y) * s });
  },

  // 근접 컷의 가구와 물건 블록(이름표 없이)을 s배로 줄여 그린다. 윗면 가운데가 (cx, cy)에 온다.
  miniZone(zoneId, cx, cy, s) {
    const sf = LAYOUT.surfaces[zoneId];
    const c = Iso.pt(sf.o, sf.size / 2, sf.size / 2);
    push();
    translate(cx, cy);
    scale(s);
    translate(-c.x, -c.y);
    SceneZone.drawFurniture(zoneId);
    for (const obj of Objects.inZone(zoneId)) {
      if (obj.type === 'spot' || obj.type === 'stain' || (obj.spec.z || 0) < 0) continue;
      Iso.drawBlock(sf.o, obj.spec, SceneZone.FILL[obj.type]);
    }
    pop();
  },

  // 원문 줄을 그림 밑 설명으로 쓴다. (x, y)는 첫 줄 가운데 위, w는 폭이다.
  caption(str, x, y, w) {
    push();
    noStroke();
    fill(...UI.COLOR.ink);
    textStyle(NORMAL);
    const fit = UI.fitLines(str, w, 3, 17, 14);
    textSize(fit.size);
    UI.drawLines(fit.lines, x, y, fit.size * 1.4, CENTER);
    pop();
  },

  // ---------- 쪽마다의 그림 ----------

  PICTURES: [
    // 도입: 방과 5분 타이머, 문 앞에 온 남자친구
    function () {
      this.miniRoom(450, 300, 0.42);
      this.timer(900, 180, GameTimer.format(CONFIG.TIME_LIMIT_SEC));
      UI.drawCat(900, 320, 40, false, '남자친구');
      this.arrow(852, 334, 700, 352);
    },

    // 01. 방 전체에서 구역을 누르면 근접 컷으로 들어간다.
    function () {
      const toMini = this.miniRoom(330, 290, 0.4);
      const t = toMini(SceneRoom.zoneCenter('desk'));
      this.arrow(560, 262, 690, 262);
      this.miniZone('desk', 930, 250, 0.42);
      Iso.drawHand(t.x + 16, t.y + 8, 1.1);
    },

    // 02. 물건을 눌러 메모를 읽고, 전 남친 물건만 숨김 장소에 넣는다.
    function () {
      const b = this.block(150, 214, 60, 56, 24);
      this.tagOn(b, '물건');
      Iso.drawHand(162, 196, 1);
      this.arrow(214, 214, 262, 214);
      const c = { x: 276, y: 128, w: 300, h: 196 };
      push();
      fill(...UI.COLOR.memo);
      stroke(...UI.COLOR.line);
      strokeWeight(1.5);
      rect(c.x, c.y, c.w, c.h);
      noStroke();
      fill(...UI.COLOR.ink);
      textStyle(BOLD);
      textSize(16);
      textAlign(LEFT, TOP);
      text('1차 관찰 메모', c.x + 16, c.y + 14);
      fill(...UI.COLOR.subInk);
      rect(c.x + 16, c.y + 46, 200, 7);
      rect(c.x + 16, c.y + 62, 160, 7);
      textStyle(BOLD);
      fill(...UI.COLOR.ink);
      text('2차 상세 사연', c.x + 16, c.y + 128);
      fill(196, 189, 178);
      rect(c.x + 16, c.y + 158, 240, 7);
      rect(c.x + 16, c.y + 174, 190, 7);
      pop();
      const detail = { x: c.x + 130, y: c.y + 84, w: 150, h: 34, label: '자세히 보기' };
      UI.drawButton(detail, { variant: 'light', textSize: 15 });
      Iso.drawHand(detail.x + 112, detail.y + 22, 1);

      const ex = this.block(700, 222, 60, 56, 24);
      this.tagOn(ex, '전 남친의 흔적\n15개');
      const cur = this.block(700, 392, 60, 56, 24);
      this.tagOn(cur, '현 남친의 물품\n7개');
      const mine = this.block(860, 392, 60, 56, 24);
      this.tagOn(mine, '내 물건\n8개');
      this.openBox(1060, 260, 84, 84, 62, '숨김 장소');
      this.arrow(752, 222, 996, 236);
      this.arrow(910, 370, 1006, 312);
      this.cross(956, 342);
      this.tag(1006, 360, '감점', { size: 15 });
    },

    // 03. 고양이를 구역 하나에 끌어 놓으면, 근접 컷에서 내 물건 곁을 맴돈다.
    function () {
      const toMini = this.miniRoom(360, 280, 0.4);
      const t = toMini(SceneRoom.zoneCenter('desk'));
      UI.drawCat(150, 392, 26, false);
      Iso.drawHand(168, 408, 1);
      this.arrow(170, 368, t.x - 6, t.y + 12);
      const a = this.block(720, 300, 58, 54, 24);
      this.tagOn(a, '내 물건');
      const b = this.block(880, 262, 58, 54, 24);
      this.tagOn(b, '다른 물건');
      const c = this.block(1040, 300, 58, 54, 24);
      this.tagOn(c, '내 물건');
      UI.drawCat(786, 318, 24, false);
      this.arrow(812, 344, 1004, 344);
    },

    // 04. 사진을 누르면 10초 회상이 흐르고, 사진은 방 안 물건과 이어진 단서다.
    function () {
      const ph = this.block(190, 250, 80, 74, 6, SceneZone.FILL.photo);
      push();
      noFill();
      stroke(...UI.COLOR.line);
      strokeWeight(1);
      const o = { x: 190 - 3, y: 250 - 38.5 };
      const top = Iso.faces(o, { u: 0, v: 0, w: 80, d: 74, h: 6 }).top;
      const mid = { x: (top[0].x + top[2].x) / 2, y: (top[0].y + top[2].y) / 2 };
      Iso.poly(top.map(q => ({ x: mid.x + (q.x - mid.x) * 0.72, y: mid.y + (q.y - mid.y) * 0.72 })));
      pop();
      this.tagOn(ph, '사진');
      Iso.drawHand(204, 238, 1);
      const clue = this.block(300, 392, 56, 52, 24);
      this.tagOn(clue, '물건');
      push();
      stroke(...UI.COLOR.line);
      strokeWeight(2);
      drawingContext.setLineDash([3, 6]);
      line(214, 290, 284, 336);
      drawingContext.setLineDash([]);
      pop();
      this.arrow(262, 226, 382, 226);
      push();
      fill(20, 19, 18);
      noStroke();
      rect(396, 136, 340, 190);
      fill(255);
      textStyle(BOLD);
      textSize(20);
      textAlign(CENTER, CENTER);
      text('회상', 566, 200);
      noFill();
      stroke(255);
      strokeWeight(1.5);
      rect(436, 278, 220, 14);
      noStroke();
      fill(255);
      rect(436, 278, 120, 14);
      textSize(17);
      textAlign(LEFT, CENTER);
      text('10초', 666, 285);
      pop();
      this.arrow(750, 230, 830, 230);
      this.timer(940, 176, '04:30');
      this.arrow(940, 214, 940, 262);
      this.timer(940, 300, '04:20');
    },

    // 05. 이불은 좌우로 쓸고, 얼룩은 문지르고, 쓰레기와 빨래는 제 통에 넣는다.
    function () {
      const lines = GUIDE.pages[5].lines;
      const [c1, c2, c3] = this.CAPTIONS[5].map(i => lines[i]);
      const capY = this.TEXT_TOP + 50;
      this.block(250, 290, 170, 160, 28, SceneZone.FILL.blanket);
      this.arrow(250, 232, 135, 232);
      this.arrow(250, 232, 365, 232);
      Iso.drawHand(170, 246, 1.1);
      this.caption(c1, 250, capY, 330);

      push();
      noStroke();
      fill(...SceneZone.FILL.stain, 150);
      ellipse(640, 270, 200, 100);
      noFill();
      stroke(...UI.COLOR.line);
      strokeWeight(2.5);
      beginShape();
      for (let i = 0; i <= 8; i++) vertex(576 + i * 16, i % 2 ? 252 : 288);
      endShape();
      pop();
      Iso.drawHand(702, 276, 1.1);
      this.caption(c2, 640, capY, 330);

      const t = this.block(910, 214, 46, 46, 18, SceneZone.FILL.trash);
      this.tagOn(t, '쓰레기', { size: 15 });
      this.openBox(1100, 196, 56, 56, 40, '휴지통');
      this.arrow(944, 210, 1050, 204);
      const l = this.block(910, 362, 56, 50, 14, SceneZone.FILL.laundry);
      this.tagOn(l, '빨래', { size: 15 });
      this.openBox(1100, 346, 56, 56, 40, '빨래 바구니');
      this.arrow(950, 358, 1050, 352);
      this.caption(c3, 1030, capY, 330);
    },

    // 06. 시간이 다 되거나 [준비 완료]를 누르면 남자친구가 들어와 방을 본다.
    function () {
      this.timer(230, 170, '00:00', true);
      const ready = { x: 140, y: 268, w: 180, h: 56, label: '준비 완료' };
      UI.drawButton(ready, { textSize: 20 });
      Iso.drawHand(ready.x + 134, ready.y + 36, 1);
      this.arrow(320, 180, 528, 252);
      this.arrow(330, 296, 528, 278);
      this.miniRoom(720, 300, 0.36);
      UI.drawCat(1010, 230, 40, false, '남자친구');
      this.arrow(960, 250, 880, 280);
    }
  ]
};
