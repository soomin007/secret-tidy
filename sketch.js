// 진입점이다. p5의 setup과 draw를 두고 장면 전환, 겹친 창, 화면 확대와 축소, 입력 분배, 디버그 키를 맡는다.
// 모든 장면은 1280×720 논리 좌표로 그리고, 여기서 창 크기에 맞춰 비율을 유지한 채 늘이거나 줄인다.
// 남는 부분은 어두운 여백으로 두고, 마우스 좌표도 논리 좌표로 바꿔서 넘긴다.

const SCENES = {
  title: SceneTitle,
  opening: SceneOpening,
  guide: SceneGuide,
  room: SceneRoom,
  zone: SceneZone,
  ending: SceneEnding,
  result: SceneResult
};

// 방 전체와 근접 컷 위에 겹쳐 뜨는 창. 떠 있는 동안에는 입력이 모두 창으로 가고, 타이머는 계속 흐른다.
const OVERLAYS = {
  flashback: OverlayFlashback,
  photoView: OverlayPhotoView,
  call: OverlayCall,
  confirm: OverlayConfirm,
  hiddenList: OverlayHiddenList
};

const DEBUG_STEP_SEC = 30;   // 디버그 키 [ 와 ] 가 빼고 더하는 시간(초)

// 논리 좌표를 화면에 맞추는 배율(s)과 가운데 정렬용 여백(ox, oy). 창 크기가 바뀌면 다시 계산한다.
const View = { s: 1, ox: 0, oy: 0 };

const Game = {
  sceneName: '',
  scene: null,
  overlayName: null,
  overlay: null,
  debugView: false,   // 디버그 키 D로 켜고 끈다

  // 장면 전환은 연출 없이 바로 바뀐다.
  goTo(name, params = {}) {
    this.sceneName = name;
    this.scene = SCENES[name];
    this.scene.enter(params);
  },

  openOverlay(name, params = {}) {
    this.overlayName = name;
    this.overlay = OVERLAYS[name];
    this.overlay.enter(params);
  },

  closeOverlay() {
    const o = this.overlay;
    this.overlay = null;
    this.overlayName = null;
    if (o && o.exit) o.exit();
  },

  // 지금 입력을 받는 쪽. 겹친 창이 떠 있으면 그 창이다.
  handler() {
    return this.overlay || this.scene;
  },

  // 마우스를 올린 것을 강조해도 되는지. 겹친 창이 떠 있거나 무언가를 드래그하는 동안에는 장면의 버튼이 반응하지 않는다.
  inputFree() {
    return !this.overlay && !Pointer.isDragging();
  },

  // 게임 방법 안내를 닫을 때 부른다. 타이머가 시작되고 방 전체로 간다.
  startPlay() {
    GameTimer.start();
    this.goTo('room');
  },

  // 엔딩 판정. early는 [준비 완료]나 디버그 키 E로 일찍 끝냈는지다.
  // 드래그 중이던 것은 제자리로 돌리고, 떠 있던 창은 닫는다. 남은 초는 이 순간의 값으로 고정한다.
  finish(early) {
    if (!GameTimer.running) return;
    Pointer.cancel();
    this.closeOverlay();
    GameTimer.stop();
    GameTimer.paused = false;
    GameState.finish(early, GameTimer.wholeSeconds());
    this.goTo('ending', this.judge());
  },

  // 구역마다 아직 할 일이 남은 수(디버그 표시). 숨기지 않은 ex와 끝내지 않은 청소 물건이다.
  remainingInZone(zoneId) {
    const ex = ITEMS.filter(it => it.zone === zoneId && it.category === 'ex' && !GameState.isHidden(it.id)).length;
    const clean = CLEANING.filter(c => c.zone === zoneId && !GameState.cleaning[c.id].done).length;
    return { ex, clean };
  },

  // 지금 상태로 점수와 엔딩을 계산한다. 결과 화면과 디버그 표시의 실시간 점수가 함께 쓴다.
  score(remainingSec, early) {
    return Scoring.compute(Scoring.snapshot(GameState, remainingSec, early), CONFIG);
  },

  // 엔딩 판정. bad1이면 숨기지 못한 ex 중 번호가 가장 작은 물건 이름을 엔딩 첫 줄 앞에 보여 준다.
  judge() {
    const result = this.score(GameState.end.remainingSec, GameState.end.early);
    return { endingId: result.ending, missedName: result.ending === 'bad1' ? result.missed.name : null, result };
  },

  // 다시 하기와 디버그 키 R. 타이머, 상태, 입력, 창을 모두 처음으로 되돌리고 시작 화면으로 간다.
  reset() {
    GameTimer.reset(CONFIG.TIME_LIMIT_SEC);
    GameState.reset();
    Pointer.reset();
    this.closeOverlay();
    this.goTo('title');
  }
};

function updateView() {
  View.s = Math.min(width / UI.W, height / UI.H);
  View.ox = (width - UI.W * View.s) / 2;
  View.oy = (height - UI.H * View.s) / 2;
}

// 화면(캔버스) 좌표를 1280×720 논리 좌표로 바꾼다.
function toLogical(sx, sy) {
  return { x: (sx - View.ox) / View.s, y: (sy - View.oy) / View.s };
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('sans-serif');
  UI.tidyContent();
  updateView();
  window.addEventListener('keydown', handleDebugKey);
  Game.reset();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateView();
}

