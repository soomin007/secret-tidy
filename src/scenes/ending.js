// 엔딩이다. 판정한 엔딩의 label, title, scene을 먼저 보여 주고, 누르면 lines를 대사 창으로 한 줄씩 넘긴다.
// bad1이면 첫 줄 앞에 '놓친 물건: (이름)' 줄을 하나 더 보여 준다. 마지막 줄 다음의 클릭은 결과 화면으로 간다.

const SceneEnding = {
  ending: null,
  result: null,     // 결과 화면에 넘길 점수 계산 결과
  lines: [],
  phase: 'card',    // 'card' 제목 화면, 'lines' 대사
  index: 0,

  enter(params) {
    this.ending = ENDINGS.find(e => e.id === params.endingId);
    this.result = params.result;
    this.lines = this.ending.lines.slice();
    if (params.missedName) this.lines.unshift({ speaker: '', text: '놓친 물건: ' + params.missedName, strong: true });
    this.phase = 'card';
    this.index = 0;
  },

  update() {},

  draw() {
    background(...UI.COLOR.dark);
    const e = this.ending;
    noStroke();
    textAlign(CENTER, CENTER);
    if (this.phase === 'card') {
      fill(178, 171, 160);
      textStyle(BOLD);
      textSize(24);
      text(e.label, UI.W / 2, 230);
      fill(250, 247, 240);
      const fit = UI.fitLines(e.title, 1100, 2, 44, 28);
      textSize(fit.size);
      UI.drawLines(fit.lines, UI.W / 2, 300 - (fit.lines.length - 1) * fit.size * 0.7, fit.size * 1.4, CENTER);
      fill(178, 171, 160);
      textStyle(NORMAL);
      textSize(22);
      textAlign(CENTER, CENTER);
      text(e.scene, UI.W / 2, 420);
      fill(120, 114, 106);
      triangle(UI.W / 2 - 9, 500, UI.W / 2 + 9, 500, UI.W / 2, 511);
      return;
    }
    // 대사를 넘기는 동안에도 어느 엔딩인지 위쪽에 작게 남겨 둔다.
    fill(178, 171, 160);
    textStyle(BOLD);
    textSize(20);
    textAlign(LEFT, TOP);
    text(e.label + '  ' + e.title, 40, 36);
    textStyle(NORMAL);
    textSize(17);
    text(e.scene, 40, 70);
    UI.drawDialogue(this.lines[this.index], { more: true });
  },

  isClickable() {
    return true;
  },

  click() {
    if (this.phase === 'card') {
      this.phase = 'lines';
      return;
    }
    this.index += 1;
    if (this.index >= this.lines.length) Game.goTo('result', { result: this.result, endingId: this.ending.id });
  }
};
