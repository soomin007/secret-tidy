// 방 전체 장면이다. 옷장, 책상, 침대, 바닥 네 구역을 큰 사각형으로 보여 주고, 구역을 누르면 그 근접 컷으로 간다.
// 오른쪽 아래 "문 열어 주기"는 확인 창을 한 번 더 띄우고, 확인하면 결과로 보낸다.
// 확인을 기다리는 동안에도 타이머는 흐른다.

const SceneRoom = {
  DOOR_BUTTON: { x: 980, y: 600, w: 240, h: 70, label: '문 열어 주기' },
  CONFIRM_PANEL: { x: 340, y: 210, w: 600, h: 290 },
  CONFIRM_YES: { x: 400, y: 400, w: 260, h: 64, label: '문 열고 결과 보기' },
  CONFIRM_NO: { x: 680, y: 400, w: 200, h: 64, label: '더 치우기' },

  confirmOpen: false,

  enter() {
    this.confirmOpen = false;
  },

  update() {},

  zoneAt(m) {
    return ZONES.find(zone => UI.inRect(m, zone.roomRect)) || null;
  },

  draw(m) {
    noStroke();
    fill(...UI.COLOR.roomBg);
    rect(0, 0, UI.W, UI.H);

    const hoverZone = this.confirmOpen ? null : this.zoneAt(m);
    const showCounts = CONFIG.SHOW_ZONE_COUNTS || Game.debugView;
    const counts = showCounts ? Game.remainingByZone() : null;

    for (const zone of ZONES) {
      const r = zone.roomRect;
      fill(...UI.COLOR.zoneRect);
      stroke(...UI.COLOR.line);
      strokeWeight(zone === hoverZone ? 5 : 2);
      rect(r.x, r.y, r.w, r.h, 12);

      noStroke();
      fill(...UI.COLOR.ink);
      textAlign(CENTER, CENTER);
      textStyle(BOLD);
      textSize(30);
      text(zone.name, r.x + r.w / 2, r.y + r.h / 2 - (counts ? 16 : 0));

      if (counts) {
        textStyle(NORMAL);
        textSize(18);
        fill(...UI.COLOR.subInk);
        text('남은 일 ' + counts[zone.id] + '개', r.x + r.w / 2, r.y + r.h / 2 + 22);
      }
      if (Game.debugView) UI.drawDebugFrame(r, zone.id);
    }

    if (CONFIG.ALLOW_EARLY_FINISH) {
      UI.drawButton(this.DOOR_BUTTON, { hover: !this.confirmOpen && UI.inRect(m, this.DOOR_BUTTON), textSize: 22 });
      if (Game.debugView) UI.drawDebugFrame(this.DOOR_BUTTON, 'door');
    }

    if (this.confirmOpen) this.drawConfirm(m);

    // 확인 창이 떠 있어도 남은 시간이 흐르는 것이 보이도록 HUD를 맨 위에 그린다.
    UI.drawHud('방 전체');
  },

  drawConfirm(m) {
    noStroke();
    fill(0, 0, 0, 110);
    rect(0, 0, UI.W, UI.H);

    const p = this.CONFIRM_PANEL;
    fill(255);
    stroke(...UI.COLOR.line);
    strokeWeight(2);
    rect(p.x, p.y, p.w, p.h, 14);

    noStroke();
    textAlign(CENTER, CENTER);
    fill(...UI.COLOR.ink);
    textStyle(BOLD);
    textSize(28);
    text('문을 열면 바로 결과가 나온다', UI.W / 2, 285);
    textStyle(NORMAL);
    textSize(19);
    fill(...UI.COLOR.subInk);
    text('남은 시간은 보너스 점수로 들어간다', UI.W / 2, 335);

    UI.drawButton(this.CONFIRM_YES, { hover: UI.inRect(m, this.CONFIRM_YES) });
    UI.drawButton(this.CONFIRM_NO, { hover: UI.inRect(m, this.CONFIRM_NO), variant: 'light' });
  },

  isClickable(m) {
    if (this.confirmOpen) return UI.inRect(m, this.CONFIRM_YES) || UI.inRect(m, this.CONFIRM_NO);
    if (CONFIG.ALLOW_EARLY_FINISH && UI.inRect(m, this.DOOR_BUTTON)) return true;
    return this.zoneAt(m) !== null;
  },

  pressed(m) {
    if (this.confirmOpen) {
      if (UI.inRect(m, this.CONFIRM_YES)) Game.finish('door');
      else if (UI.inRect(m, this.CONFIRM_NO)) this.confirmOpen = false;
      return;
    }
    if (CONFIG.ALLOW_EARLY_FINISH && UI.inRect(m, this.DOOR_BUTTON)) {
      this.confirmOpen = true;
      return;
    }
    const zone = this.zoneAt(m);
    if (zone) Game.goTo('zone', { zoneId: zone.id });
  },

  dragged() {},

  released() {}
};
