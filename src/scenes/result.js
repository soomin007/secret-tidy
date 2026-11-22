// 결과 화면이다. 왼쪽에 점수 내역, 오른쪽에 테스트용 기록(SHOW_TEST_STATS)을 두고, 같은 기록을 console에 JSON으로 남긴다.
// [다시 하기]는 모든 상태를 처음으로 되돌리고 시작 화면으로 간다.

const SceneResult = {
  RETRY_BUTTON: { x: 1040, y: 628, w: 210, h: 64, label: '다시 하기' },
  LEFT: { x: 60, w: 500 },
  RIGHT: { x: 640, labelW: 130, w: 580 },

  endingId: null,
  result: null,
  record: null,

  enter(params) {
    this.endingId = params.endingId;
    this.result = params.result;
    this.record = GameState.testRecord(this.result);
    if (CONFIG.SHOW_TEST_STATS) console.log('[테스트용 기록] ' + JSON.stringify(this.record));
  },

  update() {},

  draw(m) {
    background(...UI.COLOR.paper);
    const e = ENDINGS.find(x => x.id === this.endingId);
    noStroke();
    fill(...UI.COLOR.ink);
    textAlign(LEFT, TOP);
    textStyle(BOLD);
    textSize(30);
    text(e.label, 60, 40);
    textStyle(NORMAL);
    textSize(21);
    text(e.title, 60, 84);
    stroke(...UI.COLOR.buttonDisabled);
    strokeWeight(1.5);
    line(60, 126, UI.W - 60, 126);
    noStroke();

    this.drawScore();
    if (CONFIG.SHOW_TEST_STATS) this.drawRecord();

    UI.drawButton(this.RETRY_BUTTON, { hover: UI.inRect(m, this.RETRY_BUTTON), textSize: 22 });
  },

  // 점수 내역. 항목 이름은 왼쪽, 점수는 오른쪽에 맞추고, 그 밑에 계산에 들어간 것을 작게 쓴다.
  drawScore() {
    const r = this.result;
    const L = this.LEFT;
    const c = r.clean;
    let bonusNote = '일찍 끝내지 않음';
    if (r.early) bonusNote = CONFIG.BONUS_REQUIRES_ALL_CLEAN && !r.allClean ? '청소를 다 끝내지 않음' : '남은 ' + r.remainingSec + '초';
    const rows = [
      ['청소 점수', String(c.total),
        '이불 ' + c.blanket + ', 얼룩 ' + c.stains + ', 쓰레기 ' + c.trashCount + '개 ' + c.trash + ', 빨래 ' + c.laundryCount + '벌 ' + c.laundry +
        (CONFIG.UNPROCESSED_PENALTY ? ', 미처리 ' + c.unprocessedCount + '개 ' + c.unprocessed : '')],
      ['감점', r.penalty.total ? '-' + r.penalty.total : '0',
        '숨긴 mine ' + r.hiddenMine.length + '개, 숨긴 current ' + r.hiddenCurrent.length + '개'],
      ['시간 보너스', '+' + r.timeBonus, bonusNote],
      ['상한 적용 전', String(r.rawTotal), CONFIG.SCORE_CAP === null ? '상한 없음' : '상한 ' + CONFIG.SCORE_CAP]
    ];

    fill(...UI.COLOR.subInk);
    textStyle(BOLD);
    textSize(17);
    textAlign(LEFT, TOP);
    text('점수', L.x, 146);

    let y = 180;
    for (const [label, value, note] of rows) {
      fill(...UI.COLOR.ink);
      textStyle(NORMAL);
      textSize(20);
      textAlign(LEFT, TOP);
      text(label, L.x, y);
      textAlign(RIGHT, TOP);
      text(value, L.x + L.w, y);
      fill(...UI.COLOR.subInk);
      textAlign(LEFT, TOP);
      const fit = UI.fitLines(note, L.w, 2, 15, 12);
      textSize(fit.size);
      UI.drawLines(fit.lines, L.x, y + 30, fit.size * 1.4, LEFT);
      y += 30 + fit.lines.length * fit.size * 1.4 + 18;
    }

    stroke(...UI.COLOR.line);
    strokeWeight(1.5);
    line(L.x, y, L.x + L.w, y);
    noStroke();
    fill(...UI.COLOR.ink);
    textStyle(BOLD);
    textSize(26);
    textAlign(LEFT, TOP);
    text('최종 점수', L.x, y + 16);
    textAlign(RIGHT, TOP);
    text(String(r.total), L.x + L.w, y + 16);
  },

  // 테스트용 기록(10장). 이름 목록이 길면 글자를 줄여 정해진 줄 수 안에 넣는다.
  drawRecord() {
    const rec = this.record;
    const R = this.RIGHT;
    const list = (names, unit) => (names.length ? names.length + unit + ': ' + names.join(', ') : '없음');
    const choices = rec.callChoices.length ? rec.callChoices.map(c => c.call + ' ' + c.choice).join(', ') : '없음';
    const rows = [
      ['끝난 까닭', (rec.earlyFinish ? '일찍 끝냄' : '시간 끝') + ', 남은 시간 ' + GameTimer.format(rec.remainingSec), 1],
      ['메모 카드', '연 횟수 ' + rec.memoOpens + '번, 열린 시간 ' + rec.memoOpenSec + '초, 자세히 보기 ' + rec.detailClicks + '번', 2],
      ['쓴 시간', '회상 ' + rec.flashbackSec + '초, 통화 ' + rec.callSec + '초', 1],
      ['숨기지 못한 ex', list(rec.unhiddenEx, '개'), 5],
      ['숨긴 current', list(rec.hiddenCurrent, '개'), 3],
      ['숨긴 mine', list(rec.hiddenMine, '개'), 3],
      ['본 사진', list(rec.seenPhotos, '장'), 3],
      ['고른 선택지', choices, 2]
    ];

    fill(...UI.COLOR.subInk);
    textStyle(BOLD);
    textSize(17);
    textAlign(LEFT, TOP);
    text('테스트용 기록', R.x, 146);

    let y = 180;
    const valueW = R.w - R.labelW;
    for (const [label, value, maxLines] of rows) {
      fill(...UI.COLOR.ink);
      textStyle(BOLD);
      textSize(15);
      textAlign(LEFT, TOP);
      text(label, R.x, y + 1);
      textStyle(NORMAL);
      const fit = UI.fitLines(value, valueW, maxLines, 16, 12);
      textSize(fit.size);
      UI.drawLines(fit.lines, R.x + R.labelW, y, fit.size * 1.4, LEFT);
      y += Math.max(1, fit.lines.length) * fit.size * 1.4 + 12;
    }
  },

  isClickable(m) {
    return UI.inRect(m, this.RETRY_BUTTON);
  },

  click(p) {
    if (UI.inRect(p, this.RETRY_BUTTON)) Game.reset();
  }
};
