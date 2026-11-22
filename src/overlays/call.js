// 남자친구의 전화다. 남은 시간이 CALLS의 at이 되면 뜬다.
// intro(지문)와 lines(대사)를 클릭으로 넘긴 뒤 선택지 3개를 버튼으로 보여 주고,
// 하나를 고르면 설윤의 말(text)과 남자친구의 대답(response)을 차례로 보여 준 뒤 [통화 종료]로 닫는다.
// 통화 중에는 방 조작을 막고 타이머는 계속 흐른다.

const OverlayCall = {
  CHOICE_TOP: 150,
  CHOICE_BOX: { x: 140, w: 1000, h: 88, gap: 16 },
  END_BUTTON: { x: 1010, y: 448, w: 210, h: 56, label: '통화 종료' },

  call: null,
  phase: 'talk',   // 'talk' 지문과 대사, 'choose' 선택지, 'reply' 고른 말과 대답
  lines: [],
  index: 0,
  choice: null,

  // sketch.js가 매 프레임 부른다. 전화 시간이 된 전화가 있으면 창을 띄운다.
  // 회상 중이거나 다른 통화 중이면 그것이 끝날 때까지 기다린다. 확인 창, 숨긴 물건 목록, 사진 다시 보기는 닫고 띄운다.
  // 드래그 중이던 것은 제자리로 돌리고 메모 카드도 닫는다.
  schedule() {
    if (!GameTimer.running) return;
    const due = GameState.dueCalls(GameTimer.remaining);
    if (!due.length || Game.overlayName === 'flashback' || Game.overlayName === 'call') return;
    Pointer.cancel();
    Game.closeOverlay();
    if (Game.sceneName === 'zone') SceneZone.closeMemo();
    Game.openOverlay('call', { callId: due[0].id });
  },

  enter(params) {
    this.call = CALLS.find(c => c.id === params.callId);
    if (!GameState.calls[this.call.id]) GameState.calls[this.call.id] = { started: false, choice: null };
    GameState.calls[this.call.id].started = true;
    this.lines = this.call.intro.map(t => ({ speaker: '', text: t })).concat(this.call.lines);
    this.phase = 'talk';
    this.index = 0;
    this.choice = null;
  },

  update(dt) {
    GameState.stats.callSec += dt;
  },

  choiceButtons() {
    const b = this.CHOICE_BOX;
    return this.call.choices.map((c, i) => ({ key: c.key, label: c.text, x: b.x, y: this.CHOICE_TOP + i * (b.h + b.gap), w: b.w, h: b.h }));
  },

  currentLine() {
    if (this.phase === 'reply') {
      return this.index === 0 ? { speaker: '설윤', text: this.choice.text } : { speaker: '남자친구', text: this.choice.response };
    }
    return this.lines[Math.min(this.index, this.lines.length - 1)];
  },

  isLastLine() {
    return this.phase === 'reply' && this.index === 1;
  },

  draw(m) {
    noStroke();
    fill(20, 18, 16, 215);
    rect(0, 0, UI.W, UI.H);

    fill(200, 193, 182);
    textAlign(CENTER, TOP);
    textStyle(NORMAL);
    textSize(16);
    text('통화 중', UI.W / 2, 86);
    fill(250, 247, 240);
    textStyle(BOLD);
    textSize(24);
    text(this.call.title, UI.W / 2, 108);

    if (this.phase === 'choose') {
      for (const b of this.choiceButtons()) {
        UI.drawButton(b, { hover: UI.inRect(m, b), variant: 'light', textSize: 19, maxLines: 2, bold: false, align: 'left' });
      }
    }
    UI.drawDialogue(this.currentLine(), { more: this.phase !== 'choose' && !this.isLastLine() });
    if (this.isLastLine()) UI.drawButton(this.END_BUTTON, { hover: UI.inRect(m, this.END_BUTTON), textSize: 20 });
  },

  isClickable(m) {
    if (this.phase === 'choose') return this.choiceButtons().some(b => UI.inRect(m, b));
    if (this.isLastLine()) return UI.inRect(m, this.END_BUTTON);
    return true;
  },

  click(p) {
    if (this.phase === 'talk') {
      this.index += 1;
      if (this.index >= this.lines.length) this.phase = 'choose';
      return;
    }
    if (this.phase === 'choose') {
      const b = this.choiceButtons().find(x => UI.inRect(p, x));
      if (!b) return;
      this.choice = this.call.choices.find(c => c.key === b.key);
      GameState.calls[this.call.id].choice = b.key;
      this.phase = 'reply';
      this.index = 0;
      return;
    }
    if (this.index === 0) {
      this.index = 1;
      return;
    }
    if (UI.inRect(p, this.END_BUTTON)) Game.closeOverlay();
  }
};
