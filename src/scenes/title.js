// 시작 화면이다. 제목과 [시작] 버튼을 두고, 구석에 프로토타입이라는 표시를 단다.

const SceneTitle = {
  START_BUTTON: { x: 540, y: 410, w: 200, h: 64, label: '시작' },

  enter() {},

  update() {},

  draw(m) {
    background(...UI.COLOR.dark);
    noStroke();
    fill(250, 247, 240);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(56);
    text('내 방의 비밀 정리', UI.W / 2, 280);

    UI.drawButton(this.START_BUTTON, { hover: this.isClickable(m), variant: 'light', textSize: 24 });

    fill(150, 143, 133);
    textStyle(NORMAL);
    textSize(16);
    textAlign(RIGHT, BOTTOM);
    text('프로토타입', UI.W - 24, UI.H - 20);
  },

  isClickable(m) {
    return UI.inRect(m, this.START_BUTTON);
  },

  click(p) {
    if (UI.inRect(p, this.START_BUTTON)) Game.goTo('opening');
  }
};
