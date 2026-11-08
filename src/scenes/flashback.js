// 회상 장면이다. 근접 컷 위에 어두운 막을 덮고, FLASHBACK_SEC 동안 진행 막대를 채운 뒤
// 같은 근접 컷으로 저절로 돌아간다. 회상 중에는 입력을 받지 않지만 HUD 타이머는 계속 보이며 줄어든다.

const SceneFlashback = {
  BAR: { x: 340, y: 390, w: 600, h: 16 },

  zoneId: null,
  itemId: null,
  elapsed: 0,

  enter(params) {
    this.zoneId = params.zoneId;
    this.itemId = params.itemId;
    this.elapsed = 0;
  },

  // dt는 게임 시간이다. 개발용 일시정지 중에는 0이 들어와 회상도 멈춘다.
  update(dt) {
    this.elapsed += dt;
    if (this.elapsed >= CONFIG.FLASHBACK_SEC) Game.goTo('zone', { zoneId: this.zoneId });
  },

  draw() {
    SceneZone.drawScene(null);

    noStroke();
    fill(12, 12, 22, 215);
    rect(0, 0, UI.W, UI.H);

    fill(235);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(36);
    text('[임시] 회상 장면', UI.W / 2, 330);

    const ratio = Math.min(1, this.elapsed / CONFIG.FLASHBACK_SEC);
    const bar = this.BAR;
    fill(255, 255, 255, 60);
    rect(bar.x, bar.y, bar.w, bar.h, 8);
    fill(235);
    rect(bar.x, bar.y, bar.w * ratio, bar.h, 8);

    // 회상에 드는 시간이 보이도록 타이머를 막 위에 그린다. 입력을 받지 않으므로 "방 전체로" 버튼은 그리지 않는다.
    UI.drawHud(SceneZone.zone ? SceneZone.zone.name : '');
  },

  isClickable() {
    return false;
  },

  // 회상 중에는 모든 입력을 무시한다.
  pressed() {},

  dragged() {},

  released() {}
};
