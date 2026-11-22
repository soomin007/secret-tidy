// [준비 완료]를 눌렀을 때 뜨는 확인 창이다. 확인하면 일찍 끝낸 것으로 엔딩 판정을 하고, 취소하면 방 전체로 돌아간다.
// 창이 떠 있는 동안에도 타이머는 흐른다.

const OverlayConfirm = {
  PANEL: { x: 340, y: 230, w: 600, h: 240 },
  YES_BUTTON: { x: 400, y: 370, w: 260, h: 64, label: '문 열고 엔딩 보기' },
  NO_BUTTON: { x: 680, y: 370, w: 200, h: 64, label: '더 치우기' },

  enter() {},

  update() {},

  draw(m) {
    noStroke();
    fill(20, 18, 16, 120);
    rect(0, 0, UI.W, UI.H);

    const p = this.PANEL;
    fill(255);
    stroke(...UI.COLOR.line);
    strokeWeight(2);
    rect(p.x, p.y, p.w, p.h);

    noStroke();
    fill(...UI.COLOR.ink);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(28);
    text('문을 열면 바로 엔딩이 나와요', UI.W / 2, 300);

    UI.drawButton(this.YES_BUTTON, { hover: UI.inRect(m, this.YES_BUTTON) });
    UI.drawButton(this.NO_BUTTON, { hover: UI.inRect(m, this.NO_BUTTON), variant: 'light' });
  },

  isClickable(m) {
    return UI.inRect(m, this.YES_BUTTON) || UI.inRect(m, this.NO_BUTTON);
  },

  click(p) {
    if (UI.inRect(p, this.YES_BUTTON)) Game.finish(true);
    else if (UI.inRect(p, this.NO_BUTTON)) Game.closeOverlay();
  }
};
