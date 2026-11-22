// 사진을 처음 클릭하면 뜨는 회상이다. 어두운 막 위에 사진의 title과 text, 진행 막대를 FLASHBACK_SEC 동안 보여 준다.
// 회상 중에는 입력을 받지 않고 타이머는 계속 흐른다. 끝까지 보면 그 사진을 본 것으로 적는다.
// 회상 중에 전화 시간이 되면 전화는 회상이 끝난 직후에 온다(overlays/call.js).

const OverlayFlashback = {
  BAR: { x: 340, y: 560, w: 600, h: 10 },

  photo: null,
  elapsed: 0,

  enter(params) {
    this.photo = PHOTOS.find(p => p.id === params.photoId);
    this.elapsed = 0;
  },

  // dt는 게임 시간이다. 디버그 키 P로 멈추면 0이 들어와 회상도 멈춘다.
  update(dt) {
    this.elapsed += dt;
    GameState.stats.flashbackSec += dt;
    if (this.elapsed >= CONFIG.FLASHBACK_SEC) {
      GameState.seePhoto(this.photo.id);
      Game.closeOverlay();
    }
  },

  // 회상과 사진 다시 보기가 함께 쓰는 그림: 어두운 막, 사진 제목, 사진 글
  drawMemory(photo) {
    noStroke();
    fill(16, 14, 12, 228);
    rect(0, 0, UI.W, UI.H);

    fill(178, 171, 160);
    textAlign(CENTER, TOP);
    textStyle(NORMAL);
    textSize(18);
    text('회상', UI.W / 2, 130);

    fill(250, 247, 240);
    textStyle(BOLD);
    const title = UI.fitLines(photo.title, 1000, 1, 34, 22);
    textSize(title.size);
    UI.drawLines(title.lines, UI.W / 2, 172, title.size * 1.3, CENTER);

    fill(222, 216, 206);
    textStyle(NORMAL);
    const body = UI.fitLines(photo.text, 900, 7, 23, 16);
    textSize(body.size);
    UI.drawLines(body.lines, UI.W / 2, 252, body.size * 1.7, CENTER);
  },

  draw() {
    this.drawMemory(this.photo);
    const ratio = Math.min(1, this.elapsed / CONFIG.FLASHBACK_SEC);
    const bar = this.BAR;
    noStroke();
    fill(255, 255, 255, 60);
    rect(bar.x, bar.y, bar.w, bar.h);
    fill(235);
    rect(bar.x, bar.y, bar.w * ratio, bar.h);
  },

  isClickable() {
    return false;
  }
};
