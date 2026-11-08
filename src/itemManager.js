// 물건 서른 개의 상태(방에 있는지, 어디에 넣었는지, 제스처 진행도, 회상 여부)를 관리한다.
// 마우스를 누른 곳의 물건 찾기, 집어서 끌기, 놓기 판정, 제스처 입력 누적도 여기서 한다.
// 그리기는 하지 않는다. 화면은 근접 컷 장면(scenes/zone.js)이 이 상태를 읽어서 그린다.

const ItemManager = {
  // ITEMS와 같은 순서로 물건마다 하나씩 둔다.
  // status: 'present'(아직 방에 있음), 'stored'(드롭 대상에 넣음), 'done'(이불을 다 개거나 얼룩을 다 닦음)
  states: [],
  targetCounts: {},   // '장소:대상종류' → 넣은 개수. 예: 'closet:hide' → 2
  wrongDrops: 0,      // 받지 않는 대상에 놓은 횟수
  // 지금 누르고 있는 동작. 종류에 따라 담는 값이 다르다.
  // { mode: 'drag', item, offset, pos } 집어서 끄는 중
  // { mode: 'fold', item, start }        이불 위에서 누른 채 쓰는 중
  // { mode: 'wipe', item, last }         얼룩 위에서 누른 채 문지르는 중
  press: null,

  reset() {
    this.states = ITEMS.map(def => ({
      def,
      status: 'present',
      storedIn: null,
      foldStrokes: 0,     // 이불을 쓴 횟수
      wipeDistance: 0,    // 얼룩 위에서 문지른 누적 거리(논리 좌표 px)
      flashbackPending: def.kind === 'photo'   // 사진: 다음에 누르면 회상이 재생되는지
    }));
    this.targetCounts = {};
    for (const zone of ZONES) {
      for (const target of zone.targets) this.targetCounts[zone.id + ':' + target.type] = 0;
    }
    this.wrongDrops = 0;
    this.press = null;
  },

  statesIn(zoneId) {
    return this.states.filter(s => s.def.zone === zoneId);
  },

  findState(id) {
    return this.states.find(s => s.def.id === id) || null;
  },

  // 화면에 그릴 물건인지. 다 갠 이불은 접힌 모양으로 남고, 다 닦은 얼룩은 사라진다.
  isVisible(s) {
    return s.status === 'present' || (s.status === 'done' && s.def.kind === 'blanket');
  },

  // 물건이 지금 차지하는 사각형. 이불은 쓸 때마다 높이가 줄어든다(아래쪽 모서리는 그대로).
  currentRect(s) {
    const d = s.def;
    if (d.kind === 'blanket') {
      const ratio = Gestures.foldedHeightRatio(this.foldProgress(s), CONFIG);
      const h = d.h * ratio;
      return { x: d.x, y: d.y + d.h - h, w: d.w, h };
    }
    return { x: d.x, y: d.y, w: d.w, h: d.h };
  },

  foldProgress(s) {
    return Gestures.foldProgress(s.foldStrokes, CONFIG);
  },

  wipeProgress(s) {
    return Gestures.wipeProgress(s.wipeDistance, CONFIG);
  },

  // 마우스 아래에 있는, 아직 처리하지 않은 물건. 나중에 그린 것(데이터 뒤쪽)이 위에 있으므로 뒤에서부터 찾는다.
  itemAt(zoneId, p) {
    for (let i = this.states.length - 1; i >= 0; i--) {
      const s = this.states[i];
      if (s.def.zone !== zoneId || s.status !== 'present') continue;
      if (UI.inRect(p, this.currentRect(s))) return s;
    }
    return null;
  },

  targetAt(zoneId, p) {
    const zone = ZONES.find(z => z.id === zoneId);
    return zone.targets.find(t => UI.inRect(p, t)) || null;
  },

  targetCount(zoneId, type) {
    return this.targetCounts[zoneId + ':' + type] || 0;
  },

  accepts(target, kind) {
    return (CONFIG.TARGET_ACCEPTS[target.type] || []).includes(kind);
  },

  // 마우스를 눌렀을 때 부른다. 무엇이 시작됐는지 { action, item }으로 돌려주고, 아무것도 없으면 null이다.
  // action: 'drag'(집기), 'fold'(이불 쓸기), 'wipe'(얼룩 닦기), 'flashback'(사진 회상)
  pressAt(zoneId, p) {
    this.press = null;
    const s = this.itemAt(zoneId, p);
    if (!s) return null;
    if (s.def.kind === 'photo' && s.flashbackPending) {
      // 사진을 처음 누르면 집기 대신 회상이 시작되고, 사진은 제자리에 남는다.
      s.flashbackPending = false;
      return { action: 'flashback', item: s };
    }
    if (s.def.kind === 'blanket') {
      this.press = { mode: 'fold', item: s, start: { x: p.x, y: p.y } };
      return { action: 'fold', item: s };
    }
    if (s.def.kind === 'stain') {
      this.press = { mode: 'wipe', item: s, last: { x: p.x, y: p.y } };
      return { action: 'wipe', item: s };
    }
    this.press = {
      mode: 'drag',
      item: s,
      offset: { x: p.x - s.def.x, y: p.y - s.def.y },
      pos: { x: s.def.x, y: s.def.y }
    };
    return { action: 'drag', item: s };
  },

  // 누른 채 움직일 때 부른다. 들고 있는 물건은 커서를 따라오고, 얼룩은 문지른 거리가 쌓인다.
  moveTo(p) {
    const press = this.press;
    if (!press) return;
    if (press.mode === 'drag') {
      press.pos = { x: p.x - press.offset.x, y: p.y - press.offset.y };
    } else if (press.mode === 'wipe') {
      const s = press.item;
      s.wipeDistance += Gestures.wipeSegment(press.last, p, this.currentRect(s));
      press.last = { x: p.x, y: p.y };
      if (this.wipeProgress(s) >= 1) {
        // 기준 거리에 닿으면 얼룩이 사라진다. 손을 떼기 전이라도 바로 끝낸다.
        s.status = 'done';
        this.press = null;
      }
    }
  },

  // 마우스를 뗐을 때 부른다. 무슨 일이 있었는지 돌려준다.
  // 끌기: { result: 'stored' | 'rejected' | 'returned', item, target }
  // 이불: { result: 'fold', item, counted, done }
  releaseAt(zoneId, p) {
    const press = this.press;
    this.press = null;
    if (!press) return null;

    if (press.mode === 'fold') {
      const s = press.item;
      const counted = Gestures.isFoldStroke(press.start, p, s.def.w, CONFIG);
      if (counted) {
        s.foldStrokes += 1;
        if (this.foldProgress(s) >= 1) s.status = 'done';
      }
      return { result: 'fold', item: s, counted, done: s.status === 'done' };
    }
    if (press.mode !== 'drag') return null;

    const s = press.item;
    const target = this.targetAt(zoneId, p);
    if (!target || !this.accepts(target, s.def.kind)) {
      // FLASHBACK_ONCE_PER_PHOTO가 false면, 숨기지 않고 제자리로 돌아간 사진은 다음에 누를 때 회상이 다시 재생된다.
      if (s.def.kind === 'photo' && !CONFIG.FLASHBACK_ONCE_PER_PHOTO) s.flashbackPending = true;
    }
    if (!target) {
      // 드롭 대상 밖에서 놓으면 제자리로 돌아간다. 내 물건은 이렇게 '그대로 두기'가 된다.
      return { result: 'returned', item: s, target: null };
    }
    if (!this.accepts(target, s.def.kind)) {
      // 받지 않는 대상이면 제자리로 돌아가고, 잘못 놓은 횟수가 감점으로 들어간다.
      this.wrongDrops += 1;
      return { result: 'rejected', item: s, target };
    }
    // 넣은 물건은 다시 꺼낼 수 없다.
    s.status = 'stored';
    s.storedIn = target.type;
    this.targetCounts[zoneId + ':' + target.type] += 1;
    return { result: 'stored', item: s, target };
  },

  // 시간이 다 됐을 때처럼 누르던 동작을 그대로 버린다. 들고 있던 물건은 제자리로 돌아간 것으로 친다.
  cancelPress() {
    this.press = null;
  },

  // 들고 있는 물건(없으면 null)
  held() {
    return this.press && this.press.mode === 'drag' ? this.press.item : null;
  },

  heldRect() {
    const s = this.held();
    if (!s) return null;
    return { x: this.press.pos.x, y: this.press.pos.y, w: s.def.w, h: s.def.h };
  },

  // 마우스를 누른 채 무언가를 하고 있는지. 이 동안에는 버튼이 반응하지 않는다.
  isBusy() {
    return this.press !== null;
  },

  // 점수 계산에 넘길 상태 목록. p5나 화면과 상관없는 평범한 값만 담는다.
  snapshot() {
    return this.states.map(s => ({
      id: s.def.id,
      zone: s.def.zone,
      kind: s.def.kind,
      name: s.def.name,
      status: s.status,
      storedIn: s.storedIn
    }));
  }
};
