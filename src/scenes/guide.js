// 게임 방법 안내다. GUIDE를 한 페이지씩 보여 주고, 클릭이나 [다음]으로 넘긴다.
// 마지막 페이지의 [시작]이나 어느 페이지에서든 [건너뛰기]를 누르면 타이머가 시작되고 방 전체로 간다.
// 마지막 페이지에서는 빈 곳을 눌러도 넘어가지 않는다. 실수로 타이머를 켜지 않게 하려는 것이다.

const SceneGuide = {
  SKIP_BUTTON: { x: 1104, y: 24, w: 150, h: 48, label: '건너뛰기' },
  NEXT_BUTTON: { x: 1040, y: 618, w: 200, h: 56 },
  PANEL: { x: 60, y: 112, w: 1160, h: 486 },

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
    fill(...UI.COLOR.paper);
    stroke(...UI.COLOR.line);
    strokeWeight(2);
    rect(p.x, p.y, p.w, p.h, 6);

    noStroke();
    fill(...UI.COLOR.subInk);
    textStyle(BOLD);
    textSize(18);
    textAlign(LEFT, TOP);
    text(GUIDE.title, p.x + 40, p.y + 32);

    let y = p.y + 82;
    if (pg.title) {
      fill(...UI.COLOR.ink);
      textStyle(BOLD);
      const fit = UI.fitLines(pg.title, p.w - 80, 1, 30, 20);
      textSize(fit.size);
      UI.drawLines(fit.lines, p.x + 40, y, fit.size * 1.4, LEFT);
      y += 62;
    }

    fill(...UI.COLOR.ink);
    textStyle(NORMAL);
    textSize(21);
    for (const line of pg.lines) {
      const lines = UI.wrapLines(line, p.w - 80);
      UI.drawLines(lines, p.x + 40, y, 32, LEFT);
      y += lines.length * 32 + 14;
    }

    fill(...UI.COLOR.subInk);
    textSize(17);
    textAlign(RIGHT, BOTTOM);
    text((this.page + 1) + ' / ' + GUIDE.pages.length, p.x + p.w - 28, p.y + p.h - 20);

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
  }
};
