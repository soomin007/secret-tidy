// 근접 컷이다. 장면 하나를 zoneId만 바꿔 옷장, 책상, 침대, 바닥 네 구역에 다시 쓴다.
// 왼쪽 위에 구역 이름과 [방 전체로] 버튼이 있고, 판정 물건, 사진, 청소 물건, 놓는 곳을 data/layout.js의 자리에 그린다.
// 판정 물건을 클릭하면 화면 아래에 메모 카드가 열린다. 드래그한 물건은 놓을 곳이 없으면 제자리로 돌아간다.

const SceneZone = {
  // 판정 물건(ex, current, mine)은 모두 같은 색과 모양이다. 메모를 읽어야만 구분할 수 있다는 것이 이 게임의 핵심 판단이다.
  // 디버그 표시(D)를 켰을 때만 분류별 색을 쓴다.
  FILL: {
    item: [252, 250, 246],
    photo: [246, 243, 236],
    trash: [229, 215, 186],
    laundry: [204, 217, 232],
    blanket: [214, 224, 204],
    stain: [128, 98, 62]
  },
  DEBUG_FILL: {
    ex: [246, 186, 180],
    current: [184, 206, 242],
    mine: [188, 226, 188]
  },

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

  // 이 구역에 배치된 고양이의 자리. 아직 숨기지 않은 mine 물건의 오른쪽 위 모서리를 CAT_MOVE_SEC마다 차례로 옮겨 다니고,
  // 그런 물건이 없으면 LAYOUT.catRest에 앉는다. 고양이가 배치되지 않은 구역이면 null이다.
  // 타이머가 흐른 시간으로 자리를 정하므로, 일시정지(P) 중에는 고양이도 멈춘다.
  catPosition() {
    if (GameState.cat.zone !== this.zoneId) return null;
    const targets = GameState.catTargets(this.zoneId);
    if (!targets.length) return Object.assign({ itemId: null }, LAYOUT.catRest[this.zoneId]);
    const it = targets[Math.floor(GameTimer.elapsed / this.CAT_MOVE_SEC) % targets.length];
    const r = Objects.rect(Objects.get(it.id));
    return { x: r.x + r.w, y: r.y, itemId: it.id };
  },

  // 물건 상자에 쓰는 이름
  label(obj) {
    if (obj.type === 'photo') return obj.def.title;
    return UI.plain(obj.def.name);
  },

  draw(m) {
    background(...UI.COLOR.stage);
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
      this.drawObject(obj, Objects.rect(obj), { hover: obj === hover });
    }
    const cat = this.catPosition();
    if (cat) UI.drawCat(cat.x, cat.y, this.CAT_R, false);
    // 끌고 있는 물건은 커서를 따라 맨 위에 그린다.
    if (held) {
      const r = Objects.rect(held);
      this.drawObject(held, { x: this.drag.pos.x, y: this.drag.pos.y, w: r.w, h: r.h }, { hover: true });
    }

    if (this.memo) {
      const item = Objects.get(this.memo.id).def;
      UI.drawMemoCard(item, this.memo.detailed, free && UI.inRect(m, UI.MEMO_DETAIL_BUTTON));
    }
  },

  // 물건 하나를 r 자리에 그린다. opts: { hover }
  drawObject(obj, r, opts = {}) {
    const debug = Game.debugView;
    const weight = opts.hover ? 4 : 2;
    push();
    stroke(...UI.COLOR.line);
    strokeWeight(weight);
    const def = obj.def;
    if (obj.type === 'spot') {
      this.drawSpot(obj, r, opts);
    } else if (obj.type === 'stain') {
      // 반투명 원. 닦을수록 옅어진다.
      const progress = Gestures.wipeProgress(GameState.cleaning[obj.id].wiped, CONFIG);
      const alpha = 160 - 130 * progress;
      fill(...this.FILL.stain, alpha);
      noStroke();
      if (opts.hover) {
        stroke(...UI.COLOR.line);
        strokeWeight(3);
      }
      ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h);
      noStroke();
      fill(255, 255, 255, 120 + alpha);
      textStyle(BOLD);
      UI.drawBoxLabel(this.label(obj), r);
    } else {
      let c = this.FILL[obj.type];
      if (debug && obj.type === 'item') c = this.DEBUG_FILL[def.category];
      if (debug && obj.type === 'photo') c = this.DEBUG_FILL[def.kind];
      fill(...c);
      rect(r.x, r.y, r.w, r.h, obj.type === 'item' ? 10 : 4);
      if (obj.type === 'photo') {
        // 사진은 이중 테두리 액자로 그린다.
        noFill();
        strokeWeight(1.5);
        rect(r.x + 7, r.y + 7, r.w - 14, r.h - 14);
      }
      noStroke();
      fill(...UI.COLOR.ink);
      textStyle(obj.type === 'item' ? BOLD : NORMAL);
      const inner = obj.type === 'photo' ? { x: r.x + 8, y: r.y + 8, w: r.w - 16, h: r.h - 16 } : r;
      UI.drawBoxLabel(this.label(obj), inner);
    }
    pop();
    if (debug) UI.drawDebugFrame(r, obj.id + (obj.type === 'item' ? ' ' + def.category : '') + (obj.type === 'photo' ? ' ' + def.kind : ''));
  },

  // 놓는 곳: 점선 테두리 상자에 이름과 넣은 개수를 쓴다.
  drawSpot(obj, r, opts) {
    const count = obj.def.type === 'hide' ? GameState.hiddenInZone(this.zoneId).length : GameState.cleanedCount(this.zoneId, obj.def.type);
    fill(255, 255, 255, 70);
    strokeWeight(opts.hover ? 4 : 2);
    drawingContext.setLineDash([8, 6]);
    rect(r.x, r.y, r.w, r.h, 4);
    drawingContext.setLineDash([]);
    noStroke();
    fill(...UI.COLOR.ink);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(18);
    text(obj.def.name, r.x + r.w / 2, r.y + r.h / 2 - 13);
    textStyle(NORMAL);
    textSize(16);
    fill(...UI.COLOR.subInk);
    text(count + '개', r.x + r.w / 2, r.y + r.h / 2 + 15);
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
