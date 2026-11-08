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

    textAlign(CENTER, CENTER);
    textStyle(NORMAL);
    fill(180);
    textSize(26);
    text('애인에게 전화가 왔다', UI.W / 2, 220);

    textStyle(BOLD);
    fill(255);
    textSize(40);
    text('“여기 너네 집 앞인데 잠깐 가도 돼?”', UI.W / 2, 295);

    UI.drawButton(this.START_BUTTON, { hover: this.isClickable(m), variant: 'light', textSize: 24 });

    // 누르기 전에 결과를 알 수 있게, 버튼이 타이머를 시작한다는 것만 짧게 알린다.
    textStyle(NORMAL);
    fill(150);
    textSize(18);
    text('누르는 순간 ' + UI.formatDuration(CONFIG.TIME_LIMIT_SEC) + ' 타이머가 시작된다', UI.W / 2, 530);
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
