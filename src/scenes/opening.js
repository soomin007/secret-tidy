// 오프닝이다. STORY(S#1~S#3)를 화면 아래 대사 창에 한 줄씩 보여 준다.
// 누르면 다음 줄로 넘어가고, 장면이 바뀌는 줄에서는 장면 이름(scene)을 화면 가운데에 잠깐 띄운다.
// [건너뛰기]나 마지막 줄 다음의 클릭은 게임 방법 안내로 넘어간다.

const SceneOpening = {
  SKIP_BUTTON: { x: 1104, y: 24, w: 150, h: 48, label: '건너뛰기' },
  CAPTION_SEC: 1.6,   // 장면 이름을 띄워 두는 시간(초)

  lines: [],          // STORY를 한 줄씩 편 목록. { scene, sceneStart, speaker, text }
  index: 0,
  captionLeft: 0,
  shownCount: 0,      // 지금까지 화면에 나온 줄 수. 모든 줄이 나오는지 검사할 때 본다

  enter() {
    this.lines = [];
    for (const s of STORY) {
      s.lines.forEach((l, i) => this.lines.push({ scene: s.scene, sceneStart: i === 0, speaker: l.speaker, text: l.text }));
    }
    this.index = 0;
    this.captionLeft = this.CAPTION_SEC;
    this.shownCount = 1;
  },

  update(dt) {
    this.captionLeft = Math.max(0, this.captionLeft - dt);
  },

  current() {
    return this.lines[this.index];
  },

  draw(m) {
    background(...UI.COLOR.dark);
    const line = this.current();

    if (this.captionLeft > 0) {
      // 마지막 0.4초 동안 흐려지며 사라진다.
      const alpha = 255 * Math.min(1, this.captionLeft / 0.4);
      noStroke();
      fill(250, 247, 240, alpha);
      textAlign(CENTER, CENTER);
      textStyle(BOLD);
      textSize(34);
      text(line.scene, UI.W / 2, 250);
    }

    UI.drawDialogue(line, { more: true });
    UI.drawButton(this.SKIP_BUTTON, { hover: UI.inRect(m, this.SKIP_BUTTON), variant: 'light', textSize: 19 });
  },

  isClickable() {
    return true;
  },

  click(p) {
    if (UI.inRect(p, this.SKIP_BUTTON)) {
      Game.goTo('guide');
      return;
    }
    this.index += 1;
    if (this.index >= this.lines.length) {
      Game.goTo('guide');
      return;
    }
    this.shownCount += 1;
    if (this.current().sceneStart) this.captionLeft = this.CAPTION_SEC;
  }
};
