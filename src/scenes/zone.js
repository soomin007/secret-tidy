// 근접 컷이다. 장면 하나를 zoneId만 바꿔 옷장, 책상, 침대, 바닥 네 구역에 다시 쓴다.
// 왼쪽 위에 구역 이름과 [방 전체로] 버튼이 있고, 가구 윗면(LAYOUT.surfaces) 위에 판정 물건, 사진, 청소 물건, 놓는 곳을
// data/layout.js의 자리에 아이소메트릭 블록으로 그린다. 물건마다 이름표를 세워 이름을 쓴다.
// 판정 물건을 클릭하면 화면 아래에 메모 카드가 열린다. 드래그한 물건은 놓을 곳이 없으면 제자리로 돌아간다.

const SceneZone = {
  // 판정 물건(ex, current, mine)은 모두 같은 색과 모양이다. 메모를 읽어야만 구분할 수 있다는 것이 이 게임의 핵심 판단이다.
  // 디버그 표시(D)를 켰을 때만 분류별 색을 쓴다.
  FILL: {
    item: [246, 243, 236],
    photo: [236, 230, 218],
    trash: [222, 204, 170],
    laundry: [194, 210, 230],
    blanket: [190, 210, 178],
    stain: [128, 98, 62],
    spot: [214, 206, 192]
  },
  DEBUG_FILL: {
    ex: [246, 186, 180],
    current: [184, 206, 242],
    mine: [188, 226, 188]
  },
  TAG_FILL: [255, 254, 250],
  // 가구 색. 윗면 색이고 앞면은 Iso.SHADE로 어둡게 칠한다.
  WOOD: [206, 190, 166],
  MATTRESS: [238, 235, 228],
  WALL: [226, 221, 212],
  FLOOR: [216, 206, 190],

  CAT_MOVE_SEC: 1.5,   // 고양이가 다음 물건 옆으로 옮겨 가는 간격(초)
  CAT_R: 24,

  zoneId: null,
  memo: null,     // 열린 메모 카드 { id, detailed }
  drag: null,     // 끌고 있는 물건 { obj, offset, pos }
  gesture: null,  // 이불이나 얼룩 위에서 누른 채 움직이는 중 { obj, start }

  enter(params) {
    this.zoneId = params.zoneId;
    this.memo = null;
    this.drag = null;
    this.gesture = null;
  },

  // dt는 게임 시간이다. 메모 카드가 열려 있던 시간을 테스트용 기록에 더한다.
  update(dt) {
    if (this.memo) GameState.stats.memoOpenSec += dt;
  },

  hud() {
    return {
      place: ZONE_NAMES[this.zoneId],
      back: true,
      hiddenCount: CONFIG.SHOW_HIDDEN_COUNT ? GameState.hiddenCount() : null
    };
  },

  // 이 구역에 배치된 고양이의 자리. 아직 숨기지 않은 mine 물건 옆(Objects.catSpot)을 CAT_MOVE_SEC마다 차례로 옮겨 다니고,
  // 그런 물건이 없으면 LAYOUT.catRest에 앉는다. 고양이가 배치되지 않은 구역이면 null이다.
  // 타이머가 흐른 시간으로 자리를 정하므로, 일시정지(P) 중에는 고양이도 멈춘다.
  catPosition() {
    if (GameState.cat.zone !== this.zoneId) return null;
    const targets = GameState.catTargets(this.zoneId);
    if (!targets.length) return Object.assign({ itemId: null }, LAYOUT.catRest[this.zoneId]);
    const it = targets[Math.floor(GameTimer.elapsed / this.CAT_MOVE_SEC) % targets.length];
    return Object.assign({ itemId: it.id }, Objects.catSpot(Objects.get(it.id)));
  },

  // 물건 이름표에 쓰는 이름
  label(obj) {
    if (obj.type === 'photo') return obj.def.title;
    return UI.plain(obj.def.name);
  },

  draw(m) {
    background(...UI.COLOR.stage);
    this.drawFurniture();
    const free = Game.inputFree();
    const held = this.drag ? this.drag.obj : null;
    let hover = null;
    if (free) {
      hover = Objects.at(this.zoneId, m, ['item', 'photo', 'trash', 'laundry', 'blanket', 'stain']);
      if (!hover && this.unhideSpotAt(m)) hover = this.unhideSpotAt(m);
    } else if (held && !Game.overlay) {
      // 끌고 있는 물건을 받는 놓는 곳에 올라가면 테두리를 굵게 한다.
      const spot = Objects.at(this.zoneId, m, ['spot']);
      if (spot && Objects.accepts(spot, held)) hover = spot;
    }

    for (const obj of Objects.inZone(this.zoneId)) {
      if (!Objects.isVisible(obj) || obj === held) continue;
      this.drawObject(obj, { hover: obj === hover });
    }
    const cat = this.catPosition();
    if (cat) UI.drawCat(cat.x, cat.y, this.CAT_R, false);
    // 끌고 있는 물건은 커서를 따라 맨 위에 그린다.
    if (held) {
      const r = Objects.rect(held);
      this.drawObject(held, { hover: true, dx: this.drag.pos.x - r.x, dy: this.drag.pos.y - r.y });
    }

    if (this.memo) {
      const item = Objects.get(this.memo.id).def;
      UI.drawMemoCard(item, this.memo.detailed, free && UI.inRect(m, UI.MEMO_DETAIL_BUTTON));
    }
  },

  // 구역마다 가구를 그린다. 윗면은 물건이 놓이는 마름모이고, 그 아래로 body만큼 몸체가 내려간다.
  // 누를 수 없는 장식이다. 게임 방법 안내가 zoneId를 넘겨 줄여 그리기도 한다.
  drawFurniture(zoneId = this.zoneId) {
    const s = LAYOUT.surfaces[zoneId];
    const o = s.o;
    const n = s.size;
    const H = s.body;
    push();
    if (zoneId === 'floor') {
      // 방 바닥 한쪽 구석. 안쪽 두 변에 벽이 서고, 바닥 위에 점선 테두리의 러그가 깔려 있다.
      Iso.drawBlock(o, { u: -14, v: 0, w: 14, d: n, h: 120 }, this.WALL);
      Iso.drawBlock(o, { u: 0, v: -14, w: n, d: 14, h: 120 }, this.WALL);
      Iso.drawBlock(o, { u: 0, v: 0, w: n, d: n, h: 6, z: -6 }, this.FLOOR);
      const rug = Iso.faces(o, { u: 40, v: 40, w: 400, d: 420, h: 0 }).top;
      noStroke();
      fill(226, 218, 204);
      Iso.poly(rug);
      noFill();
      stroke(...UI.COLOR.line);
      strokeWeight(1.5);
      drawingContext.setLineDash([10, 7]);
      Iso.poly(rug);
      drawingContext.setLineDash([]);
    } else if (zoneId === 'closet') {
      // 옷장 안쪽. 뒤판 두 장과 바닥판(받침 높이 body)만 그린다.
      Iso.drawBlock(o, { u: -16, v: 0, w: 16, d: n, h: H + 150, z: -H }, this.WOOD);
      Iso.drawBlock(o, { u: 0, v: -16, w: n, d: 16, h: H + 150, z: -H }, this.WOOD);
      Iso.drawBlock(o, { u: 0, v: 0, w: n, d: n, h: H, z: -H }, [222, 210, 190]);
    } else if (zoneId === 'desk') {
      // 책상. 두께 16인 상판, 앞쪽 왼편의 서랍장, 다리 둘
      Iso.drawBlock(o, { u: n - 22, v: 0, w: 22, d: 22, h: H - 16, z: -H }, this.WOOD);
      Iso.drawBlock(o, { u: n - 22, v: n - 22, w: 22, d: 22, h: H - 16, z: -H }, this.WOOD);
      Iso.drawBlock(o, { u: 0, v: n - 200, w: 220, d: 200, h: H - 16, z: -H }, this.WOOD);
      Iso.drawBlock(o, { u: 0, v: 0, w: n, d: n, h: 16, z: -16 }, [222, 208, 186]);
    } else if (zoneId === 'bed') {
      // 침대. 오른쪽 뒤의 머리판, 틀, 매트리스. 침대 밑 칸(놓는 곳)은 틀의 앞면에 붙는다.
      Iso.drawBlock(o, { u: -14, v: -14, w: n + 14, d: 14, h: H + 70, z: -H }, this.WOOD);
      Iso.drawBlock(o, { u: 0, v: 0, w: n, d: n, h: H - 28, z: -H }, this.WOOD);
      Iso.drawBlock(o, { u: 0, v: 0, w: n, d: n, h: 28, z: -28 }, this.MATTRESS);
    }
    pop();
  },

  // 물건 하나를 그린다. opts: { hover, dx, dy(끌고 있을 때 처음 자리에서 옮긴 만큼) }
  drawObject(obj, opts = {}) {
    const debug = Game.debugView;
    const weight = opts.hover ? 3.5 : Iso.LINE;
    const o = Objects.origin(this.zoneId);
    const b = Objects.block(obj);
    const def = obj.def;
    push();
    translate(opts.dx || 0, opts.dy || 0);
    if (obj.type === 'spot') {
      this.drawSpot(obj, b, weight);
    } else if (obj.type === 'stain') {
      // 바닥에 번진 타원. 닦을수록 옅어진다.
      const progress = Gestures.wipeProgress(GameState.cleaning[obj.id].wiped, CONFIG);
      const alpha = 160 - 130 * progress;
      const e = Iso.ellipse(o, b);
      fill(...this.FILL.stain, alpha);
      noStroke();
      if (opts.hover) {
        stroke(...UI.COLOR.line);
        strokeWeight(3);
      }
      ellipse(e.x, e.y, e.a * 2, e.b * 2);
      noStroke();
      fill(255, 255, 255, 120 + alpha);
      textStyle(BOLD);
      UI.drawBoxLabel(this.label(obj), Objects.tagRect(obj, b));
    } else {
      let c = this.FILL[obj.type];
      if (debug && obj.type === 'item') c = this.DEBUG_FILL[def.category];
      if (debug && obj.type === 'photo') c = this.DEBUG_FILL[def.kind];
      const f = Iso.drawBlock(o, b, c, { weight });
      if (obj.type === 'photo') {
        // 사진은 윗면 안쪽에 한 줄을 더 그어 액자로 보이게 한다.
        const top = f.top;
        const mid = { x: (top[0].x + top[2].x) / 2, y: (top[0].y + top[2].y) / 2 };
        noFill();
        stroke(...UI.COLOR.line);
        strokeWeight(1);
        Iso.poly(top.map(q => ({ x: mid.x + (q.x - mid.x) * 0.72, y: mid.y + (q.y - mid.y) * 0.72 })));
      } else if (obj.type === 'blanket') {
        this.drawBlanketLines(f.top, GameState.cleaning[obj.id]);
      }
      this.drawTag(Objects.tagRect(obj, b), this.label(obj), { bold: obj.type === 'item', weight: opts.hover ? 2.5 : 1.2 });
    }
    pop();
    if (debug) {
      UI.drawDebugOutline(Objects.outline(obj),
        obj.id + (obj.type === 'item' ? ' ' + def.category : '') + (obj.type === 'photo' ? ' ' + def.kind : ''));
    }
  },

  // 이불 윗면의 줄. 구겨진 동안은 비스듬한 주름을, 다 갠 뒤에는 접힌 금 두 줄을 긋는다.
  drawBlanketLines(top, st) {
    const lerpPt = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    push();
    stroke(...UI.COLOR.line);
    strokeWeight(1);
    if (st.done) {
      for (const t of [0.34, 0.67]) {
        const a = lerpPt(top[0], top[3], t);
        const b = lerpPt(top[1], top[2], t);
        line(a.x, a.y, b.x, b.y);
      }
    } else {
      const folds = [[0.2, 0.15, 0.45, 0.3], [0.55, 0.2, 0.8, 0.42], [0.3, 0.6, 0.6, 0.78]];
      for (const [u0, v0, u1, v1] of folds.slice(st.strokes)) {
        const at = (u, v) => lerpPt(lerpPt(top[0], top[1], u), lerpPt(top[3], top[2], u), v);
        const a = at(u0, v0);
        const b = at(u1, v1);
        line(a.x, a.y, b.x, b.y);
      }
    }
    pop();
  },

  // 블록 위에 세운 이름표. 모서리를 둥글리지 않은 종이 쪽지다.
  drawTag(r, label, opts = {}) {
    push();
    fill(...this.TAG_FILL);
    stroke(...UI.COLOR.line);
    strokeWeight(opts.weight || 1.2);
    rect(r.x, r.y, r.w, r.h);
    noStroke();
    fill(...UI.COLOR.ink);
    textStyle(opts.bold ? BOLD : NORMAL);
    UI.drawBoxLabel(label, r);
    pop();
  },

  // 놓는 곳: 위가 열린 상자나 가구 앞면의 점선 칸. 이름표에 이름과 넣은 개수를 쓴다.
  drawSpot(obj, b, weight) {
    const o = Objects.origin(this.zoneId);
    const count = obj.def.type === 'hide' ? GameState.hiddenInZone(this.zoneId).length : GameState.cleanedCount(this.zoneId, obj.def.type);
    if (Objects.isSlot(obj)) {
      const f = Iso.faces(o, b);
      const face = b.d === 0 ? f.left : f.right;
      fill(96, 86, 74);
      stroke(...UI.COLOR.line);
      strokeWeight(weight);
      drawingContext.setLineDash([8, 6]);
      Iso.poly(face);
      drawingContext.setLineDash([]);
    } else {
      Iso.drawOpenBox(o, b, this.FILL.spot, { weight });
    }
    const r = Objects.tagRect(obj, b);
    fill(...this.TAG_FILL);
    stroke(...UI.COLOR.line);
    strokeWeight(weight === Iso.LINE ? 1.2 : 2.5);
    rect(r.x, r.y, r.w, r.h);
    noStroke();
    fill(...UI.COLOR.ink);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    UI.fitTextSize(obj.def.name, r.w - 12, 16, 12);
    text(obj.def.name, r.x + r.w / 2, r.y + 13);
    textStyle(NORMAL);
    textSize(14);
    fill(...UI.COLOR.subInk);
    text(count + '개', r.x + r.w / 2, r.y + 30);
  },

  // ALLOW_UNHIDE가 true일 때 누르면 숨긴 물건 목록이 뜨는 숨김 장소
  unhideSpotAt(p) {
    if (!CONFIG.ALLOW_UNHIDE) return null;
    const spot = Objects.at(this.zoneId, p, ['spot']);
    return spot && spot.def.type === 'hide' ? spot : null;
  },

  isClickable(m) {
    if (UI.inRect(m, UI.BACK_BUTTON)) return true;
    if (this.memo && !this.memo.detailed && UI.inRect(m, UI.MEMO_DETAIL_BUTTON)) return true;
    return Objects.thingAt(this.zoneId, m) !== null || this.unhideSpotAt(m) !== null;
  },

  isHolding() {
    return this.drag !== null;
  },

  openMemo(id) {
    if (this.memo && this.memo.id === id) return;
    this.memo = { id, detailed: false };
    GameState.stats.memoOpens += 1;
  },

  closeMemo() {
    this.memo = null;
  },

  click(p) {
    if (UI.inRect(p, UI.BACK_BUTTON)) {
      Game.goTo('room');
      return;
    }
    if (this.memo && UI.inRect(p, UI.MEMO_CARD)) {
      if (!this.memo.detailed && UI.inRect(p, UI.MEMO_DETAIL_BUTTON)) {
        this.memo.detailed = true;
        GameState.stats.detailClicks += 1;
      }
      return;
    }
    const obj = Objects.thingAt(this.zoneId, p);
    if (obj && obj.type === 'item') {
      this.openMemo(obj.id);
      return;
    }
    // 빈 곳이나 메모가 없는 물건을 누르면 카드가 닫힌다.
    this.closeMemo();
    if (obj && obj.type === 'photo') {
      // 처음 보는 사진은 회상, 본 사진은 PHOTO_REVIEW_COSTS_TIME에 따라 회상을 다시 하거나 같은 내용만 띄운다.
      const replay = !GameState.photos[obj.id].seen || CONFIG.PHOTO_REVIEW_COSTS_TIME;
      Game.openOverlay(replay ? 'flashback' : 'photoView', { photoId: obj.id });
      return;
    }
    const spot = obj ? null : this.unhideSpotAt(p);
    if (spot) Game.openOverlay('hiddenList', { zoneId: this.zoneId, spotName: spot.def.name });
  },

  // 물건 위에서 드래그를 시작하면 집어 들고, 이불이나 얼룩 위에서 시작하면 쓸기나 닦기가 된다.
  dragStart(from, p) {
    const obj = Objects.thingAt(this.zoneId, from);
    if (obj && Objects.canDrag(obj)) {
      this.closeMemo();
      const r = Objects.rect(obj);
      this.drag = { obj, offset: { x: from.x - r.x, y: from.y - r.y }, pos: { x: r.x, y: r.y } };
      this.dragMove(p, from);
      return;
    }
    if (obj) return;
    const g = Objects.at(this.zoneId, from, ['blanket', 'stain']);
    if (!g) return;
    this.closeMemo();
    this.gesture = { obj: g, start: { x: from.x, y: from.y } };
    this.dragMove(p, from);
  },

  dragMove(p, prev) {
    if (this.drag) {
      this.drag.pos = { x: p.x - this.drag.offset.x, y: p.y - this.drag.offset.y };
    } else if (this.gesture && this.gesture.obj.type === 'stain') {
      // 기준 거리에 닿으면 손을 떼기 전이라도 얼룩이 바로 사라진다.
      if (Objects.wipeStain(this.gesture.obj, prev, p)) this.gesture = null;
    }
  },

  // 끌던 물건은 받는 곳에 놓였을 때만 사라지고, 아니면 제자리로 돌아간다. 이불은 손을 뗄 때 쓸기 한 번을 판정한다.
  dragEnd(p) {
    if (this.drag) {
      Objects.drop(this.zoneId, this.drag.obj, p);
      this.drag = null;
    } else if (this.gesture) {
      if (this.gesture.obj.type === 'blanket') Objects.strokeBlanket(this.gesture.obj, this.gesture.start, p);
      this.gesture = null;
    }
  },

  // 시간이 다 되거나 전화가 와서 끊긴 드래그. 물건은 제자리로 돌아가고, 쓰던 이불은 세지 않는다.
  dragCancel() {
    this.drag = null;
    this.gesture = null;
  }
};