function draw() {
  // deltaTime은 지난 프레임부터 실제로 흐른 밀리초다. 프레임 수로 세지 않는다.
  const dt = deltaTime / 1000;
  GameTimer.update(dt);
  const gameDt = GameTimer.paused ? 0 : dt;
  if (GameTimer.isOver()) Game.finish(false);
  Game.scene.update(gameDt);
  if (Game.overlay) Game.overlay.update(gameDt);
  // 회상이 이번 프레임에 끝났으면 기다리던 전화가 바로 뜬다.
  OverlayCall.schedule();

  const m = toLogical(mouseX, mouseY);

  // 창이 포커스를 잃으면 p5는 mouseReleased를 부르지 않고 누름 상태만 지운다.
  // 그때 누르던 동작이 남아 있으면 지금 자리에서 뗀 것으로 처리한다.
  if (Pointer.isDown() && !mouseIsPressed) Pointer.release(m);

  background(...UI.COLOR.margin);
  push();
  translate(View.ox, View.oy);
  scale(View.s);
  Game.scene.draw(m);
  if (Game.overlay) Game.overlay.draw(m);
  // 겹친 창이 떠 있어도 남은 시간이 흐르는 것이 보이도록 HUD를 맨 위에 그린다.
  const hud = Game.scene.hud ? Game.scene.hud() : null;
  if (hud) {
    hud.blocked = !Game.inputFree();
    hud.backHover = UI.inRect(m, UI.BACK_BUTTON);
    UI.drawHud(hud);
    if (Game.debugView && hud.back) UI.drawDebugFrame(UI.BACK_BUTTON, 'back');
  }
  if (Game.debugView && GameTimer.running) UI.drawDebugInfo(debugLines());
  if (Game.debugView || GameTimer.paused) UI.drawDebugBadge(GameTimer.paused);
  pop();

  drawLetterbox();
  updateCursor(m);
}

// 1280×720 밖으로 삐져나온 그림(끌고 있는 물건 등)을 어두운 여백으로 덮는다.
function drawLetterbox() {
  const w = UI.W * View.s;
  const h = UI.H * View.s;
  noStroke();
  fill(...UI.COLOR.margin);
  if (View.ox > 0) {
    rect(0, 0, View.ox, height);
    rect(View.ox + w, 0, width - View.ox - w, height);
  }
  if (View.oy > 0) {
    rect(0, 0, width, View.oy);
    rect(0, View.oy + h, width, height - View.oy - h);
  }
}

let currentCursor = '';

// 누를 수 있는 곳 위에서는 손가락 모양, 무언가를 끄는 동안에는 쥔 손 모양으로 바꾼다.
function updateCursor(m) {
  let next = 'default';
  const h = Game.handler();
  if (Pointer.isDragging()) next = h.isHolding && h.isHolding() ? 'grabbing' : 'default';
  else if (h.isClickable && h.isClickable(m)) next = 'pointer';
  if (next !== currentCursor) {
    cursor(next);
    currentCursor = next;
  }
}

// p5 2.x에서 mouseButton은 객체다. 왼쪽 버튼으로 누른 것만 받는다.
function mousePressed() {
  if (!mouseButton.left || Pointer.isDown()) return;
  Pointer.press(toLogical(mouseX, mouseY), Game.handler());
}

function mouseDragged() {
  Pointer.move(toLogical(mouseX, mouseY));
}

function mouseReleased() {
  if (Pointer.isDown()) Pointer.release(toLogical(mouseX, mouseY));
}

// 디버그 표시(D)를 켰을 때 타이머 아래에 띄우는 줄. 실시간 점수는 지금 시간이 다 됐을 때의 점수다.
function debugLines() {
  const label = id => ENDINGS.find(e => e.id === id).label;
  const timeout = Game.score(0, false);
  const early = Game.score(GameTimer.wholeSeconds(), true);
  const left = ['closet', 'desk', 'bed', 'floor'].map(z => {
    const r = Game.remainingInZone(z);
    return ZONE_NAMES[z] + ' ' + (r.ex + r.clean);
  });
  return [
    '실시간 점수 ' + timeout.total + ' (청소 ' + timeout.clean.total + ', 감점 ' + timeout.penalty.total + ')',
    '지금 시간이 다 되면 ' + label(timeout.ending),
    '지금 준비 완료하면 ' + early.total + '점, ' + label(early.ending),
    '남은 일 ' + left.join(', ') + ' (숨기지 않은 ex와 청소)',
    '장면 ' + Game.sceneName + (Game.overlayName ? ' + ' + Game.overlayName : '') + ', 흐른 시간 ' + GameTimer.elapsed.toFixed(1) + '초'
  ];
}

// 디버그 키. DEBUG_KEYS가 false면 모두 꺼진다.
// 한글 입력 상태에서는 D가 'ㅇ'으로 들어오므로, 글자(key) 대신 자판 위치(code)로 구분한다.
function handleDebugKey(e) {
  if (!CONFIG.DEBUG_KEYS || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const playing = GameTimer.running;
  switch (e.code) {
    case 'KeyD':
      Game.debugView = !Game.debugView;
      break;
    case 'KeyP':
      if (playing) GameTimer.togglePause();
      break;
    case 'BracketLeft':
      if (playing) GameTimer.addSeconds(-DEBUG_STEP_SEC);
      break;
    case 'BracketRight':
      if (playing) GameTimer.addSeconds(DEBUG_STEP_SEC);
      break;
    case 'KeyN':
      if (['title', 'opening', 'guide'].includes(Game.sceneName)) Game.startPlay();
      break;
    case 'KeyH':
      if (playing) GameState.debugHideAllEx();
      break;
    case 'KeyC':
      if (playing) GameState.debugCleanAll(CONFIG);
      break;
    case 'KeyV':
      if (playing) GameState.debugSeeCurrentPhotos();
      break;
    case 'KeyE':
      if (playing) Game.finish(true);
      break;
    case 'KeyR':
      Game.reset();
      break;
  }
}
