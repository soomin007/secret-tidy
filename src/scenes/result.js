// 결과 장면이다. 시간이 다 되거나 "문 열어 주기"를 확정하면 오고, "다시 하기"를 누르면 모든 상태를 처음으로 되돌린다.
// 엔딩 이름과 한 줄 문구, 점수 내역과 합계, 남은 시간, 숨기지 못한 물건과 잘못 숨긴 물건 목록을 보여 준다.
// 목록은 플레이테스트 관찰용으로 일부러 자세히 보여 준다. 디버그 표시(D)를 켜면 목록 대신 플레이 기록이 보인다.

const SceneResult = {
  RETRY_BUTTON: { x: 540, y: 610, w: 200, h: 64, label: '다시 하기' },
  SCORE_PANEL: { x: 90, y: 215, w: 520 },
  LIST_PANEL: { x: 670, y: 215, w: 520 },

  REASON_TEXT: {
    timeout: '시간이 다 됐다',
    door: '문을 열어 주었다',
    debug: '디버그 키 E로 끝냈다'
  },

  reason: '',
  result: null,
  playSummary: null,

  enter(params) {
    this.reason = params.reason;
    this.result = params.result;
    this.playSummary = PlayLog.summarize(PlayLog.events, ItemManager.snapshot(), ItemManager.coverSnapshot(), params.result, CONFIG);
  },

  update() {},

  draw(m) {
    const r = this.result;
    noStroke();
    fill(240, 237, 231);
    rect(0, 0, UI.W, UI.H);

    const ending = ENDINGS[r.ending];
    textAlign(CENTER, CENTER);
    fill(...UI.COLOR.ink);
    textStyle(BOLD);
    textSize(46);
    text(ending.name, UI.W / 2, 70);
    textStyle(NORMAL);
    textSize(21);
    fill(...UI.COLOR.subInk);
    text(ending.line, UI.W / 2, 122);

    if (r.questionItem) this.drawQuestionItem(r.questionItem);

    const panelBottom = this.drawScores(r);
    if (Game.debugView && this.playSummary) this.drawPlayLog(this.playSummary, panelBottom);
    else this.drawLists(r, panelBottom);

    UI.drawButton(this.RETRY_BUTTON, { hover: this.isClickable(m), textSize: 22 });
  },

  // 질문 엔딩: 애인이 집어 든 물건 이름을 보여 준다.
  drawQuestionItem(item) {
    push();
    const label = '애인이 집어 든 물건';
    textStyle(NORMAL);
    textSize(17);
    const labelW = textWidth(label);
    textStyle(BOLD);
    textSize(21);
    const nameW = textWidth(item.name);
    const w = labelW + nameW + 64;
    const x = UI.W / 2 - w / 2;
    fill(255);
    stroke(...UI.COLOR.warning);
    strokeWeight(2);
    rect(x, 150, w, 44, 22);
    noStroke();
    textAlign(LEFT, CENTER);
    textStyle(NORMAL);
    textSize(17);
    fill(...UI.COLOR.subInk);
    text(label, x + 24, 172);
    textStyle(BOLD);
    textSize(21);
    fill(...UI.COLOR.warning);
    text(item.name, x + 24 + labelW + 16, 172);
    pop();
  },

  // 점수 내역: 숨김, 청소, 시간 보너스 세 줄(감점이 있으면 한 줄 더)과 합계, 남은 시간
  drawScores(r) {
    const k = r.rates;
    const rows = [
      {
        title: '숨김 점수',
        value: r.hideScore,
        detail: '숨긴 ' + (k.photoMustHide ? '선물과 사진 ' : '선물 ') + r.hiddenCount + '개 × ' + k.hideCorrect +
          ' - 숨긴 내 물건 ' + r.wrongHiddenCount + '개 × ' + k.hideWrongPenalty
      },
      {
        title: '청소 점수',
        value: r.cleanScore,
        detail: '끝낸 청소 ' + r.cleanedCount + '건 × ' + k.cleanEach +
          ', 전체 ' + r.cleanTotal + '건 중 청소율 ' + Math.round(r.cleanRate * 100) + '%'
      },
      {
        title: '시간 보너스',
        value: r.timeBonus,
        detail: '남은 ' + r.remainingSec + '초 × ' + k.timeBonusPerSec + ', 소수점 아래 버림'
      }
    ];
    if (r.penalty > 0) {
      rows.push({
        title: '잘못 놓기 감점',
        value: -r.penalty,
        detail: '잘못 놓은 횟수 ' + r.wrongDrops + '번 × ' + k.wrongDropPenalty
      });
    }

    const p = this.SCORE_PANEL;
    const left = p.x + 24;
    const right = p.x + p.w - 24;
    const rowGap = 54;
    const firstRow = p.y + 70;
    const lineY = firstRow + rows.length * rowGap - 8;
    const totalY = lineY + 30;
    const timeY = totalY + 34;
    const bottom = timeY + 26;

    push();
    fill(255);
    stroke(...UI.COLOR.line);
    strokeWeight(1.5);
    rect(p.x, p.y, p.w, bottom - p.y, 12);

    noStroke();
    fill(...UI.COLOR.ink);
    textAlign(LEFT, CENTER);
    textStyle(BOLD);
    textSize(22);
    text('점수', left, p.y + 32);

    rows.forEach((row, i) => {
      const y = firstRow + i * rowGap;
      textAlign(LEFT, CENTER);
      textStyle(BOLD);
      textSize(19);
      fill(...UI.COLOR.ink);
      text(row.title, left, y);
      textAlign(RIGHT, CENTER);
      text(row.value + '점', right, y);
      textAlign(LEFT, CENTER);
      textStyle(NORMAL);
      fill(...UI.COLOR.subInk);
      UI.fitTextSize(row.detail, p.w - 48, 15, 11);
      text(row.detail, left, y + 22);
    });

    stroke(...UI.COLOR.line);
    strokeWeight(1);
    line(left, lineY, right, lineY);
    noStroke();
    fill(...UI.COLOR.ink);
    textStyle(BOLD);
    textSize(24);
    textAlign(LEFT, CENTER);
    text('합계', left, totalY);
    textAlign(RIGHT, CENTER);
    textSize(28);
    text(r.total + '점', right, totalY);

    textAlign(LEFT, CENTER);
    textStyle(NORMAL);
    textSize(17);
    fill(...UI.COLOR.subInk);
    text('남은 시간 ' + GameTimer.format(r.remainingSec) + ' (' + (this.REASON_TEXT[this.reason] || '') + ')', left, timeY);
    pop();
    return bottom;
  },

  // 숨기지 못한 물건과 잘못 숨긴 물건 목록. 플레이테스트에서 무엇을 놓쳤는지 보려고 이름을 모두 쓴다.
  drawLists(r, bottom) {
    const p = this.LIST_PANEL;
    push();
    fill(255);
    stroke(...UI.COLOR.line);
    strokeWeight(1.5);
    rect(p.x, p.y, p.w, bottom - p.y, 12);
    noStroke();

    const columns = [
      { title: '숨기지 못한 물건', items: r.unhidden, x: p.x + 24 },
      { title: '잘못 숨긴 물건', items: r.wrongHidden, x: p.x + p.w / 2 + 12 }
    ];
    const colW = p.w / 2 - 36;
    for (const col of columns) {
      textAlign(LEFT, CENTER);
      textStyle(BOLD);
      textSize(18);
      fill(...UI.COLOR.ink);
      text(col.title + ' ' + col.items.length + '개', col.x, p.y + 32);
      textStyle(NORMAL);
      if (col.items.length === 0) {
        textSize(17);
        fill(...UI.COLOR.subInk);
        text('없음', col.x, p.y + 72);
        continue;
      }
      col.items.forEach((item, i) => {
        fill(...UI.COLOR.ink);
        UI.fitTextSize(item.name, colW, 17, 11);
        text(item.name, col.x, p.y + 72 + i * 27);
      });
    }
    pop();
  },

  // 숨은 물건 찾기 시험에서 보는 지표. 디버그 표시를 켰을 때 목록 자리에 그린다.
  drawPlayLog(k, bottom) {
    const p = this.LIST_PANEL;
    push();
    fill(255);
    stroke(...UI.COLOR.line);
    strokeWeight(1.5);
    rect(p.x, p.y, p.w, bottom - p.y, 12);
    noStroke();
    textAlign(LEFT, CENTER);
    textStyle(BOLD);
    textSize(18);
    fill(...UI.COLOR.ink);
    text('플레이 기록', p.x + 24, p.y + 32);

    const zoneName = id => (ZONES.find(z => z.id === id) || { name: id }).name;
    const revisitText = Object.keys(k.revisitsByZone).filter(z => k.revisitsByZone[z] > 0)
      .map(z => zoneName(z) + ' ' + k.revisitsByZone[z]).join(', ');
    const u = k.untouched;
    const lines = [
      k.allClear
        ? '다 치우고 남은 시간 ' + GameTimer.format(k.remaining) + ', 물건 하나에 ' + k.budgetPerItem.toFixed(1) + '초 여유'
        : '다 치우지 못하고 끝남, 남은 시간 ' + GameTimer.format(k.remaining || 0),
      '물건 하나 찾는 데 걸린 시간 중앙값 ' + (k.findMedian === null ? '없음' : k.findMedian.toFixed(1) + '초') + ' (' + k.findCount + '개)',
      '손대지 않은 물건 ' + u.total + '개 (숨길 것 ' + u.mustHide + ', 청소 ' + u.clean + ', 그 밖 ' + u.other + ')',
      '그중 닫힌 덮개 밑에 남은 물건 ' + u.underClosedCover + '개',
      '연 덮개 ' + k.coversOpened + '/' + k.coversTotal + '개, 그중 빈 덮개 ' + k.emptyOpened + '/' + k.emptyTotal + '개',
      '구역에 다시 들어간 횟수 ' + k.revisits + '번' + (revisitText ? ' (' + revisitText + ')' : ''),
      '빈 곳 누른 횟수 ' + k.misses + '번, 회상 ' + k.flashbacks + '번'
    ];
    textStyle(NORMAL);
    lines.forEach((line, i) => {
      fill(...(i === 0 ? UI.COLOR.ink : UI.COLOR.subInk));
      UI.fitTextSize(line, p.w - 48, 16, 11);
      text(line, p.x + 24, p.y + 72 + i * 31);
    });
    pop();
  },

  isClickable(m) {
    return UI.inRect(m, this.RETRY_BUTTON);
  },

  pressed(m) {
    if (UI.inRect(m, this.RETRY_BUTTON)) Game.reset();
  },

  dragged() {},

  released() {}
};
