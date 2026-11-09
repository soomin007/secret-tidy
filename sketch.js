// 진입점이다. p5의 setup과 draw를 두고 장면 전환, 화면 확대와 축소, 입력 분배를 맡는다.
// 모든 장면은 1280×720 논리 좌표로 그리고, 여기서 창 크기에 맞춰 비율을 유지한 채 늘이거나 줄인다.
// 남는 부분은 어두운 여백으로 두고, 마우스 좌표도 논리 좌표로 바꿔서 장면에 넘긴다.

const SCENES = {
  intro: SceneIntro,
  room: SceneRoom,
  zone: SceneZone,
  flashback: SceneFlashback,
  result: SceneResult
};

// 논리 좌표를 화면에 맞추는 배율(s)과 가운데 정렬용 여백(ox, oy). 창 크기가 바뀌면 다시 계산한다.
const View = { s: 1, ox: 0, oy: 0 };

const Game = {
  sceneName: '',
  scene: null,
  debugView: false,   // 디버그 키 D로 켜고 끈다
  toast: null,        // 잠깐 띄우는 안내 문구 { message, timeLeft }

  // 장면 전환은 연출 없이 즉시 바뀐다.
  goTo(name, params = {}) {
    this.sceneName = name;
    this.scene = SCENES[name];
    this.scene.enter(params);
  },

  // 인트로의 "통화 끊고 청소 시작"
  startPlay() {
    GameTimer.start();
    this.goTo('room');
  },

  // 시간이 다 되거나 문을 열어 주면 결과로 간다. 들고 있던 물건은 제자리로 돌아간 것으로 친다.
  // 남은 초는 이 순간의 값으로 고정해서 시간 보너스에 넣는다.
  finish(reason) {
    if (this.sceneName === 'result') return;
    ItemManager.cancelPress();
    GameTimer.stop();
    PlayLog.add('finish', { reason, remaining: GameTimer.wholeSeconds() });
    this.goTo('result', { reason, result: this.currentResult() });
  },

  // 지금 끝나면 나올 결과. 결과 화면과 디버그 표시의 실시간 점수가 함께 쓴다.
  currentResult() {
    return Scoring.compute(ItemManager.snapshot(), GameTimer.wholeSeconds(), ItemManager.wrongDrops, CONFIG);
  },

  // "다시 하기". 타이머, 물건, 점수를 모두 처음 상태로 되돌린다.
  reset() {
    GameTimer.reset(CONFIG.TIME_LIMIT_SEC);
    ItemManager.reset();
    PlayLog.reset();
    this.toast = null;
    this.goTo('intro');
  },

  showToast(message) {
    this.toast = { message, timeLeft: CONFIG.TOAST_SEC };
  },

  // 구역별로 아직 할 일이 남은 물건 수
  remainingByZone() {
    return Scoring.remainingByZone(ItemManager.snapshot(), ZONES.map(z => z.id), CONFIG);
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
  if (GameTimer.isOver()) Game.finish('timeout');
  Game.scene.update(GameTimer.paused ? 0 : dt);

  if (Game.toast) {
    Game.toast.timeLeft -= dt;
    if (Game.toast.timeLeft <= 0) Game.toast = null;
  }

  const m = toLogical(mouseX, mouseY);

  // 창이 포커스를 잃으면 p5는 mouseReleased를 부르지 않고 누름 상태만 지운다.
  // 그때 누르던 동작이 남아 있으면 지금 자리에서 뗀 것으로 처리한다.
  if (ItemManager.isBusy() && !mouseIsPressed) Game.scene.released(m);

  background(...UI.COLOR.margin);
  push();
  translate(View.ox, View.oy);
  scale(View.s);
  Game.scene.draw(m);
  if (Game.toast) UI.drawToast(Game.toast.message);
  if (Game.debugView && Game.sceneName !== 'intro' && Game.sceneName !== 'result') drawDebugInfo();
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

// 누를 수 있는 곳 위에서는 손가락 모양, 물건을 끄는 동안에는 쥔 손 모양으로 바꾼다.
function updateCursor(m) {
  let next = 'default';
  if (Game.scene.isDragging && Game.scene.isDragging()) next = 'grabbing';
  else if (Game.scene.isClickable(m)) next = 'pointer';
  if (next !== currentCursor) {
    cursor(next);
    currentCursor = next;
  }
}

// p5 2.x에서 mouseButton은 객체다. 왼쪽 버튼으로 누른 것만 받는다.
function mousePressed() {
  if (!mouseButton.left) return;
  Game.scene.pressed(toLogical(mouseX, mouseY));
}

function mouseDragged() {
  Game.scene.dragged(toLogical(mouseX, mouseY));
}

function mouseReleased() {
  Game.scene.released(toLogical(mouseX, mouseY));
}

// 디버그 표시(D)의 실시간 점수, 구역별 남은 개수, 플레이 기록 진행
function drawDebugInfo() {
  const r = Game.currentResult();
  const counts = Game.remainingByZone();
  const zoneText = ZONES.map(z => z.name + ' ' + counts[z.id]).join(', ');
  const opened = ItemManager.covers.filter(c => c.open).length;
  const misses = PlayLog.events.filter(e => e.type === 'miss').length;
  UI.drawDebugInfo([
    '실시간 점수 ' + r.total + ' (숨김 ' + r.hideScore + ', 청소 ' + r.cleanScore +
      ', 보너스 ' + r.timeBonus + ', 감점 ' + r.penalty + ')',
    '지금 끝나면 ' + ENDINGS[r.ending].name + ', 남은 일 ' + zoneText,
    '연 덮개 ' + opened + '/' + ItemManager.covers.length + '개, 처음 집은 물건 ' +
      Object.keys(PlayLog.touched).length + '개, 빈 곳 누름 ' + misses + '번'
  ]);
}

// 디버그 키. DEBUG_KEYS가 false면 모두 꺼진다.
// 한글 입력 상태에서는 D가 'ㅇ'으로 들어오므로, 글자(key) 대신 자판 위치(code)로 구분한다.
function handleDebugKey(e) {
  if (!CONFIG.DEBUG_KEYS || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  switch (e.code) {
    case 'KeyD':
      Game.debugView = !Game.debugView;
      break;
    case 'KeyP':
      GameTimer.togglePause();
      break;
    case 'BracketLeft':
      GameTimer.addSeconds(-CONFIG.DEBUG_TIME_STEP_SEC);
      break;
    case 'BracketRight':
      GameTimer.addSeconds(CONFIG.DEBUG_TIME_STEP_SEC);
      break;
    case 'KeyE':
      Game.finish('debug');
      break;
    case 'KeyR':
      Game.reset();
      break;
  }
}
