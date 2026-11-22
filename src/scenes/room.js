// 방 전체 화면이다. 왼쪽 책상, 가운데 침대, 오른쪽 옷장, 아래쪽 바닥 구역을 상자로 그리고, 구역을 누르면 그 근접 컷으로 간다.
// 구역 자리는 data/layout.js의 LAYOUT.room에 있다.
// 왼쪽 아래의 고양이를 구역 위로 끌어 놓으면 그 구역에 배치된다. CAT_MAX_PLACEMENTS번을 다 쓰면 더 끌 수 없다.
// 오른쪽 아래 [준비 완료]는 확인 창을 띄우고, 확인하면 엔딩 판정으로 간다. 확인을 기다리는 동안에도 타이머는 흐른다.

const SceneRoom = {
  READY_BUTTON: { x: 1040, y: 628, w: 210, h: 64, label: '준비 완료' },
  ZONE_ORDER: ['desk', 'bed', 'closet', 'floor'],
  CAT_R: 30,

  catDrag: null,   // 끌고 있는 고양이의 자리 { x, y }

  enter() {
    this.catDrag = null;
  },

  update() {},

  zoneAt(p) {
    for (const id of this.ZONE_ORDER) {
      if (UI.inRect(p, LAYOUT.room.zones[id])) return id;
    }
    return null;
  },

  // 고양이가 지금 앉아 있는 곳(원의 가운데)
  catSpot() {
    const zone = GameState.cat.zone;
    return zone ? LAYOUT.room.catSpots[zone] : LAYOUT.room.catHome;
  },

  // 끌 수 있는 고양이가 p 아래에 있는지
  catAt(p) {
    if (!GameState.canMoveCat(CONFIG)) return false;
    const c = this.catSpot();
    return Math.hypot(p.x - c.x, p.y - c.y) <= this.CAT_R;
  },

  hud() {
    return { place: '방 전체', back: false, hiddenCount: CONFIG.SHOW_HIDDEN_COUNT ? GameState.hiddenCount() : null };
  },

  draw(m) {
    background(...UI.COLOR.stage);
    const free = Game.inputFree();
    // 고양이를 끄는 동안에는 놓일 구역을, 아니면 누를 구역을 강조한다.
    const hover = this.catDrag && !Game.overlay ? this.zoneAt(m) : (free && !this.catAt(m) ? this.zoneAt(m) : null);

    for (const id of this.ZONE_ORDER) {
      const r = LAYOUT.room.zones[id];
      push();
      fill(id === hover ? 214 : 222, id === hover ? 208 : 217, id === hover ? 199 : 209);
      stroke(...UI.COLOR.line);
      strokeWeight(id === hover ? 4 : 2);
      rect(r.x, r.y, r.w, r.h, 6);
      noStroke();
      fill(...UI.COLOR.ink);
      textAlign(CENTER, CENTER);
      textStyle(BOLD);
      textSize(30);
      text(ZONE_NAMES[id], r.x + r.w / 2, r.y + r.h / 2);
      pop();
      if (Game.debugView) {
        UI.drawDebugFrame(r, id);
        const left = Game.remainingInZone(id);
        push();
        noStroke();
        fill(...UI.COLOR.debug);
        textAlign(CENTER, TOP);
        textSize(15);
        text('남은 ex ' + left.ex + ', 청소 ' + left.clean, r.x + r.w / 2, r.y + r.h / 2 + 26);
        pop();
      }
    }

    UI.drawButton(this.READY_BUTTON, { hover: free && UI.inRect(m, this.READY_BUTTON), textSize: 22 });
    if (Game.debugView) UI.drawDebugFrame(this.READY_BUTTON, 'ready');

    if (this.catDrag) {
      UI.drawCat(this.catDrag.x, this.catDrag.y, this.CAT_R, true);
    } else {
      const c = this.catSpot();
      UI.drawCat(c.x, c.y, this.CAT_R, free && this.catAt(m));
      if (!GameState.cat.zone && CONFIG.CAT_MAX_PLACEMENTS > 0) {
        push();
        noStroke();
        fill(...UI.COLOR.subInk);
        textAlign(CENTER, TOP);
        textSize(15);
        text('남은 배치 ' + (CONFIG.CAT_MAX_PLACEMENTS - GameState.cat.placements) + '번', c.x, c.y + this.CAT_R + 8);
        pop();
      }
    }
  },

  isClickable(m) {
    return UI.inRect(m, this.READY_BUTTON) || this.zoneAt(m) !== null || this.catAt(m);
  },

  isHolding() {
    return this.catDrag !== null;
  },

  // 고양이 위를 누르고 끌지 않은 채 떼면 그 자리의 구역을 누른 것과 같다.
  click(p) {
    if (UI.inRect(p, this.READY_BUTTON)) {
      Game.openOverlay('confirm');
      return;
    }
    const zone = this.zoneAt(p);
    if (zone) Game.goTo('zone', { zoneId: zone });
  },

  dragStart(from, p) {
    if (this.catAt(from)) this.catDrag = { x: p.x, y: p.y };
  },

  dragMove(p) {
    if (this.catDrag) this.catDrag = { x: p.x, y: p.y };
  },

  // 구역 위에서 놓으면 그 구역에 배치한다. 구역 밖에 놓으면 원래 자리로 돌아간다.
  dragEnd(p) {
    if (!this.catDrag) return;
    this.catDrag = null;
    const zone = this.zoneAt(p);
    if (zone) GameState.placeCat(zone);
  },

  dragCancel() {
    this.catDrag = null;
  }
};
