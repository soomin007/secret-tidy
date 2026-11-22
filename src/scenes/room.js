// 방 전체 화면이다. 대각선 벽 두 면과 마름모 바닥 위에 책상(왼쪽 벽), 침대(안쪽 가운데), 옷장(오른쪽 벽), 러그(바닥 구역)를
// 아이소메트릭 블록으로 그리고, 구역을 누르면 그 근접 컷으로 간다. 자리는 data/layout.js의 LAYOUT.room에 있다.
// 구역의 판정 윤곽은 블록의 육각형과 그 위의 이름표를 합친 모양이다.
// 왼쪽 아래의 고양이를 구역 위로 끌어 놓으면 그 구역에 배치된다. CAT_MAX_PLACEMENTS번을 다 쓰면 더 끌 수 없다.
// 오른쪽 아래 [준비 완료]는 확인 창을 띄우고, 확인하면 엔딩 판정으로 간다. 확인을 기다리는 동안에도 타이머는 흐른다.

const SceneRoom = {
  READY_BUTTON: { x: 1040, y: 628, w: 210, h: 64, label: '준비 완료' },
  ZONE_ORDER: ['desk', 'bed', 'closet', 'floor'],
  DRAW_ORDER: ['floor', 'bed', 'closet', 'desk'],
  CAT_R: 30,
  TAG: { w: 96, h: 46 },
  COLOR: {
    floor: [218, 208, 192],
    wall: [228, 223, 214],
    desk: [206, 190, 166],
    bed: [214, 204, 188],
    closet: [200, 184, 160],
    rug: [228, 220, 206]
  },

  catDrag: null,   // 끌고 있는 고양이의 자리 { x, y }

  enter() {
    this.catDrag = null;
  },

  update() {},

  // 구역 이름표. 블록 윗면 가운데에 세운다.
  zoneTag(id) {
    const c = Iso.topCenter(LAYOUT.room.o, LAYOUT.room.zones[id]);
    return { x: c.x - this.TAG.w / 2, y: c.y + 2 - this.TAG.h, w: this.TAG.w, h: this.TAG.h };
  },

  zoneOutline(id) {
    return [Iso.faces(LAYOUT.room.o, LAYOUT.room.zones[id]).hull, Iso.rectPoly(this.zoneTag(id))];
  },

  // 구역 윤곽을 감싸는 사각형
  zoneRect(id) {
    return Iso.bbox(this.zoneOutline(id));
  },

  // 구역 이름표의 가운데. 사람이 구역을 누를 때 가장 먼저 누르는 곳이라 검사 도구도 여기를 누른다.
  zoneCenter(id) {
    const t = this.zoneTag(id);
    return { x: t.x + t.w / 2, y: t.y + t.h / 2 };
  },

  zoneAt(p) {
    for (const id of this.ZONE_ORDER) {
      if (this.zoneOutline(id).some(poly => Iso.inPoly(p, poly))) return id;
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

  // 벽, 바닥, 구역 네 곳을 그린다. 게임 방법 안내도 이 그림을 줄여서 쓴다. hover는 강조할 구역 id다.
  drawRoom(hover, debug) {
    this.drawShell();
    const o = LAYOUT.room.o;
    for (const id of this.DRAW_ORDER) {
      const b = LAYOUT.room.zones[id];
      const on = id === hover;
      const weight = on ? 4 : Iso.LINE;
      const c = this.COLOR[id === 'floor' ? 'rug' : id];
      const fillC = on ? Iso.shade(c, 0.93) : c;
      push();
      const f = Iso.drawBlock(o, b, fillC, { weight });
      if (id === 'floor') {
        // 러그는 점선 테두리를 한 번 더 두른다.
        const mid = { x: (f.top[0].x + f.top[2].x) / 2, y: (f.top[0].y + f.top[2].y) / 2 };
        noFill();
        stroke(...UI.COLOR.line);
        strokeWeight(1.2);
        drawingContext.setLineDash([8, 6]);
        Iso.poly(f.top.map(q => ({ x: mid.x + (q.x - mid.x) * 0.84, y: mid.y + (q.y - mid.y) * 0.84 })));
        drawingContext.setLineDash([]);
      } else if (id === 'closet') {
        // 옷장 문 두 짝의 틈
        const a = Iso.pt(o, b.u + b.w / 2, b.v + b.d, b.h - 6);
        const z = Iso.pt(o, b.u + b.w / 2, b.v + b.d, 6);
        stroke(...UI.COLOR.line);
        strokeWeight(1.2);
        line(a.x, a.y, z.x, z.y);
      } else if (id === 'bed') {
        // 베개
        Iso.drawBlock(o, { u: b.u + 30, v: b.v + 14, w: b.w - 60, d: 40, h: 10, z: b.h }, [244, 241, 234]);
      }
      const t = this.zoneTag(id);
      fill(255, 254, 250);
      stroke(...UI.COLOR.line);
      strokeWeight(on ? 3 : 1.5);
      rect(t.x, t.y, t.w, t.h);
      noStroke();
      fill(...UI.COLOR.ink);
      textAlign(CENTER, CENTER);
      textStyle(BOLD);
      textSize(24);
      text(ZONE_NAMES[id], t.x + t.w / 2, t.y + t.h / 2 + 1);
      pop();
      if (debug) {
        UI.drawDebugOutline(this.zoneOutline(id), id);
        const left = Game.remainingInZone(id);
        push();
        noStroke();
        fill(...UI.COLOR.debug);
        textAlign(CENTER, TOP);
        textSize(15);
        text('남은 ex ' + left.ex + ', 청소 ' + left.clean, t.x + t.w / 2, t.y + t.h + 4);
        pop();
      }
    }
  },

  // 벽 두 면과 바닥
  drawShell() {
    const o = LAYOUT.room.o;
    const n = LAYOUT.room.size;
    const h = LAYOUT.room.wall;
    Iso.drawBlock(o, { u: -14, v: 0, w: 14, d: n, h, z: 0 }, this.COLOR.wall);
    Iso.drawBlock(o, { u: -14, v: -14, w: n + 14, d: 14, h, z: 0 }, this.COLOR.wall);
    Iso.drawBlock(o, { u: 0, v: 0, w: n, d: n, h: 8, z: -8 }, this.COLOR.floor);
  },

  draw(m) {
    background(...UI.COLOR.stage);
    const free = Game.inputFree();
    // 고양이를 끄는 동안에는 놓일 구역을, 아니면 누를 구역을 강조한다.
    const hover = this.catDrag && !Game.overlay ? this.zoneAt(m) : (free && !this.catAt(m) ? this.zoneAt(m) : null);
    this.drawRoom(hover, Game.debugView);

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
