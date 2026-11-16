// 인트로 장면이다. 애인에게 전화가 왔다는 문구와 대사를 띄운다.
// "통화 끊고 청소 시작" 버튼을 누르면 타이머가 시작되고 방 전체로 넘어간다.

const SceneIntro = {
  START_BUTTON: { x: 470, y: 420, w: 340, h: 76, label: '통화 끊고 청소 시작' },

  enter() {},

  update() {},

  draw(m) {
    noStroke();
    fill(...UI.COLOR.introBg);
    rect(0, 0, UI.W, UI.H);
    this.drawPhone(UI.W / 2, 112);

    textAlign(CENTER, CENTER);
    textStyle(NORMAL);
    fill(178, 171, 160);
    textSize(26);
    text('애인에게 전화가 왔다', UI.W / 2, 228);

    textStyle(BOLD);
    fill(250, 247, 240);
    textSize(40);
    text('“여기 너네 집 앞인데 잠깐 가도 돼?”', UI.W / 2, 298);

    UI.drawButton(this.START_BUTTON, { hover: this.isClickable(m), variant: 'light', textSize: 24 });

    // 누르기 전에 결과를 알 수 있게, 버튼이 타이머를 시작한다는 것만 짧게 알린다.
    textStyle(NORMAL);
    fill(150, 143, 133);
    textSize(18);
    text('누르면 ' + UI.formatDuration(CONFIG.TIME_LIMIT_SEC) + ' 타이머가 시작돼요', UI.W / 2, 530);
  },

  // 울리는 휴대폰. 몸체와 양옆의 울림 표시만 선으로 그린다.
  drawPhone(cx, cy) {
    push();
    noFill();
    stroke(178, 171, 160);
    strokeWeight(3);
    rect(cx - 28, cy - 48, 56, 96, 10);
    strokeWeight(2);
    line(cx - 8, cy - 38, cx + 8, cy - 38);
    rect(cx - 20, cy - 30, 40, 64, 3);
    strokeWeight(3);
    for (const side of [-1, 1]) {
      for (const r of [44, 58]) arc(cx, cy, r * 2, r * 2, side < 0 ? PI - 0.45 : -0.45, side < 0 ? PI + 0.45 : 0.45);
    }
    pop();
  },

  isClickable(m) {
    return UI.inRect(m, this.START_BUTTON);
  },

  pressed(m) {
    if (UI.inRect(m, this.START_BUTTON)) Game.startPlay();
  },

  dragged() {},

  released() {}
};
