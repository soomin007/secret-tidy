// 마우스 입력을 클릭과 드래그로 나눈다.
// 누른 뒤 DRAG_THRESHOLD 이상 움직이면 드래그, 그 전에 떼면 클릭이다. 거리는 1280×720 논리 좌표로 잰다.
// 버튼은 클릭에만 반응하므로, 무언가를 드래그하는 동안에는 버튼이 눌리지 않는다.

const Pointer = {
  DRAG_THRESHOLD: 8,
  state: 'idle',   // 'idle' 손 뗌, 'pressed' 누름, 'dragging' 드래그 중, 'canceled' 취소되어 손 떼기를 기다림
  handler: null,   // 누를 때 입력을 받던 장면이나 겹친 창
  start: null,     // 누른 점
  last: null,      // 마지막으로 움직인 점

  reset() {
    this.state = 'idle';
    this.handler = null;
    this.start = null;
    this.last = null;
  },

  // handler는 click(p), dragStart(from, p), dragMove(p, prev), dragEnd(p), dragCancel() 가운데 필요한 것만 가진다.
  press(p, handler) {
    this.state = 'pressed';
    this.handler = handler;
    this.start = { x: p.x, y: p.y };
    this.last = { x: p.x, y: p.y };
  },

  move(p) {
    const h = this.handler;
    if (this.state === 'pressed') {
      if (Math.hypot(p.x - this.start.x, p.y - this.start.y) < this.DRAG_THRESHOLD) return;
      this.state = 'dragging';
      if (h.dragStart) h.dragStart(this.start, p);
    } else if (this.state === 'dragging') {
      if (h.dragMove) h.dragMove(p, this.last);
    } else {
      return;
    }
    this.last = { x: p.x, y: p.y };
  },

  // 클릭은 누른 점을 기준으로 판정한다. 떼는 사이에 조금 움직였어도 누른 것을 누른 것으로 본다.
  release(p) {
    const state = this.state;
    const h = this.handler;
    const start = this.start;
    this.reset();
    if (state === 'pressed' && h.click) h.click(start);
    else if (state === 'dragging' && h.dragEnd) h.dragEnd(p);
  },

  // 시간이 다 되거나 전화가 올 때처럼 누르던 동작을 끊는다. 드래그하던 것은 제자리로 돌아가고, 손을 뗄 때까지 입력을 받지 않는다.
  cancel() {
    if (this.state === 'dragging' && this.handler.dragCancel) this.handler.dragCancel();
    if (this.state === 'pressed' || this.state === 'dragging') this.state = 'canceled';
  },

  isDragging() {
    return this.state === 'dragging';
  },

  // 마우스 버튼을 누르고 있는 동안(취소된 뒤 손 떼기를 기다리는 때도 포함) true
  isDown() {
    return this.state !== 'idle';
  }
};

// 근접 컷에 놓이는 것들이다. 데이터(ITEMS, PHOTOS, CLEANING, DROP_SPOTS)와 자리(LAYOUT.zones)를 하나로 묶는다.
// type: 'item' 판정 물건, 'photo' 사진, 'trash' 쓰레기, 'laundry' 빨래, 'blanket' 이불, 'stain' 얼룩, 'spot' 놓는 곳
// 그리는 순서는 놓는 곳, 이불과 얼룩, 나머지 물건이고, 누른 곳을 찾을 때는 그 반대로 위에 그린 것부터 본다.
// 그래서 이불이나 얼룩 위에 다른 물건이 겹쳐 있으면 물건의 클릭과 드래그가 먼저다.

