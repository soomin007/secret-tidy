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
// 자리는 구역 윗면의 격자 좌표 { u, v, w, d, h, z }다(src/iso.js). 화면의 윤곽은 블록을 투영한 육각형과
// 그 위에 세운 이름표를 합친 모양이고, 클릭과 놓기는 이 윤곽으로 판정한다. 얼룩은 바닥의 타원 하나다.
// 가구 앞면에 붙은 놓는 곳(서랍, 침대 밑)은 두께가 0인 블록(d나 w가 0)으로 적고, 그 면의 평행사변형이 윤곽이 된다.

const Objects = {
  TAG_H: 42,        // 이름표 높이. 16px 글자 두 줄(줄 간격 UI.LABEL_LEADING)이 들어간다
  TAG_MIN_W: 96,    // 이름표 폭은 블록의 화면 폭(w + d)을 따르되 이 범위 안에 둔다
  TAG_MAX_W: 170,
  SLOT_TAG_W: 140,  // 가구 앞면 칸의 이름표 폭
  TAG_OVERLAP: 12,  // 이름표 아래 끝이 블록 윗면의 가장 안쪽 꼭짓점보다 내려오는 길이. 윗면은 거의 다 보인다
  BIG_TOP: 300,     // 화면 폭이 이보다 넓은 블록(이불)은 이름표를 윗면 가운데에 세운다

  byZone: null,   // 구역 id → 그리는 순서대로 늘어놓은 목록
  byId: null,

  build() {
    this.byZone = {};
    this.byId = {};
    for (const zone of Object.keys(LAYOUT.zones)) {
      const make = (id, type, def) => {
        const obj = { id, type, zone, def, spec: LAYOUT.zones[zone][id] };
        // 처음 자리의 감싸는 사각형. 끌던 물건이 제자리로 돌아왔는지 볼 때와 이불 폭의 기준으로 쓴다.
        obj.base = Iso.bbox(this.outline(obj, 0));
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

  // 구역 윗면의 원점(u = v = z = 0인 점)의 화면 좌표
  origin(zoneId) {
    return LAYOUT.surfaces[zoneId].o;
  },

  // 지금의 블록. 구겨진 이불은 쓸 때마다 두께(h)가 줄어 다 개면 처음의 FOLDED_HEIGHT만 남는다.
  // strokes를 주면 그 횟수만큼 쓴 이불로 계산한다.
  block(obj, strokes) {
    const s = obj.spec;
    if (obj.type !== 'blanket') return s;
    const n = strokes === undefined ? GameState.cleaning[obj.id].strokes : strokes;
    return Object.assign({}, s, { h: s.h * Gestures.foldedHeightRatio(n, CONFIG) });
  },

  isSlot(obj) {
    return obj.spec.w === 0 || obj.spec.d === 0;
  },

  // 이름표 자리. 물건은 블록 바로 위에 세워 윗면 안쪽 끝만 조금 가리고, 이불처럼 큰 블록은 윗면 가운데에 둔다.
  // 열린 상자는 앞쪽 모서리에, 가구 앞면의 칸은 그 가운데에 붙인다.
  // 얼룩은 이름표 없이 타원 안에 이름을 쓰므로, 타원에 들어가는 가장 큰 사각형을 돌려준다.
  tagRect(obj, b) {
    b = b || this.block(obj);
    const o = this.origin(obj.zone);
    if (obj.type === 'stain') {
      const e = Iso.ellipse(o, b);
      return { x: e.x - e.a / Math.SQRT2, y: e.y - e.b / Math.SQRT2, w: e.a * Math.SQRT2, h: e.b * Math.SQRT2 };
    }
    let tw = Math.max(this.TAG_MIN_W, Math.min(this.TAG_MAX_W, b.w + b.d));
    let c;
    if (obj.type === 'spot') {
      const f = Iso.faces(o, b);
      if (this.isSlot(obj)) {
        const face = b.d === 0 ? f.left : f.right;
        c = { x: face.reduce((s, q) => s + q.x, 0) / 4, y: face.reduce((s, q) => s + q.y, 0) / 4 };
        tw = this.SLOT_TAG_W;
      } else {
        c = { x: f.left[1].x, y: (f.left[1].y + f.left[2].y) / 2 };
      }
      return { x: c.x - tw / 2, y: c.y - this.TAG_H / 2, w: tw, h: this.TAG_H };
    }
    c = Iso.topCenter(o, b);
    if (b.w + b.d > this.BIG_TOP) return { x: c.x - tw / 2, y: c.y - this.TAG_H / 2, w: tw, h: this.TAG_H };
    const back = Iso.faces(o, b).top[0];
    return { x: c.x - tw / 2, y: back.y + this.TAG_OVERLAP - this.TAG_H, w: tw, h: this.TAG_H };
  },

  // 화면의 윤곽(볼록 다각형 목록). strokes는 block()과 같다.
  outline(obj, strokes) {
    const b = this.block(obj, strokes);
    const o = this.origin(obj.zone);
    if (obj.type === 'stain') return [Iso.ellipsePoly(Iso.ellipse(o, b))];
    const f = Iso.faces(o, b);
    const body = this.isSlot(obj) ? (b.d === 0 ? f.left : f.right) : f.hull;
    return [body, Iso.rectPoly(this.tagRect(obj, b))];
  },

  // 지금 윤곽을 감싸는 사각형. 이불은 쓸 때마다 두께가 줄어 사각형 높이도 준다.
  rect(obj) {
    return Iso.bbox(this.outline(obj));
  },

  // 점이 물건의 윤곽 안에 있는지. 얼룩은 타원으로 본다.
  contains(obj, p) {
    if (obj.type === 'stain') return Iso.inEllipse(Iso.ellipse(this.origin(obj.zone), this.block(obj)), p);
    return this.outline(obj).some(poly => Iso.inPoly(p, poly));
  },

  // 고양이가 이 물건 옆에 앉을 자리(원의 가운데). 블록 오른쪽 아래 모서리의 바로 오른쪽이다.
  catSpot(obj) {
    const f = Iso.faces(this.origin(obj.zone), this.block(obj));
    return { x: f.right[2].x + 12, y: f.right[2].y };
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
  // 기준 폭은 처음 자리의 화면 폭(base.w)이다. 이불은 두께만 줄어서 폭이 바뀌지 않는다.
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
