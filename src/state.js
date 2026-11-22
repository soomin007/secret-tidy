// 한 판의 상태와 테스트용 기록을 담는다. 다시 하기를 누르면 reset()으로 모두 처음 상태가 된다.
// p5 함수를 쓰지 않고 데이터(ITEMS, PHOTOS, CLEANING, CALLS)만 읽으므로, tools/check-scoring.js가 node에서도 그대로 불러 쓴다.

const GameState = {
  items: {},      // 판정 물건 id → { hiddenIn }. hiddenIn은 숨긴 구역 id이고, 숨기지 않았으면 null이다
  cleaning: {},   // 청소 물건 id → { done, strokes, wiped }. strokes는 이불을 쓴 횟수, wiped는 얼룩을 문지른 누적 거리
  photos: {},     // 사진 id → { seen }
  cat: null,      // { zone, placements }. zone은 배치한 구역 id이고, 배치하지 않았으면 null이다
  calls: {},      // 전화 id → { started, choice }. 전화 시간이 되면 생기고, 창이 뜨면 started, 고른 선택지의 key를 choice에 적는다
  end: null,      // 엔딩 판정을 한 순간의 { early, remainingSec }
  stats: null,    // 테스트용 기록(10장)

  reset() {
    this.items = {};
    for (const it of ITEMS) this.items[it.id] = { hiddenIn: null };
    this.cleaning = {};
    for (const c of CLEANING) this.cleaning[c.id] = { done: false, strokes: 0, wiped: 0 };
    this.photos = {};
    for (const ph of PHOTOS) this.photos[ph.id] = { seen: false };
    this.cat = { zone: null, placements: 0 };
    this.calls = {};
    this.end = null;
    this.stats = {
      memoOpens: 0,       // 메모 카드를 연 횟수
      memoOpenSec: 0,     // 메모 카드가 열려 있던 시간 합계(초)
      detailClicks: 0,    // [자세히 보기]를 누른 횟수
      flashbackSec: 0,    // 회상과 사진 다시 보기에 쓴 시간(초)
      callSec: 0          // 통화에 쓴 시간(초)
    };
  },

  // ---------- 판정 물건 ----------

  isHidden(id) {
    return this.items[id].hiddenIn !== null;
  },

  hide(id, zoneId) {
    this.items[id].hiddenIn = zoneId;
  },

  unhide(id) {
    this.items[id].hiddenIn = null;
  },

  hiddenCount() {
    return ITEMS.filter(it => this.isHidden(it.id)).length;
  },

  // 한 구역의 숨김 장소에 들어 있는 물건(번호 순)
  hiddenInZone(zoneId) {
    return ITEMS.filter(it => this.items[it.id].hiddenIn === zoneId).sort((a, b) => a.no - b.no);
  },

  // ---------- 청소 ----------

  // 쓰레기나 빨래를 통에 넣었을 때, 이불을 다 갰을 때, 얼룩을 다 닦았을 때
  finishCleaning(id) {
    this.cleaning[id].done = true;
  },

  // 한 구역에서 종류가 kind인 청소 물건 가운데 끝낸 수. 놓는 곳에 넣은 개수로 쓴다.
  cleanedCount(zoneId, kind) {
    return CLEANING.filter(c => c.zone === zoneId && c.kind === kind && this.cleaning[c.id].done).length;
  },

  // ---------- 사진 ----------

  seePhoto(id) {
    this.photos[id].seen = true;
  },

  // ---------- 고양이 ----------

  // 고양이를 더 옮길 수 있는지. CAT_MAX_PLACEMENTS가 0이면 제한이 없다.
  canMoveCat(cfg) {
    return cfg.CAT_MAX_PLACEMENTS === 0 || this.cat.placements < cfg.CAT_MAX_PLACEMENTS;
  },

  // 이미 있는 구역에 다시 놓은 것은 배치로 세지 않는다.
  placeCat(zoneId) {
    if (this.cat.zone === zoneId) return false;
    this.cat.zone = zoneId;
    this.cat.placements += 1;
    return true;
  },

  // 고양이가 돌아다닐 물건: 그 구역에서 아직 숨기지 않은 mine 물건(번호 순)
  catTargets(zoneId) {
    return ITEMS.filter(it => it.zone === zoneId && it.category === 'mine' && !this.isHidden(it.id)).sort((a, b) => a.no - b.no);
  },

  // ---------- 전화 ----------

  // 남은 시간이 at 이하가 된 전화를 오는 순서대로 적어 두고, 아직 창을 띄우지 않은 전화 목록을 돌려준다.
  dueCalls(remainingSec) {
    for (const c of CALLS) {
      if (!this.calls[c.id] && remainingSec <= c.at) this.calls[c.id] = { started: false, choice: null };
    }
    return CALLS.filter(c => this.calls[c.id] && !this.calls[c.id].started).sort((a, b) => b.at - a.at);
  },

  // ---------- 디버그 키 H, C, V ----------

  // H: ex 15개를 모두 그 구역의 숨김 장소에 숨긴 것으로 처리한다.
  debugHideAllEx() {
    for (const it of ITEMS) if (it.category === 'ex' && !this.isHidden(it.id)) this.hide(it.id, it.zone);
  },

  // C: 청소를 모두 끝낸 것으로 처리한다. 이불은 다 갠 높이로, 얼룩은 다 닦은 거리로 맞춘다.
  debugCleanAll(cfg) {
    for (const c of CLEANING) {
      const st = this.cleaning[c.id];
      st.done = true;
      if (c.kind === 'blanket') st.strokes = cfg.BLANKET_STROKES;
      if (c.kind === 'stain') st.wiped = cfg.STAIN_WIPE_DISTANCE;
    }
  },

  // V: kind가 current인 사진을 모두 본 것으로 처리한다.
  debugSeeCurrentPhotos() {
    for (const p of PHOTOS) if (p.kind === 'current') this.seePhoto(p.id);
  },

  // ---------- 엔딩과 테스트용 기록 ----------

  // 엔딩 판정을 한 순간을 적는다. early는 [준비 완료]나 디버그 키 E로 일찍 끝냈는지다.
  finish(early, remainingSec) {
    this.end = { early, remainingSec };
  },

  // 결과 화면과 console에 남길 테스트용 기록. result는 Scoring.compute의 결과다.
  testRecord(result) {
    const round = s => Math.round(s * 10) / 10;
    return {
      ending: result.ending,
      remainingSec: this.end ? this.end.remainingSec : null,
      earlyFinish: this.end ? this.end.early : null,
      memoOpens: this.stats.memoOpens,
      memoOpenSec: round(this.stats.memoOpenSec),
      detailClicks: this.stats.detailClicks,
      flashbackSec: round(this.stats.flashbackSec),
      callSec: round(this.stats.callSec),
      unhiddenEx: result.unhiddenEx.map(i => i.name),
      hiddenCurrent: result.hiddenCurrent.map(i => i.name),
      hiddenMine: result.hiddenMine.map(i => i.name),
      seenPhotos: PHOTOS.filter(p => this.photos[p.id].seen).map(p => p.title),
      callChoices: CALLS.filter(c => this.calls[c.id] && this.calls[c.id].choice).map(c => ({ call: c.title, choice: this.calls[c.id].choice })),
      score: {
        clean: result.clean.total,
        penalty: result.penalty.total,
        timeBonus: result.timeBonus,
        beforeCap: result.rawTotal,
        afterCap: result.total
      }
    };
  }
};
