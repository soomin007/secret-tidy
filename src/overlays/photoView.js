// 이미 본 사진을 다시 클릭했을 때 PHOTO_REVIEW_COSTS_TIME이 false면 뜨는 창이다.
// 회상과 같은 내용을 띄우고, 어디든 클릭하면 바로 닫힌다. 떠 있는 동안에도 타이머는 흐른다.

const OverlayPhotoView = {
  photo: null,

  enter(params) {
    this.photo = PHOTOS.find(p => p.id === params.photoId);
  },

  update(dt) {
    GameState.stats.flashbackSec += dt;
  },

  draw() {
    OverlayFlashback.drawMemory(this.photo);
    fill(178, 171, 160);
    textAlign(CENTER, TOP);
    textStyle(NORMAL);
    textSize(17);
    text('누르면 닫혀요', UI.W / 2, 556);
  },

  isClickable() {
    return true;
  },

  click() {
    Game.closeOverlay();
  }
};
