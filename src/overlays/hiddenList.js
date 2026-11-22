// ALLOW_UNHIDE가 true일 때 숨김 장소를 누르면 뜨는 목록이다. 그 안에 숨긴 물건을 하나 고르면 원래 자리로 돌아가고 목록이 닫힌다.
// 목록이 떠 있는 동안에도 타이머는 흐른다.

const OverlayHiddenList = {
  PANEL: { x: 390, y: 96, w: 500, h: 540 },
  CLOSE_BUTTON: { x: 540, y: 562, w: 200, h: 56, label: '닫기' },
  ROW_H: 40,
  ROW_GAP: 6,

  zoneId: null,
  spotName: '',
  items: [],

  enter(params) {
    this.zoneId = params.zoneId;
    this.spotName = params.spotName;
    this.items = GameState.hiddenInZone(params.zoneId);
  },

  update() {},

  rows() {
    const p = this.PANEL;
    return this.items.map((it, i) => ({
      id: it.id,
      label: it.name,
      x: p.x + 40,
      y: p.y + 104 + i * (this.ROW_H + this.ROW_GAP),
      w: p.w - 80,
      h: this.ROW_H
    }));
  },

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
    textAlign(CENTER, TOP);
    textStyle(BOLD);
    textSize(24);
    text(this.spotName, UI.W / 2, p.y + 26);
    textStyle(NORMAL);
    textSize(17);
    fill(...UI.COLOR.subInk);
    text(this.items.length ? '고르면 제자리로 돌아가요' : '숨긴 물건이 없어요', UI.W / 2, p.y + 64);

    for (const row of this.rows()) {
      UI.drawButton(row, { hover: UI.inRect(m, row), variant: 'light', textSize: 17, bold: false });
    }
    UI.drawButton(this.CLOSE_BUTTON, { hover: UI.inRect(m, this.CLOSE_BUTTON) });
  },

  isClickable(m) {
    return UI.inRect(m, this.CLOSE_BUTTON) || this.rows().some(r => UI.inRect(m, r));
  },

  click(p) {
    if (UI.inRect(p, this.CLOSE_BUTTON)) {
      Game.closeOverlay();
      return;
    }
    const row = this.rows().find(r => UI.inRect(p, r));
    if (!row) return;
    GameState.unhide(row.id);
    Game.closeOverlay();
  }
};
