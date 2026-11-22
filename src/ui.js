// 여러 장면이 함께 쓰는 화면 도구를 모은다. 색, 글자 줄 나누기, 버튼, HUD, 대사 창, DEBUG 표시가 여기 있다.
// 모든 좌표는 1280×720 논리 좌표이고, 창 크기에 맞춘 확대와 축소는 sketch.js가 맡는다.

const UI = {
  W: 1280,
  H: 720,

  COLOR: {
    margin: [17, 17, 17],          // 1280×720 바깥 여백
    stage: [232, 229, 223],        // 방 전체와 근접 컷 바탕
    dark: [38, 36, 34],            // 시작, 오프닝, 안내, 엔딩 바탕
    ink: [40, 37, 33],             // 기본 글자
    subInk: [112, 106, 98],        // 보조 글자, 지문
    line: [70, 64, 56],            // 테두리
    paper: [250, 248, 244],        // 대사 창, 패널
    button: [58, 54, 49],
    buttonHover: [96, 89, 80],
    buttonDisabled: [190, 184, 175],
    warning: [196, 52, 44],        // WARNING_SEC 이하 타이머
    memo: [255, 251, 232],         // 메모 카드
    debug: [220, 0, 160],          // 디버그 판정 영역
    debugBadge: [255, 214, 0]
  },

  // HUD 자리. 물건은 y 90 아래에만 둔다.
  PLACE_BOX: { x: 16, y: 16, w: 120, h: 48 },
  BACK_BUTTON: { x: 148, y: 16, w: 150, h: 48, label: '방 전체로' },
  TIMER_BOX: { x: 1114, y: 16, w: 150, h: 56 },
  // 화면 아래 메모 카드 자리(y 570~710)
  MEMO_CARD: { x: 40, y: 570, w: 1200, h: 140 },
  // 오프닝, 통화, 엔딩이 함께 쓰는 대사 창
  DIALOGUE: { x: 60, y: 520, w: 1160, h: 180 },

  // 임시 데이터의 이름은 '[임시]'로 시작한다. 화면에는 그 머리말을 빼고 쓴다.
  plain(str) {
    return String(str).replace(/^\[임시\]\s*/, '');
  },

  inRect(p, r) {
    return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  },

  // 글자를 maxW 폭 안에 들어가게 여러 줄로 나눈다. 지금 글자 크기와 굵기로 잰다.
  // 띄어쓰기에서 끊고, 한 낱말이 한 줄보다 길 때만 글자 단위로 끊는다.
  wrapLines(str, maxW) {
    const out = [];
    for (const para of String(str).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const next = line ? line + ' ' + word : word;
        if (textWidth(next) <= maxW) {
          line = next;
          continue;
        }
        if (line) out.push(line);
        if (textWidth(word) <= maxW) {
          line = word;
          continue;
        }
        line = '';
        for (const ch of word) {
          if (textWidth(line + ch) > maxW && line) {
            out.push(line);
            line = ch;
          } else {
            line += ch;
          }
        }
      }
      out.push(line);
    }
    return out;
  },

  // maxLines 줄 안에 들어갈 때까지 글자 크기를 줄여 { size, lines }를 돌려준다. 다 줄여도 넘치면 넘친 채로 돌려준다.
  fitLines(str, maxW, maxLines, size, minSize) {
    let lines = [];
    for (let s = size; s >= minSize; s--) {
      textSize(s);
      lines = this.wrapLines(str, maxW);
      if (lines.length <= maxLines) return { size: s, lines };
    }
    return { size: minSize, lines };
  },

  // 글자가 maxW 안에 한 줄로 들어갈 때까지 크기를 줄이고, 실제로 쓴 크기를 돌려준다.
  fitTextSize(str, maxW, size, minSize) {
    textSize(size);
    while (size > minSize && textWidth(str) > maxW) {
      size -= 1;
      textSize(size);
    }
    return size;
  },

  // 여러 줄을 (x, y)부터 leading 간격으로 쓴다. align은 LEFT나 CENTER다.
  drawLines(lines, x, y, leading, align) {
    textAlign(align, TOP);
    lines.forEach((l, i) => text(l, x, y + i * leading));
  },

  // 300 → "5분", 270 → "4분 30초", 45 → "45초"
  formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    if (m === 0) return s + '초';
    if (s === 0) return m + '분';
    return m + '분 ' + s + '초';
  },

  // 버튼 하나. opts: { hover, disabled, variant: 'light', textSize }
  // 글자가 길면 두 줄까지 나눠 쓴다(통화 선택지).
  drawButton(btn, opts = {}) {
    const light = opts.variant === 'light';
    push();
    strokeWeight(2);
    if (opts.disabled) {
      fill(...this.COLOR.buttonDisabled);
      stroke(...this.COLOR.buttonDisabled);
    } else if (light) {
      fill(opts.hover ? 236 : 255);
      stroke(...this.COLOR.line);
      strokeWeight(opts.hover ? 3 : 2);
    } else {
      fill(...(opts.hover ? this.COLOR.buttonHover : this.COLOR.button));
      stroke(...this.COLOR.button);
    }
    rect(btn.x, btn.y, btn.w, btn.h, 6);

    noStroke();
    fill(...(light && !opts.disabled ? this.COLOR.ink : [255, 255, 255]));
    textStyle(opts.bold === false ? NORMAL : BOLD);
    const fit = this.fitLines(btn.label, btn.w - 28, opts.maxLines || 1, opts.textSize || 20, 12);
    textSize(fit.size);
    const leading = fit.size * 1.4;
    const top = btn.y + btn.h / 2 - (fit.lines.length * leading) / 2 + (leading - fit.size) / 2;
    if (opts.align === 'left') this.drawLines(fit.lines, btn.x + 20, top, leading, LEFT);
    else this.drawLines(fit.lines, btn.x + btn.w / 2, top, leading, CENTER);
    pop();
  },

  // 방 전체와 근접 컷 위쪽 HUD. 왼쪽 위에 지금 있는 곳의 이름, 오른쪽 위에 남은 시간을 둔다.
  // opts: { place, back(근접 컷이면 true), backHover, blocked(겹친 창이나 드래그 때문에 버튼이 반응하지 않음), hiddenCount }
  drawHud(opts) {
    push();
    const pb = this.PLACE_BOX;
    fill(255, 255, 255, 240);
    stroke(...this.COLOR.line);
    strokeWeight(1.5);
    rect(pb.x, pb.y, pb.w, pb.h, 6);
    noStroke();
    fill(...this.COLOR.ink);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    this.fitTextSize(opts.place, pb.w - 16, 22, 14);
    text(opts.place, pb.x + pb.w / 2, pb.y + pb.h / 2);

    if (opts.back) {
      this.drawButton(this.BACK_BUTTON, { hover: opts.backHover && !opts.blocked, textSize: 19 });
    }

    if (opts.hiddenCount !== null && opts.hiddenCount !== undefined) {
      const label = '숨긴 물건 ' + opts.hiddenCount + '개';
      textStyle(BOLD);
      textSize(19);
      const w = textWidth(label) + 36;
      fill(255, 255, 255, 230);
      stroke(...this.COLOR.line);
      strokeWeight(1.5);
      rect(this.W / 2 - w / 2, 20, w, 40, 6);
      noStroke();
      fill(...this.COLOR.ink);
      textAlign(CENTER, CENTER);
      text(label, this.W / 2, 40);
    }

    const warn = GameTimer.isWarning(CONFIG);
    const box = this.TIMER_BOX;
    fill(255, 255, 255, 240);
    stroke(...(warn ? this.COLOR.warning : this.COLOR.line));
    strokeWeight(warn ? 3 : 1.5);
    rect(box.x, box.y, box.w, box.h, 6);
    noStroke();
    fill(...(warn ? this.COLOR.warning : this.COLOR.ink));
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(34);
    text(GameTimer.format(GameTimer.remaining), box.x + box.w / 2, box.y + box.h / 2 + 1);
    pop();
  },

  // 대사 창. line은 { speaker, text }이고, speaker가 빈 문자열이면 지문이라 이름 없이 회색으로 쓴다.
  // line.strong은 대사가 아닌 게임 안내 줄(엔딩의 '놓친 물건')이라 짙은 굵은 글씨로 쓴다.
  // opts.more가 true면 오른쪽 아래에 '누르면 다음 줄'이라는 뜻의 작은 세모를 그린다.
  drawDialogue(line, opts = {}) {
    const d = this.DIALOGUE;
    push();
    fill(...this.COLOR.paper);
    stroke(...this.COLOR.line);
    strokeWeight(2);
    rect(d.x, d.y, d.w, d.h, 6);

    const narration = !line.speaker;
    if (!narration) {
      textStyle(BOLD);
      textSize(20);
      const w = textWidth(line.speaker) + 36;
      fill(...this.COLOR.button);
      noStroke();
      rect(d.x + 24, d.y - 22, w, 40, 6);
      fill(255);
      textAlign(CENTER, CENTER);
      text(line.speaker, d.x + 24 + w / 2, d.y - 2);
    }

    noStroke();
    textStyle(line.strong ? BOLD : NORMAL);
    fill(...(narration && !line.strong ? this.COLOR.subInk : this.COLOR.ink));
    const fit = this.fitLines(line.text, d.w - 72, 4, 23, 16);
    textSize(fit.size);
    this.drawLines(fit.lines, d.x + 36, d.y + 34, fit.size * 1.55, LEFT);

    if (opts.more) {
      fill(...this.COLOR.subInk);
      const ax = d.x + d.w - 34;
      const ay = d.y + d.h - 26;
      triangle(ax - 9, ay - 5, ax + 9, ay - 5, ax, ay + 6);
    }
    pop();
  },

  // 물건 상자 안에 쓸 이름. 상자 폭 안에서 두 줄 이내가 되게 글자 크기를 16부터 12까지 줄인다.
  // tools/e2e.js가 모든 물건에 대해 이 결과를 그대로 받아 두 줄 이내인지 확인한다.
  fitBoxLabel(label, r) {
    return this.fitLines(label, r.w - 16, 2, 16, 12);
  },

  // 상자 가운데에 이름을 쓴다. 지금 채우기 색과 굵기를 그대로 쓴다.
  drawBoxLabel(label, r) {
    const fit = this.fitBoxLabel(label, r);
    textSize(fit.size);
    const leading = fit.size * 1.3;
    const top = r.y + r.h / 2 - (fit.lines.length * leading) / 2 + (leading - fit.size) / 2;
    this.drawLines(fit.lines, r.x + r.w / 2, top, leading, CENTER);
  },

  MEMO_DETAIL_BUTTON: { x: 1070, y: 582, w: 156, h: 42, label: '자세히 보기' },

  // 메모 카드. 이름을 굵게 쓰고 그 아래에 memo1을, [자세히 보기]를 누른 뒤에는 memo2를 이어서 쓴다.
  // 두 메모가 카드 높이 안에 들어갈 때까지 글자 크기를 줄인다.
  drawMemoCard(item, detailed, hoverDetail) {
    const c = this.MEMO_CARD;
    push();
    fill(...this.COLOR.memo);
    stroke(...this.COLOR.line);
    strokeWeight(2);
    rect(c.x, c.y, c.w, c.h, 6);

    noStroke();
    fill(...this.COLOR.ink);
    textStyle(BOLD);
    textAlign(LEFT, TOP);
    this.fitTextSize(item.name, c.w - 260, 22, 14);
    text(item.name, c.x + 24, c.y + 16);

    textStyle(NORMAL);
    const texts = detailed ? [item.memo1, item.memo2] : [item.memo1];
    const maxW = c.w - 48;
    const room = c.h - 60;
    let size = 18;
    let blocks = [];
    for (; size >= 12; size--) {
      textSize(size);
      blocks = texts.map(t => this.wrapLines(t, maxW));
      const lines = blocks.reduce((n, b) => n + b.length, 0);
      if (lines * size * 1.4 + (blocks.length - 1) * 4 <= room) break;
    }
    textSize(size);
    let y = c.y + 52;
    blocks.forEach((b, i) => {
      fill(...(i === 0 ? this.COLOR.ink : this.COLOR.subInk));
      this.drawLines(b, c.x + 24, y, size * 1.4, LEFT);
      y += b.length * size * 1.4 + 4;
    });

    if (!detailed) this.drawButton(this.MEMO_DETAIL_BUTTON, { hover: hoverDetail, variant: 'light', textSize: 18 });
    pop();
  },

  // 고양이: '고양이'라고 적힌 작은 원
  drawCat(x, y, r, hover) {
    push();
    fill(255, 253, 248);
    stroke(...this.COLOR.line);
    strokeWeight(hover ? 4 : 2);
    circle(x, y, r * 2);
    noStroke();
    fill(...this.COLOR.ink);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    this.fitTextSize('고양이', r * 2 - 8, 14, 10);
    text('고양이', x, y);
    pop();
  },

  // 디버그 표시: 판정 영역 테두리와 이름표
  drawDebugFrame(r, label) {
    push();
    noFill();
    stroke(...this.COLOR.debug);
    strokeWeight(1);
    rect(r.x, r.y, r.w, r.h);
    if (label) {
      noStroke();
      fill(...this.COLOR.debug);
      textStyle(NORMAL);
      textSize(11);
      textAlign(LEFT, BOTTOM);
      text(label, r.x, r.y - 1);
    }
    pop();
  },

  // 디버그 표시(D)를 켜면 타이머 아래에 실시간 점수와 지금 끝나면 나올 엔딩을 띄운다.
  drawDebugInfo(lines) {
    push();
    textStyle(NORMAL);
    textSize(13);
    const w = Math.max(...lines.map(l => textWidth(l))) + 20;
    const x = this.TIMER_BOX.x + this.TIMER_BOX.w - w;
    noStroke();
    fill(0, 0, 0, 180);
    rect(x, 80, w, lines.length * 19 + 10, 4);
    fill(255, 236, 120);
    textAlign(LEFT, CENTER);
    lines.forEach((l, i) => text(l, x + 10, 95 + i * 19));
    pop();
  },

  // 디버그 표시나 일시정지가 켜져 있으면 HUD의 [방 전체로] 오른쪽에 띄워, 테스트 화면을 실제 플레이로 착각하지 않게 한다.
  // 메모 카드, 고양이, [준비 완료]와 겹치지 않는 자리다.
  drawDebugBadge(paused) {
    const label = paused ? 'DEBUG 일시정지' : 'DEBUG';
    push();
    textStyle(BOLD);
    textSize(15);
    const w = textWidth(label) + 20;
    noStroke();
    fill(...this.COLOR.debugBadge);
    rect(312, 26, w, 28, 4);
    fill(0);
    textAlign(LEFT, CENTER);
    text(label, 322, 40);
    pop();
  }
};
