// 그레이박스 그림을 모은다. 방 전체, 근접 컷 네 곳의 가구, 물건, 덮개, 드롭 대상을 p5 도형으로 그린다.
// 근접 컷은 위에서 비스듬히 내려다본 모습(윗면과 앞면이 보인다)이고, 방 전체는 정면에서 본 단면이다.
// 가구는 회갈색 덩어리로만 그린다. 최종 그림이 들어오면 이 파일의 함수를 그림으로 바꾼다.
// 이 파일은 불러올 때 p5를 부르지 않는다(tools/check.js가 브라우저 없이 불러온다).

const ART = {
  C: {
    wall: [233, 229, 222],
    floor: [207, 199, 187],
    floorLine: [186, 177, 164],
    plank: [196, 188, 176],
    floorShade: [190, 182, 170],
    top: [219, 210, 196],          // 가구 윗면
    topLine: [208, 198, 183],
    front: [195, 185, 170],        // 가구 앞면
    side: [172, 162, 147],
    inside: [186, 177, 163],       // 옷장 안쪽
    insideShade: [171, 162, 148],
    sheet: [228, 223, 214],        // 침대 시트
    sheetShade: [208, 202, 191],
    dark: [98, 91, 82],
    hole: [92, 86, 78],
    rug: [222, 215, 203],
    rugEdge: [205, 197, 184],
    glass: [217, 229, 235],
    cork: [209, 190, 158],
    paper: [249, 247, 241],
    lamp: [232, 220, 190],
    shadow: [70, 58, 44, 46],
    // 물건 종류별 색. 선물과 내 물건과 사진은 같은 흰색이다.
    item: [252, 251, 247],
    itemShade: [224, 221, 214],
    photoIn: [208, 214, 219],
    photoFig: [146, 155, 163],
    trash: [239, 229, 190],
    trashShade: [214, 201, 158],
    laundry: [202, 221, 239],
    laundryShade: [174, 197, 221],
    blanket: [220, 210, 236],
    blanketShade: [196, 184, 219],
    stain: [128, 92, 56],
    // 덮개는 모두 이 색 묶음으로 칠한다. 하나를 열어 보면 같은 색은 모두 열 수 있다는 것을 알게 하려는 것이다.
    cover: [172, 180, 171],
    coverLight: [193, 200, 192],
    coverDark: [138, 147, 139],
    // 드롭 대상
    box: [204, 181, 142],
    boxLight: [222, 203, 170],
    boxShade: [178, 154, 114],
    boxDark: [112, 95, 68],
    bin: [178, 182, 184],
    binLight: [204, 208, 210],
    binShade: [150, 155, 158],
    basket: [201, 209, 217],
    basketLight: [222, 228, 234],
    basketShade: [168, 179, 190],
    sticker: [252, 251, 247],
    ink: [70, 64, 56],
    subInk: [125, 117, 107]
  },

  // 데이터에 look이 없을 때 종류마다 쓰는 모양
  DEFAULT_LOOK: {
    ex_gift: 'box', own_goods: 'box', photo: 'photo', trash: 'paper',
    laundry: 'shirt', blanket: 'blanket', stain: 'stain'
  },

  // ---------- 좌표 도구 ----------
  rect4(x, y, w, h) {
    return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  },

  rrect(x, y, w, h, r, seg = 4) {
    r = Math.min(r, w / 2, h / 2);
    const pts = [];
    const corners = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
    for (const [cx, cy, a0] of corners) {
      for (let i = 0; i <= seg; i++) {
        const a = a0 + (Math.PI / 2) * i / seg;
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
    }
    return pts;
  },

  oval(cx, cy, w, h, n = 28) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      pts.push([cx + w / 2 * Math.cos(a), cy + h / 2 * Math.sin(a)]);
    }
    return pts;
  },

  shift(pts, dx, dy) {
    return pts.map(p => [p[0] + dx, p[1] + dy]);
  },

  hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  },

  // 같은 씨앗이면 같은 수열을 낸다. 구긴 종이나 얼룩 모양이 프레임마다 바뀌지 않게 한다.
  rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  },

  // 가장자리가 고르지 않은 둥근 덩어리(구긴 종이, 얼룩)
  blob(cx, cy, rw, rh, seed, n = 13, k = 0.25) {
    const r = this.rng(seed);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      const f = 1 - k + r() * k * 2;
      pts.push([cx + Math.cos(a) * rw * f, cy + Math.sin(a) * rh * f]);
    }
    return pts;
  },

  // 가장자리가 물결치는 사각형(옷더미, 이불)
  wavy(x, y, w, h, seed, amp = 4) {
    const r = this.rng(seed);
    const pts = [];
    const n = Math.max(6, Math.round(w / 22));
    const m = Math.max(3, Math.round(h / 22));
    for (let i = 0; i <= n; i++) pts.push([x + w * i / n, y + (r() - 0.5) * amp * 2]);
    for (let i = 1; i <= m; i++) pts.push([x + w + (r() - 0.5) * amp, y + h * i / m]);
    for (let i = n - 1; i >= 0; i--) pts.push([x + w * i / n, y + h + (r() - 0.5) * amp]);
    for (let i = m - 1; i >= 1; i--) pts.push([x + (r() - 0.5) * amp, y + h * i / m]);
    return pts;
  },

  // 머그 손잡이처럼 오른쪽으로 열린 C 모양
  handle(x0, cy, rw, rh, t) {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + Math.PI * i / 10;
      pts.push([x0 + rw * Math.cos(a), cy + rh / 2 * Math.sin(a)]);
    }
    for (let i = 10; i >= 0; i--) {
      const a = -Math.PI / 2 + Math.PI * i / 10;
      pts.push([x0 + (rw - t) * Math.cos(a), cy + (rh / 2 - t) * Math.sin(a)]);
    }
    return pts;
  },

  darker(c, f = 0.88) {
    return [Math.round(c[0] * f), Math.round(c[1] * f), Math.round(c[2] * f)];
  },

  // ---------- 붓 ----------
  // alpha는 지금 그리는 것의 불투명도(연 덮개, 닦는 얼룩), weight는 외곽선 굵기(마우스를 올리면 굵어진다)다.
  alpha: 1,
  weight: 2,

  begin(alpha = 1, weight = 2) {
    push();
    strokeJoin(ROUND);
    strokeCap(ROUND);
    this.alpha = alpha;
    this.weight = weight;
  },

  end() {
    pop();
    this.alpha = 1;
    this.weight = 2;
  },

  poly(pts, col, o = {}) {
    if (col) fill(col[0], col[1], col[2], (col.length > 3 ? col[3] : 255) * this.alpha);
    else noFill();
    if (o.stroke === false) {
      noStroke();
    } else {
      const c = o.line || this.C.ink;
      stroke(c[0], c[1], c[2], 255 * this.alpha);
      strokeWeight(o.sw !== undefined ? o.sw : this.weight);
    }
    beginShape();
    for (const p of pts) vertex(p[0], p[1]);
    endShape(CLOSE);
  },

  seg(x1, y1, x2, y2, col, sw = 2) {
    const c = col || this.C.ink;
    stroke(c[0], c[1], c[2], 255 * this.alpha);
    strokeWeight(sw);
    line(x1, y1, x2, y2);
  },

  open(pts, col, sw = 2) {
    const c = col || this.C.ink;
    noFill();
    stroke(c[0], c[1], c[2], 255 * this.alpha);
    strokeWeight(sw);
    beginShape();
    for (const p of pts) vertex(p[0], p[1]);
    endShape();
  },

  // 물건 밑의 그림자. 들어 올린 만큼(lift) 그림자를 아래로 더 내린다.
  drop(pts, lift = 0) {
    this.poly(this.shift(pts, 4 + lift * 0.6, 5 + lift), this.C.shadow, { stroke: false });
  },

  // 가운데 정렬 글자
  write(str, x, y, size, o = {}) {
    const c = o.col || this.C.ink;
    noStroke();
    fill(c[0], c[1], c[2], 255 * this.alpha);
    textStyle(o.bold ? BOLD : NORMAL);
    textAlign(o.align || CENTER, CENTER);
    textSize(size);
    text(str, x, y);
  },

  // 이름표. dark면 짙은 바탕에 흰 글자다.
  chip(str, cx, cy, size, dark) {
    textStyle(BOLD);
    textSize(size);
    const w = textWidth(str) + size * 1.3;
    const h = size * 1.7;
    this.poly(this.rrect(cx - w / 2, cy - h / 2, w, h, 6), dark ? this.C.ink : [255, 255, 255], { sw: 1.5 });
    this.write(str, cx, cy + 1, size, { bold: true, col: dark ? [255, 255, 255] : this.C.ink });
    return w;
  },

  // ---------- 물건 ----------
  // 물건 하나를 r 자리에 그린다. o: { hover, lift, debug }
  item(s, r, o = {}) {
    const kind = s.def.kind;
    const look = s.def.look || this.DEFAULT_LOOK[kind];
    const lift = o.lift !== undefined ? o.lift : (o.hover ? 3 : 0);
    let main = this.C.item;
    let shade = this.C.itemShade;
    if (kind === 'trash') { main = this.C.trash; shade = this.C.trashShade; }
    if (kind === 'laundry') { main = this.C.laundry; shade = this.C.laundryShade; }
    if (kind === 'blanket') { main = this.C.blanket; shade = this.C.blanketShade; }
    if (kind === 'stain') { main = this.C.stain; shade = this.C.stain; }
    if (o.debug && UI.DEBUG_FILL[kind]) { main = UI.DEBUG_FILL[kind]; shade = this.darker(main); }
    const alpha = kind === 'stain' ? CONFIG.STAIN_START_ALPHA / 255 * (1 - ItemManager.wipeProgress(s)) : 1;

    this.begin(alpha, o.hover ? 3.4 : 2);
    translate(0, -lift);
    // 아무렇게나 던져 둔 쓰레기와 빨래는 조금씩 기울여 그린다(개어 둔 옷은 반듯하게). 누르는 영역은 그대로 사각형이다.
    if ((kind === 'trash' || kind === 'laundry') && look !== 'folded') {
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      translate(cx, cy);
      rotate(((this.hash(s.def.id) % 17) - 8) / 80);
      translate(-cx, -cy);
    }
    (this.LOOKS[look] || this.LOOKS.box)(r.x, r.y, r.w, r.h, { main, shade, lift, s });
    this.end();
  },

  // 모양마다 그리는 함수. k: { main, shade, lift, s }
  LOOKS: {
    // 작은 상자(위에서 비스듬히 본 모습)
    box(x, y, w, h, k) {
      const A = ART, bx = x + 10, bw = w - 20, by = y + 4, bh = h - 6, ty = by + bh * 0.5;
      A.drop(A.rect4(bx, by, bw, bh), k.lift);
      A.poly(A.rect4(bx, ty, bw, by + bh - ty), k.shade);
      A.poly(A.rect4(bx, by, bw, ty - by), k.main);
      A.seg(bx + 2, ty + 9, bx + bw - 2, ty + 9, A.C.subInk, 1.2);
    },

    // 누워 있는 책
    book(x, y, w, h, k) {
      const A = ART, bx = x + 6, by = y + 10, bw = w - 12, bh = h - 14, ty = by + bh * 0.68;
      A.drop(A.rect4(bx, by, bw, bh), k.lift);
      A.poly(A.rect4(bx, ty, bw, by + bh - ty), k.shade);
      A.poly(A.rect4(bx, by, bw, ty - by), k.main);
      A.poly(A.rect4(bx + 8, by, 14, ty - by), k.shade, { sw: 1.4 });
      A.seg(bx + 6, (ty + by + bh) / 2, bx + bw - 6, (ty + by + bh) / 2, A.C.subInk, 1);
    },

    // 지퍼 달린 파우치
    pouch(x, y, w, h, k) {
      const A = ART, p = A.rrect(x + 4, y + 14, w - 8, h - 18, (h - 18) / 2);
      A.drop(p, k.lift);
      A.poly(p, k.main);
      A.seg(x + 18, y + 27, x + w - 18, y + 27, A.C.subInk, 1.3);
      A.poly(A.rect4(x + w - 36, y + 23, 12, 9), k.shade, { sw: 1.2 });
    },

    // 머그컵
    mug(x, y, w, h, k) {
      const A = ART, bh = h - 12, bw = Math.min(w * 0.55, bh * 1.05);
      const bx = x + w / 2 - bw / 2 - 10, by = y + 8;
      const body = A.rrect(bx, by, bw, bh, 9);
      A.drop(body, k.lift);
      A.poly(A.handle(bx + bw - 2, by + bh * 0.52, 24, bh * 0.56, 8), k.main);
      A.poly(body, k.main);
      A.poly(A.oval(bx + bw / 2, by + 3, bw - 2, 14), k.shade, { sw: 1.5 });
    },

    // 옆으로 누운 병
    bottle(x, y, w, h, k) {
      const A = ART, bh = h - 26, by = y + 16;
      A.drop(A.rect4(x + 8, by, w - 16, bh), k.lift);
      A.poly(A.rect4(x + w - 42, by + bh * 0.25, 20, bh * 0.5), k.main);
      A.poly(A.rrect(x + w - 24, by + bh * 0.16, 16, bh * 0.68, 3), k.shade);
      A.poly(A.rrect(x + 8, by, w - 46, bh, bh / 2), k.main);
      A.poly(A.rect4(x + 34, by + 5, (w - 46) * 0.42, bh - 10), k.shade, { sw: 1.2 });
    },

    // 사진. 책상에서는 세워 둔 액자이고, 바닥에서는 비뚤게 떨어진 인화지다.
    photo(x, y, w, h, k) {
      const A = ART;
      if (k.s.def.zone === 'floor') {
        push();
        translate(x + w / 2, y + h / 2);
        rotate(-0.08);
        const f = A.rect4(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12);
        A.drop(f, k.lift);
        A.poly(f, k.main);
        A.figures(-w / 2 + 14, -h / 2 + 14, w - 28, h - 34);
        pop();
        return;
      }
      const f = A.rect4(x + 10, y + 2, w - 20, h - 12);
      A.drop(f, k.lift);
      A.poly(A.rect4(x + 24, y + h - 14, w - 48, 12), k.shade);
      A.poly(f, k.main);
      A.figures(x + 20, y + 12, w - 40, h - 32);
    },

    // 구긴 종이
    paper(x, y, w, h, k) {
      const A = ART, cx = x + w / 2, cy = y + h / 2 + 2;
      const p = A.blob(cx, cy, Math.min(w * 0.42, h * 0.75), h * 0.44, A.hash(k.s.def.id), 11, 0.22);
      A.drop(p, k.lift);
      A.poly(p, k.main);
      A.open([[cx - w * 0.14, cy - h * 0.15], [cx, cy + h * 0.08], [cx + w * 0.13, cy - h * 0.1]], A.C.subInk, 1.2);
      A.seg(cx - w * 0.05, cy + h * 0.22, cx + w * 0.1, cy + h * 0.26, A.C.subInk, 1);
    },

    // 과자 봉지
    wrapper(x, y, w, h, k) {
      const A = ART, p = [], n = 6, top = y + 10, bot = y + h - 8;
      for (let i = 0; i <= n; i++) p.push([x + 8 + (i % 2) * 8, top + (bot - top) * i / n]);
      for (let i = n; i >= 0; i--) p.push([x + w - 8 - (i % 2) * 8, top + (bot - top) * i / n]);
      A.drop(p, k.lift);
      A.poly(p, k.main);
      A.poly(A.rect4(x + w * 0.38, top + 2, w * 0.22, bot - top - 4), k.shade, { sw: 1.2 });
    },

    // 옆으로 누운 캔
    can(x, y, w, h, k) {
      const A = ART, cy = y + h / 2 + 2, ch = h - 22, cx0 = x + 16, cx1 = x + w - 22;
      A.drop(A.rect4(cx0 - 8, cy - ch / 2, cx1 - cx0 + 16, ch), k.lift);
      A.poly(A.rect4(cx0, cy - ch / 2, cx1 - cx0, ch), k.main);
      A.poly(A.oval(cx0, cy, 16, ch), k.main);
      A.poly(A.oval(cx1, cy, 16, ch), k.shade);
      A.seg(cx0 + 24, cy - ch / 2, cx0 + 24, cy + ch / 2, A.C.subInk, 1.1);
    },

    // 펼쳐진 티셔츠
    shirt(x, y, w, h, k) {
      const A = ART, cx = x + w / 2, t = y + 5, b = y + h - 3, bw = w * 0.22, sw = w * 0.47;
      const p = [[cx - 13, t], [cx - bw - 6, t + 2], [cx - sw, t + 16], [cx - sw + 10, t + 34], [cx - bw, t + 26],
        [cx - bw, b], [cx + bw, b], [cx + bw, t + 26], [cx + sw - 10, t + 34], [cx + sw, t + 16], [cx + bw + 6, t + 2], [cx + 13, t]];
      A.drop(p, k.lift);
      A.poly(p, k.main);
      A.open([[cx - 13, t], [cx, t + 9], [cx + 13, t]], A.C.ink, 1.4);
      A.seg(cx - bw + 8, b - 12, cx + bw - 8, b - 12, k.shade, 2);
    },

    // 개어 둔 옷 한 벌
    folded(x, y, w, h, k) {
      const A = ART, bx = x + 8, bw = w - 16, by = y + 12, bh = h - 14, ty = by + bh * 0.62;
      A.drop(A.rect4(bx, by, bw, bh), k.lift);
      A.poly(A.rect4(bx, ty, bw, by + bh - ty), k.shade);
      A.poly(A.rect4(bx, by, bw, ty - by), k.main);
      A.open([[bx + bw / 2 - 16, by], [bx + bw / 2, by + 12], [bx + bw / 2 + 16, by]], A.C.ink, 1.4);
      A.seg(bx + 4, ty + 8, bx + bw - 4, ty + 8, A.C.subInk, 1);
    },

    // 양말 한 켤레
    socks(x, y, w, h, k) {
      const A = ART;
      for (const [dx, dy] of [[0, 0], [w * 0.36, 4]]) {
        const sx = x + 14 + dx, sy = y + 6 + dy, L = h - 16;
        const p = [[sx, sy], [sx + 22, sy], [sx + 24, sy + L * 0.55], [sx + 48, sy + L * 0.62], [sx + 50, sy + L], [sx + 4, sy + L]];
        A.drop(p, k.lift);
        A.poly(p, k.main);
        A.seg(sx + 2, sy + 9, sx + 21, sy + 9, A.C.subInk, 1.2);
      }
    },

    // 옆으로 눕힌 바지. 허리는 왼쪽, 두 다리는 오른쪽이다.
    pants(x, y, w, h, k) {
      const A = ART, t = y + 6, b = y + h - 4, l = x + 10, r = x + w - 10, H = b - t;
      const p = [[l, t + 4], [l + 34, t], [r, t + 6], [r, t + H * 0.42], [l + 58, t + H * 0.5],
        [r - 4, t + H * 0.58], [r - 2, b], [l + 30, b], [l, b - 6]];
      A.drop(p, k.lift);
      A.poly(p, k.main);
      A.seg(l + 30, t + 2, l + 30, b - 2, A.C.subInk, 1.2);
    },

    // 이불. 쓸 때마다 낮아지고, 다 개면 납작하게 접힌 더미가 된다.
    blanket(x, y, w, h, k) {
      const A = ART, s = k.s;
      if (s.status === 'done') {
        const ty = y + h * 0.45;
        A.drop(A.rect4(x + 10, y, w - 20, h), k.lift);
        A.poly(A.rect4(x + 10, ty, w - 20, y + h - ty), k.shade);
        A.poly(A.rect4(x + 10, y, w - 20, ty - y), k.main);
        for (const f of [0.33, 0.66]) A.seg(x + 10 + (w - 20) * f, y + 3, x + 10 + (w - 20) * f, ty - 3, k.shade, 2);
        return;
      }
      const p = A.rrect(x + 6, y + 6, w - 12, h - 12, Math.min(28, (h - 12) / 2));
      A.drop(p, k.lift);
      A.poly(p, k.main);
      // 접은 횟수만큼 위쪽에 접힌 띠가 생긴다
      for (let i = 0; i < s.foldStrokes; i++) A.poly(A.rect4(x + 10, y + 8 + i * 9, w - 20, 8), k.shade, { sw: 1.2 });
      const r = A.rng(A.hash(s.def.id) + 1);
      for (let i = 0; i < 3; i++) {
        const yy = y + h * (0.38 + 0.18 * i);
        if (yy > y + h - 14) break;
        A.open([[x + w * 0.16, yy + (r() - 0.5) * 8], [x + w * 0.46, yy + 8], [x + w * 0.8, yy - 4]], k.shade, 2);
      }
    },

    // 얼룩. 외곽선 없이 닦은 만큼 옅어진다.
    stain(x, y, w, h, k) {
      const A = ART, id = A.hash(k.s.def.id);
      A.poly(A.blob(x + w / 2, y + h / 2, w * 0.42, h * 0.4, id, 15, 0.18), k.main, { stroke: false });
      A.poly(A.blob(x + w * 0.78, y + h * 0.78, w * 0.06, h * 0.08, id + 3, 9, 0.2), k.main, { stroke: false });
      A.poly(A.blob(x + w * 0.16, y + h * 0.24, w * 0.05, h * 0.07, id + 5, 9, 0.2), k.main, { stroke: false });
    }
  },

  // 사진 속 두 사람
  figures(ix, iy, iw, ih) {
    this.poly(this.rect4(ix, iy, iw, ih), this.C.photoIn, { sw: 1.4 });
    // 머리와 몸의 크기는 사진 높이에 맞춘다. 작은 액자와 회상 화면의 큰 사진이 같은 모양이 된다.
    for (const [fx, s] of [[0.37, 1], [0.63, 0.9]]) {
      const head = ih * 0.24 * s, body = ih * 0.45 * s;
      this.poly(this.oval(ix + iw * fx, iy + ih * 0.4, head, head, 16), this.C.photoFig, { stroke: false });
      this.poly(this.rrect(ix + iw * fx - body / 2, iy + ih * 0.6, body, ih * 0.4, body * 0.35), this.C.photoFig, { stroke: false });
    }
  },

  // 물건 모양 안쪽에서 바탕색이 칠해지는 한 점. tools/e2e.js가 색을 읽을 때 쓴다.
  probe(s) {
    const d = s.def;
    const r = ItemManager.currentRect(s);
    const look = d.look || this.DEFAULT_LOOK[d.kind];
    const at = {
      box: [0.5, 0.28], book: [0.62, 0.36], pouch: [0.3, 0.72], mug: [0.3, 0.62], bottle: [0.16, 0.5],
      photo: [0.12, 0.5], paper: [0.3, 0.62], wrapper: [0.24, 0.5], can: [0.3, 0.68], shirt: [0.5, 0.72],
      folded: [0.3, 0.4], socks: [0.18, 0.6], pants: [0.5, 0.25], blanket: [0.5, 0.25], stain: [0.5, 0.5]
    }[look] || [0.5, 0.5];
    return { x: r.x + r.w * at[0], y: r.y + r.h * at[1] };
  },

  // 닫힌 덮개 모양 안쪽에서 덮개 색이 칠해지는 한 점. tools/e2e.js가 색을 읽을 때 쓴다.
  coverProbe(c) {
    const d = c.def;
    const at = {
      drawer: [0.5, 0.14], books: [0.5, 0.5], notes: [0.5, 0.5], pile: [0.5, 0.79], shopbag: [0.5, 0.7],
      pillow: [0.5, 0.5], cushion: [0.3, 0.75], throw: [0.5, 0.35], towel: [0.5, 0.45], parcel: [0.25, 0.75], bag: [0.5, 0.8]
    }[d.look] || [0.5, 0.5];
    return { x: d.x + d.w * at[0], y: d.y + d.h * at[1] };
  },

  // ---------- 덮개 ----------
  // 닫힌 덮개는 이름에 맞는 모양으로, 연 덮개는 흐리게 남긴다(서랍은 열린 서랍 속을 그린다). o: { hover }
  cover(c, o = {}) {
    const d = c.def;
    const look = d.look || 'parcel';
    if (c.open) {
      if (look === 'drawer') {
        this.begin(1, 1.5);
        this.poly(this.rect4(d.x, d.y + 6, d.w, d.h - 6), this.C.cover);
        this.poly(this.rect4(d.x + 8, d.y + 12, d.w - 16, d.h - 20), this.C.coverDark, { sw: 1.2 });
        this.end();
        return;
      }
      this.begin(0.28, 1.5);
      (this.COVER_LOOKS[look] || this.COVER_LOOKS.parcel)(d.x, d.y, d.w, d.h, this.hash(d.id), 0);
      this.end();
      push();
      noFill();
      stroke(...this.C.coverDark);
      strokeWeight(1.5);
      drawingContext.setLineDash([6, 6]);
      rect(d.x + 2, d.y + 2, d.w - 4, d.h - 4, 12);
      drawingContext.setLineDash([]);
      pop();
      return;
    }
    const lift = o.hover ? 3 : 0;
    this.begin(1, o.hover ? 3.4 : 2);
    translate(0, -lift);
    (this.COVER_LOOKS[look] || this.COVER_LOOKS.parcel)(d.x, d.y, d.w, d.h, this.hash(d.id), lift);
    this.end();
  },

  COVER_LOOKS: {
    // 서랍(책상 위 작은 서랍장, 옷장 아래 서랍)
    drawer(x, y, w, h, seed, lift) {
      const A = ART, C = A.C, ty = y + h * 0.28;
      A.drop(A.rect4(x, y, w, h), lift);
      A.poly(A.rect4(x, ty, w, y + h - ty), C.cover);
      A.poly(A.rect4(x, y, w, ty - y), C.coverLight);
      const fh = (y + h - ty - 12) / 2;
      for (let i = 0; i < 2; i++) {
        const fy = ty + 6 + i * (fh + 2);
        A.poly(A.rect4(x + 8, fy, w - 16, fh - 2), C.coverLight, { sw: 1.4 });
        A.poly(A.rect4(x + w / 2 - 14, fy + fh / 2 - 4, 28, 6), C.coverDark, { sw: 1 });
      }
    },

    // 책 더미
    books(x, y, w, h, seed, lift) {
      const A = ART, C = A.C, n = 3, lh = (h - 8) / n;
      A.drop(A.rect4(x + 4, y + 8, w - 8, h - 8), lift);
      for (let i = 0; i < n; i++) {
        const off = [6, -4, 10][i];
        const yy = y + 8 + i * lh;
        A.poly(A.rect4(x + 8 + off, yy, w - 24, lh - 2), i % 2 ? C.coverLight : C.cover, { sw: 1.6 });
        A.seg(x + 18 + off, yy + 3, x + 18 + off, yy + lh - 5, C.coverDark, 1.4);
      }
    },

    // 공책 더미: 책 더미보다 얇은 것이 여러 권
    notes(x, y, w, h, seed, lift) {
      const A = ART, C = A.C, n = 5, lh = (h - 10) / n;
      A.drop(A.rect4(x + 4, y + 10, w - 8, h - 10), lift);
      for (let i = 0; i < n; i++) {
        const off = [2, -3, 5, 0, 4][i];
        A.poly(A.rect4(x + 8 + off, y + 10 + i * lh, w - 20, lh - 1), i % 2 ? C.coverLight : C.cover, { sw: 1.3 });
      }
    },

    // 옷더미
    pile(x, y, w, h, seed, lift) {
      const A = ART, C = A.C;
      A.drop(A.rect4(x + 6, y + 14, w - 12, h - 16), lift);
      for (let i = 0; i < 3; i++) {
        A.poly(A.wavy(x + 6 + i * 5, y + 10 + i * (h - 20) / 3, w - 16 - i * 8, (h - 20) / 3 + 8, seed + i, 3), i % 2 ? C.coverLight : C.cover, { sw: 1.6 });
      }
    },

    // 쇼핑백
    shopbag(x, y, w, h, seed, lift) {
      const A = ART, C = A.C, b = [[x + 8, y + 28], [x + w - 8, y + 28], [x + w - 14, y + h - 2], [x + 14, y + h - 2]];
      A.drop(b, lift);
      A.open([[x + w * 0.32, y + 30], [x + w * 0.36, y + 8], [x + w * 0.6, y + 8], [x + w * 0.64, y + 30]], C.ink, 2);
      A.poly(b, C.cover);
      A.poly(A.rect4(x + 8, y + 28, w - 16, 10), C.coverDark, { sw: 1.4 });
    },

    // 베개
    pillow(x, y, w, h, seed, lift) {
      const A = ART, C = A.C, p = A.rrect(x + 4, y + 8, w - 8, h - 14, 22);
      A.drop(p, lift);
      A.poly(p, C.coverLight);
      A.poly(A.rrect(x + 16, y + 18, w - 32, h - 34, 14), null, { sw: 1.1, line: C.coverDark });
    },

    // 쿠션
    cushion(x, y, w, h, seed, lift) {
      const A = ART, C = A.C, p = A.rrect(x + 16, y + 4, w - 32, h - 8, 18);
      A.drop(p, lift);
      A.poly(p, C.cover);
      A.seg(x + 30, y + 16, x + w / 2 - 6, y + h / 2 - 4, C.coverDark, 1.4);
      A.seg(x + w - 30, y + h - 16, x + w / 2 + 6, y + h / 2 + 4, C.coverDark, 1.4);
      A.poly(A.oval(x + w / 2, y + h / 2, 12, 12, 12), C.coverDark, { sw: 1.2 });
    },

    // 개어 둔 담요
    throw(x, y, w, h, seed, lift) {
      const A = ART, C = A.C, ty = y + 6 + (h - 8) * 0.7;
      A.drop(A.rect4(x + 2, y + 6, w - 4, h - 8), lift);
      A.poly(A.rect4(x + 2, ty, w - 4, y + h - 2 - ty), C.coverDark);
      A.poly(A.rect4(x + 2, y + 6, w - 4, ty - y - 6), C.cover);
      for (const f of [0.18, 0.82]) A.seg(x + 2 + (w - 4) * f, y + 9, x + 2 + (w - 4) * f, ty - 3, C.coverLight, 4);
    },

    // 수건
    towel(x, y, w, h, seed, lift) {
      const A = ART, C = A.C, ty = y + 8 + (h - 10) * 0.66;
      A.drop(A.rect4(x + 4, y + 8, w - 8, h - 10), lift);
      A.poly(A.rect4(x + 4, ty, w - 8, y + h - 2 - ty), C.coverDark);
      A.poly(A.rect4(x + 4, y + 8, w - 8, ty - y - 8), C.coverLight);
      A.seg(x + 10, y + 16, x + w - 10, y + 16, C.cover, 4);
      A.seg(x + 10, ty - 8, x + w - 10, ty - 8, C.cover, 4);
    },

    // 택배 상자
    parcel(x, y, w, h, seed, lift) {
      const A = ART, C = A.C, ty = y + 2 + (h - 4) * 0.5;
      A.drop(A.rect4(x + 4, y + 2, w - 8, h - 4), lift);
      A.poly(A.rect4(x + 4, ty, w - 8, y + h - 2 - ty), C.cover);
      A.poly(A.rect4(x + 4, y + 2, w - 8, ty - y - 2), C.coverLight);
      A.poly(A.rect4(x + w / 2 - 10, y + 2, 20, ty - y - 2), C.cover, { sw: 1.2 });
      A.poly(A.rect4(x + w / 2 - 10, ty, 20, 14), C.coverDark, { sw: 1.2 });
    },

    // 가방
    bag(x, y, w, h, seed, lift) {
      const A = ART, C = A.C, p = A.rrect(x + 10, y + 24, w - 20, h - 26, 14);
      A.drop(p, lift);
      A.open([[x + w * 0.34, y + 26], [x + w * 0.38, y + 6], [x + w * 0.62, y + 6], [x + w * 0.66, y + 26]], C.ink, 3);
      A.poly(p, C.cover);
      A.poly(A.rrect(x + 10, y + 24, w - 20, (h - 26) * 0.45, 12), C.coverLight, { sw: 1.4 });
    }
  },

  // ---------- 드롭 대상 ----------
  // 이름표에 이름과 넣은 개수를 쓴다. 물건을 들고 위에 올라가 있으면(highlight) 밝아지고 외곽선이 굵어진다.
  target(t, count, highlight, name) {
    this.begin(1, highlight ? 4 : 2);
    if (highlight) {
      noFill();
      stroke(...this.C.ink);
      strokeWeight(2);
      drawingContext.setLineDash([10, 7]);
      rect(t.x, t.y, t.w, t.h, 12);
      drawingContext.setLineDash([]);
    }
    const labelY = (this.TARGET_LOOKS[t.type] || this.TARGET_LOOKS.hide)(t.x, t.y, t.w, t.h, highlight);
    this.sticker(name, count + '개', t.x + t.w / 2, labelY);
    this.end();
  },

  // 드롭 대상의 이름표
  sticker(name, sub, cx, cy) {
    textStyle(BOLD);
    textSize(17);
    const w = Math.max(textWidth(name), 40) + 26;
    this.poly(this.rrect(cx - w / 2, cy - 22, w, 44, 6), this.C.sticker, { sw: 1.5 });
    this.write(name, cx, cy - 8, 17, { bold: true });
    this.write(sub, cx, cy + 12, 14, { col: this.C.subInk });
  },

  // 대상마다 모양을 그리고 이름표를 둘 y를 돌려준다.
  TARGET_LOOKS: {
    // 뚜껑이 열린 종이 상자
    hide(x, y, w, h, hl) {
      const A = ART, C = A.C, fx = x + 24, fw = w - 48, oy = y + 38, fy = y + 64, by = y + h - 4;
      A.drop(A.rect4(fx, oy, fw, by - oy), 0);
      A.poly([[fx + 8, oy], [fx + 26, y + 8], [fx + fw - 26, y + 8], [fx + fw - 8, oy]], C.boxShade);
      A.poly([[fx, oy], [fx - 22, oy - 12], [fx - 18, fy - 6], [fx, fy]], C.boxShade);
      A.poly([[fx + fw, oy], [fx + fw + 22, oy - 12], [fx + fw + 18, fy - 6], [fx + fw, fy]], C.boxShade);
      A.poly(A.rect4(fx, oy, fw, fy - oy), C.boxDark);
      A.poly(A.rect4(fx, fy, fw, by - fy), hl ? C.boxLight : C.box);
      return fy + (by - fy) / 2;
    },

    // 휴지통
    trash(x, y, w, h, hl) {
      const A = ART, C = A.C, cw = Math.min(w * 0.74, 150), cx = x + w / 2, ty = y + 18, by = y + h - 2;
      const body = [[cx - cw / 2, ty], [cx + cw / 2, ty], [cx + cw / 2 - 14, by], [cx - cw / 2 + 14, by]];
      A.drop(body, 0);
      A.poly(body, hl ? C.binLight : C.bin);
      for (let i = 1; i < 5; i++) {
        const t = i / 5;
        A.seg(cx - cw / 2 + cw * t, ty + 14, cx - cw / 2 + 14 + (cw - 28) * t, by - 6, C.binShade, 1.4);
      }
      A.poly(A.oval(cx, ty, cw, 24), C.binShade);
      A.poly(A.oval(cx, ty + 1, cw - 14, 14), C.hole, { stroke: false });
      return y + h * 0.6;
    },

    // 빨래 바구니
    laundry(x, y, w, h, hl) {
      const A = ART, C = A.C, cw = w - 16, cx = x + w / 2, ty = y + 18, by = y + h - 2;
      const body = [[cx - cw / 2, ty], [cx + cw / 2, ty], [cx + cw / 2 - 12, by], [cx - cw / 2 + 12, by]];
      A.drop(body, 0);
      A.poly(body, hl ? C.basketLight : C.basket);
      for (let yy = ty + 22; yy < by - 4; yy += 14) {
        const f = (yy - ty) / (by - ty);
        A.seg(cx - cw / 2 + 12 * f + 3, yy, cx + cw / 2 - 12 * f - 3, yy, C.basketShade, 1.3);
      }
      A.poly(A.oval(cx, ty, cw, 26), C.basketShade);
      A.poly(A.oval(cx, ty + 1, cw - 16, 14), C.hole, { stroke: false });
      A.poly(A.rrect(cx - cw / 2 + 12, ty + 16, 26, 10, 5), C.hole, { stroke: false });
      A.poly(A.rrect(cx + cw / 2 - 38, ty + 16, 26, 10, 5), C.hole, { stroke: false });
      return y + h * 0.62;
    }
  },

  // ---------- 근접 컷 바탕 ----------
  backdrop(zoneId) {
    this.begin(1, 2);
    noStroke();
    const fn = this.BACKDROPS[zoneId];
    if (fn) fn();
    this.end();
  },

  BACKDROPS: {
    // 책상 윗면을 위에서 비스듬히 본다. 뒤쪽 벽에는 게시판 아래쪽이 보인다.
    desk() {
      const A = ART, C = A.C;
      A.poly(A.rect4(0, 0, 1280, 720), C.floor, { stroke: false });
      A.poly(A.rect4(0, 0, 1280, 132), C.wall, { stroke: false });
      A.poly(A.rect4(380, 0, 520, 112), C.cork);
      A.poly(A.rect4(420, 0, 70, 70), C.paper, { sw: 1.4 });
      A.poly(A.rect4(520, 0, 96, 52), C.paper, { sw: 1.4 });
      A.poly(A.rect4(780, 0, 72, 84), C.paper, { sw: 1.4 });
      A.poly(A.rect4(0, 500, 1280, 220), C.floor, { stroke: false });
      A.poly(A.rect4(0, 500, 1280, 44), C.floorShade, { stroke: false });
      A.poly(A.rect4(24, 132, 1232, 340), C.top);
      for (const yy of [196, 268, 352, 438]) A.seg(42, yy, 1238, yy, C.topLine, 2);
      A.poly(A.rect4(24, 472, 1232, 28), C.front);
    },

    // 문을 연 옷장 안. 위 칸 선반과 아래 칸 바닥, 그 밑의 서랍 자리가 있다.
    closet() {
      const A = ART, C = A.C;
      A.poly(A.rect4(0, 0, 1280, 616), C.wall, { stroke: false });
      A.poly(A.rect4(0, 616, 1280, 104), C.floor, { stroke: false });
      A.poly([[4, 104], [36, 96], [36, 624], [4, 612]], C.front);
      A.poly([[1276, 104], [1244, 96], [1244, 624], [1276, 612]], C.front);
      A.poly(A.rect4(36, 96, 1208, 528), C.front);
      A.poly(A.rect4(58, 116, 1164, 384), C.inside);
      // 옷걸이 봉과 빈 옷걸이
      A.seg(70, 138, 1210, 138, C.side, 6);
      for (const hx of [180, 470, 660, 1080]) {
        A.open([[hx, 138], [hx, 146], [hx - 34, 172], [hx + 34, 172], [hx, 146]], C.side, 2);
      }
      // 위 칸 선반
      A.poly(A.rect4(58, 318, 1164, 10), C.insideShade, { stroke: false });
      A.poly(A.rect4(58, 286, 1164, 20), C.top);
      A.poly(A.rect4(58, 306, 1164, 12), C.front);
      // 아래 칸 바닥과 받침
      A.poly(A.rect4(58, 500, 1164, 22), C.top);
      A.poly(A.rect4(36, 522, 1208, 102), C.front);
    },

    // 침대를 위에서 비스듬히 본다. 머리맡은 왼쪽이다.
    bed() {
      const A = ART, C = A.C;
      A.poly(A.rect4(0, 0, 1280, 720), C.floor, { stroke: false });
      A.poly(A.rect4(0, 0, 1280, 104), C.wall, { stroke: false });
      A.poly(A.rect4(0, 96, 1280, 12), C.front);
      A.poly(A.rect4(0, 560, 1280, 36), C.floorShade, { stroke: false });
      A.poly(A.rect4(30, 532, 1226, 28), C.front);
      A.poly(A.rect4(40, 478, 1206, 54), C.sheetShade);
      A.poly(A.rect4(40, 140, 1206, 338), C.sheet);
      A.seg(56, 470, 1230, 470, C.sheetShade, 2);
      A.poly(A.rrect(18, 110, 34, 450, 8), C.front);
      A.poly(A.rrect(1240, 170, 26, 390, 8), C.front);
    },

    // 바닥을 위에서 본다. 마루 널과 러그가 있다.
    floor() {
      const A = ART, C = A.C;
      A.poly(A.rect4(0, 0, 1280, 112), C.wall, { stroke: false });
      A.poly(A.rect4(0, 112, 1280, 608), C.floor, { stroke: false });
      A.poly(A.rect4(0, 100, 1280, 14), C.front);
      const r = A.rng(7);
      for (let yy = 176; yy < 720; yy += 64) {
        A.seg(0, yy, 1280, yy, C.plank, 2);
        let xx = -r() * 300;
        while (xx < 1280) {
          xx += 260 + r() * 200;
          A.seg(xx, yy - 64 + 2, xx, yy - 2, C.plank, 2);
        }
      }
      A.poly(A.rrect(250, 262, 820, 290, 26), C.rug);
      A.poly(A.rrect(268, 280, 784, 254, 18), null, { line: C.rugEdge, sw: 2 });
    }
  },

  // ---------- 방 전체 ----------
  // 정면에서 본 방. hoverId는 마우스가 올라간 구역, counts는 구역별 남은 일(보여 줄 때만)이다.
  room(hoverId, counts) {
    const A = this, C = this.C;
    this.begin(1, 2);
    A.poly(A.rect4(0, 0, 1280, 500), C.wall, { stroke: false });
    A.poly(A.rect4(0, 500, 1280, 220), C.floor, { stroke: false });
    A.seg(0, 500, 1280, 500, C.floorLine, 3);
    // 창문
    A.poly(A.rect4(566, 168, 188, 116), C.glass);
    A.seg(660, 168, 660, 284, C.ink, 2);
    A.seg(566, 226, 754, 226, C.ink, 2);
    A.poly(A.rect4(552, 284, 216, 10), C.front, { sw: 1.5 });

    for (const id of ['desk', 'bed', 'closet', 'floor']) {
      this.weight = id === hoverId ? 3.4 : 2;
      this.ROOM_PARTS[id]();
    }
    this.weight = 2;

    const tags = { desk: [227, 516], bed: [646, 516], closet: [1055, 516], floor: [490, 677] };
    for (const z of ZONES) {
      const [tx, ty] = tags[z.id];
      const w = A.chip(z.name, tx, ty, 17, z.id === hoverId);
      if (counts) A.write('남은 일 ' + counts[z.id] + '개', tx + w / 2 + 10, ty + 1, 15, { col: C.subInk, align: LEFT });
    }
    this.end();
  },

  ROOM_PARTS: {
    desk() {
      const A = ART, C = A.C;
      A.poly(A.rect4(96, 150, 232, 118), C.cork);
      A.poly(A.rect4(114, 166, 48, 60), C.paper, { sw: 1.4 });
      A.poly(A.rect4(178, 176, 62, 42), C.paper, { sw: 1.4 });
      A.poly(A.rect4(256, 162, 50, 56), C.paper, { sw: 1.4 });
      A.poly(A.rect4(70, 326, 314, 12), C.top);
      A.poly(A.rect4(70, 338, 314, 12), C.front);
      A.poly(A.rect4(84, 350, 112, 150), C.front);
      for (const yy of [356, 404, 452]) {
        A.poly(A.rect4(92, yy, 96, 42), C.top, { sw: 1.4 });
        A.poly(A.rect4(128, yy + 18, 24, 6), C.dark, { sw: 1 });
      }
      A.poly(A.rect4(360, 350, 14, 150), C.side);
      A.poly([[104, 326], [128, 326], [122, 318], [110, 318]], C.side);
      A.seg(116, 318, 128, 262, C.ink, 3);
      A.poly([[116, 262], [146, 250], [154, 270], [126, 280]], C.lamp);
      A.poly(A.rect4(196, 310, 110, 16), C.item);
      A.poly([[206, 310], [296, 310], [302, 252], [212, 252]], C.itemShade);
      A.poly(A.rect4(318, 314, 40, 12), C.trash, { sw: 1.5 });
      A.poly(A.rrect(236, 300, 92, 104, 12), C.side);
      A.poly(A.rect4(226, 404, 112, 16), C.front);
      A.poly(A.rect4(240, 420, 10, 80), C.dark, { sw: 1 });
      A.poly(A.rect4(314, 420, 10, 80), C.dark, { sw: 1 });
    },

    bed() {
      const A = ART, C = A.C;
      A.poly(A.rrect(452, 290, 30, 210, 8), C.front);
      A.poly(A.rect4(474, 392, 354, 44), C.sheet);
      A.poly(A.rect4(466, 436, 368, 30), C.front);
      A.poly(A.rect4(478, 466, 12, 34), C.side, { sw: 1.4 });
      A.poly(A.rect4(812, 466, 12, 34), C.side, { sw: 1.4 });
      A.poly(A.rrect(818, 352, 22, 148, 6), C.front);
      A.poly(A.rrect(486, 360, 96, 38, 16), C.item);
      A.poly([[566, 392], [600, 372], [660, 384], [720, 366], [790, 376], [816, 392], [816, 446], [566, 446]], C.blanket);
      A.open([[620, 398], [650, 420], [700, 404]], C.blanketShade, 2);
      A.poly([[700, 352], [716, 346], [730, 352], [740, 368], [728, 372], [728, 390], [702, 390], [702, 372], [690, 368]], C.laundry, { sw: 1.5 });
    },

    closet() {
      const A = ART, C = A.C;
      A.poly(A.rect4(898, 132, 314, 14), C.top);
      A.poly(A.rect4(906, 146, 298, 334), C.front);
      A.poly(A.rect4(916, 156, 136, 314), C.top, { sw: 1.5 });
      A.poly(A.rect4(1058, 156, 136, 314), C.top, { sw: 1.5 });
      A.poly(A.rect4(1040, 280, 7, 52), C.dark, { sw: 1 });
      A.poly(A.rect4(1063, 280, 7, 52), C.dark, { sw: 1 });
      A.poly(A.rect4(906, 480, 298, 20), C.side);
      A.poly(A.rect4(1096, 102, 84, 30), C.side, { sw: 1.5 });
      A.seg(1096, 112, 1180, 112, C.ink, 1.5);
    },

    floor() {
      const A = ART, C = A.C;
      A.poly(A.rrect(110, 550, 760, 110, 40), C.rug);
      A.poly(A.rrect(126, 562, 728, 86, 30), null, { line: C.rugEdge, sw: 2 });
      A.poly(A.rect4(176, 572, 104, 34), C.coverLight);
      A.poly(A.rect4(176, 606, 104, 36), C.cover);
      A.poly(A.wavy(404, 600, 120, 40, 11, 5), C.laundry);
      A.poly(A.blob(612, 638, 20, 15, 5, 9), C.trash);
      A.poly(A.blob(340, 646, 18, 13, 9, 9), C.trash);
      A.poly(A.rrect(680, 582, 84, 56, 14), C.cover);
      A.poly(A.rect4(540, 624, 44, 34), C.item, { sw: 1.6 });
    }
  }
};
