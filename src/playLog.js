// 플레이테스트에서 물건을 찾는 데 든 시간을 보려고 남기는 기록이다.
// 구역에 들어간 때, 덮개를 연 때, 물건을 처음 집은 때, 빈 곳을 누른 때를 타이머가 흐른 시간과 함께 쌓는다.
// summarize()는 p5를 쓰지 않는 계산이라 브라우저 밖에서도 시험할 수 있다.

const PlayLog = {
  events: [],
  touched: {},   // 물건 id → true. 처음 집었을 때만 기록하려고 둔다

  reset() {
    this.events = [];
    this.touched = {};
  },

  // t는 타이머가 실제로 흐른 시간(초)이다. 개발용 일시정지 중에는 늘지 않는다.
  add(type, data = {}) {
    this.events.push(Object.assign({ type, t: GameTimer.elapsed }, data));
  },

  // 물건을 처음 집었을 때만 남긴다. 사진은 회상이 시작된 때가 처음 집은 때다.
  touch(s) {
    if (this.touched[s.def.id]) return;
    this.touched[s.def.id] = true;
    this.add('touch', { zone: s.def.zone, item: s.def.id });
  },

  // 기록을 지표로 바꾼다. items는 ItemManager.snapshot(), covers는 ItemManager.coverSnapshot(),
  // result는 Scoring.compute()의 결과다.
  summarize(events, items, covers, result, cfg) {
    const findTimes = [];
    const enters = {};
    // 찾기를 시작한 때. 구역에 들어오거나, 회상에서 돌아오거나, 앞 물건을 다 다루고 손을 뗀 때다.
    let mark = null;
    let misses = 0;
    let flashbacks = 0;
    let finish = null;
    const touched = new Set();
    for (const e of events) {
      if (e.type === 'enter') {
        enters[e.zone] = (enters[e.zone] || 0) + 1;
        mark = e.t;
      } else if (e.type === 'resume') {
        flashbacks += 1;
        mark = e.t;
      } else if (e.type === 'release') {
        mark = e.t;
      } else if (e.type === 'touch') {
        touched.add(e.item);
        if (mark !== null) findTimes.push(e.t - mark);
        mark = null;
      } else if (e.type === 'miss') {
        misses += 1;
      } else if (e.type === 'finish') {
        finish = e;
      }
    }

    const underClosed = new Set();
    for (const c of covers) if (!c.open) c.hides.forEach(id => underClosed.add(id));
    const untouched = { total: 0, mustHide: 0, clean: 0, other: 0, underClosedCover: 0 };
    for (const it of items) {
      if (touched.has(it.id)) continue;
      untouched.total += 1;
      if (Scoring.mustHide(it.kind, cfg)) untouched.mustHide += 1;
      else if (Scoring.isCleanKind(it.kind)) untouched.clean += 1;
      else untouched.other += 1;
      if (underClosed.has(it.id)) untouched.underClosedCover += 1;
    }

    const revisitsByZone = {};
    let revisits = 0;
    for (const zone of Object.keys(enters)) {
      revisitsByZone[zone] = enters[zone] - 1;
      revisits += enters[zone] - 1;
    }

    const remaining = finish ? finish.remaining : null;
    const allClear = result.unhidden.length === 0 && result.cleanedCount === result.cleanTotal;
    return {
      remaining,
      allClear,
      // 다 치우고 남은 시간을 물건 수로 나눈 값. 최종 그림에서 물건 하나가 눈에 띄기까지 써도 되는 시간이다.
      budgetPerItem: allClear && remaining !== null ? remaining / items.length : null,
      findCount: findTimes.length,
      findMedian: this.median(findTimes),
      untouched,
      revisits,
      revisitsByZone,
      coversOpened: covers.filter(c => c.open).length,
      coversTotal: covers.length,
      emptyOpened: covers.filter(c => c.open && c.hides.length === 0).length,
      emptyTotal: covers.filter(c => c.hides.length === 0).length,
      misses,
      flashbacks
    };
  },

  median(list) {
    if (!list.length) return null;
    const sorted = list.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
};