const Objects = {
  byZone: null,   // 구역 id → 그리는 순서대로 늘어놓은 목록
  byId: null,

  build() {
    this.byZone = {};
    this.byId = {};
    for (const zone of Object.keys(LAYOUT.zones)) {
      const make = (id, type, def) => {
        const obj = { id, type, zone, def, base: LAYOUT.zones[zone][id] };
        this.byId[id] = obj;
        return obj;
      };
      const list = [];
      for (const s of DROP_SPOTS.filter(s => s.zone === zone)) list.push(make(s.id, 'spot', s));
      for (const c of CLEANING.filter(c => c.zone === zone && (c.kind === 'blanket' || c.kind === 'stain'))) list.push(make(c.id, c.kind, c));
      for (const c of CLEANING.filter(c => c.zone === zone && (c.kind === 'trash' || c.kind === 'laundry'))) list.push(make(c.id, c.kind, c));
      for (const p of PHOTOS.filter(p => p.zone === zone)) list.push(make(p.id, 'photo', p));
      for (const it of ITEMS.filter(it => it.zone === zone)) list.push(make(it.id, 'item', it));
      this.byZone[zone] = list;
    }
  },

  inZone(zoneId) {
    if (!this.byZone) this.build();
    return this.byZone[zoneId];
  },

  get(id) {
    if (!this.byId) this.build();
    return this.byId[id];
  },

  // 화면에 그릴지. 숨긴 판정 물건과 처리한 쓰레기, 빨래, 다 닦은 얼룩은 사라진다. 다 갠 이불은 접힌 모양으로 남는다.
  isVisible(obj) {
    if (obj.type === 'item') return !GameState.isHidden(obj.id);
    if (obj.type === 'trash' || obj.type === 'laundry' || obj.type === 'stain') return !GameState.cleaning[obj.id].done;
    return true;
  },

  // 지금 차지하는 사각형. 이불은 쓸 때마다 아래쪽 모서리는 그대로 두고 높이가 줄어든다.
  rect(obj) {
    const b = obj.base;
    if (obj.type === 'blanket') {
      const ratio = Gestures.foldedHeightRatio(GameState.cleaning[obj.id].strokes, CONFIG);
      const h = b.h * ratio;
      return { x: b.x, y: b.y + b.h - h, w: b.w, h };
    }
    return { x: b.x, y: b.y, w: b.w, h: b.h };
  },

  // 점이 물건 안에 있는지. 얼룩은 원이라서 사각형 모서리는 빼고 본다.
  contains(obj, p) {
    const r = this.rect(obj);
    if (obj.type === 'stain') {
      const rx = r.w / 2;
      const ry = r.h / 2;
      const dx = (p.x - (r.x + rx)) / rx;
      const dy = (p.y - (r.y + ry)) / ry;
      return dx * dx + dy * dy <= 1;
    }
    return UI.inRect(p, r);
  },

  // 점 아래에 있는 것 가운데 위에 그린 것. types를 주면 그 종류만 본다.
  at(zoneId, p, types) {
    const list = this.inZone(zoneId);
    for (let i = list.length - 1; i >= 0; i--) {
      const obj = list[i];
      if (types && !types.includes(obj.type)) continue;
      if (this.isVisible(obj) && this.contains(obj, p)) return obj;
    }
    return null;
  },

  // 클릭이나 드래그를 받는 물건(판정 물건, 사진, 쓰레기, 빨래)
  thingAt(zoneId, p) {
    return this.at(zoneId, p, ['item', 'photo', 'trash', 'laundry']);
  },

  canDrag(obj) {
    return obj.type === 'item' || obj.type === 'trash' || obj.type === 'laundry';
  },

  // 놓는 곳이 그 물건을 받는지. 숨김 장소는 분류와 관계없이 판정 물건을 받고, 휴지통은 쓰레기, 빨래 바구니는 빨래만 받는다.
  accepts(spot, obj) {
    if (spot.def.type === 'hide') return obj.type === 'item';
    return spot.def.type === obj.type;
  },

  // 끌던 물건을 p에 놓는다. 받는 곳이면 숨기거나 치운 것으로 처리하고 그곳을 돌려준다. 아니면 null이고 물건은 제자리로 돌아간다.
  drop(zoneId, obj, p) {
    const spot = this.at(zoneId, p, ['spot']);
    if (!spot || !this.accepts(spot, obj)) return null;
    if (obj.type === 'item') GameState.hide(obj.id, zoneId);
    else GameState.finishCleaning(obj.id);
    return spot;
  },

  // 이불을 한 번 쓴 손짓(누른 점 start에서 뗀 점 end까지)을 센다. 쓸기로 인정되면 true다.
  strokeBlanket(obj, start, end) {
    const st = GameState.cleaning[obj.id];
    if (st.done || !Gestures.isBlanketStroke(start, end, obj.base.w, CONFIG)) return false;
    st.strokes += 1;
    if (st.strokes >= CONFIG.BLANKET_STROKES) GameState.finishCleaning(obj.id);
    return true;
  },

  // 얼룩 위에서 prev에서 cur로 움직인 거리를 얼룩 안에서만 더한다. 다 닦이면 true다.
  wipeStain(obj, prev, cur) {
    const st = GameState.cleaning[obj.id];
    if (st.done) return true;
    st.wiped += Gestures.wipeSegment(prev, cur, q => this.contains(obj, q));
    if (Gestures.wipeProgress(st.wiped, CONFIG) >= 1) GameState.finishCleaning(obj.id);
    return st.done;
  }
};
