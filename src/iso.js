// 2:1 아이소메트릭 투영과 블록 그리기를 모은다. 그림 파일 없이 p5 도형으로만 그린다.
// 바닥이나 가구 윗면 위의 점은 (u, v, z)로 적는다. u가 1 늘면 화면에서 오른쪽 아래로 (1, 0.5),
// v가 1 늘면 왼쪽 아래로 (-1, 0.5) 움직이고, z가 1 늘면 위로 1 올라간다. o는 u = v = z = 0인 점의 화면 좌표다.
// 블록은 { u, v, w, d, h, z }로 적는다. (u, v)는 바닥의 가장 안쪽 모서리, w는 u 방향 길이, d는 v 방향 길이,
// h는 높이, z는 블록 바닥의 높이(없으면 0)다. 화면에서 블록의 폭은 w + d, 윗면의 높이는 (w + d) / 2다.
// 이 파일의 계산 함수는 p5를 부르지 않아서 tools/check.js가 브라우저 없이 그대로 쓴다. 그리는 함수만 p5를 쓴다.

const Iso = {
  // 블록의 세 면은 명도만 달리 칠한다. 윗면이 가장 밝고, 빛은 왼쪽 위에서 온다고 친다.
  SHADE: { left: 0.88, right: 0.76 },
  LINE: 1.5,

  pt(o, u, v, z = 0) {
    return { x: o.x + u - v, y: o.y + (u + v) / 2 - z };
  },

  // 화면 점 p를 높이 z인 평면 위의 (u, v)로 되돌린다.
  unproject(o, p, z = 0) {
    const X = p.x - o.x;
    const Y = p.y - o.y + z;
    return { u: Y + X / 2, v: Y - X / 2 };
  },

  // 블록의 윗면, 왼쪽 앞면(v + d 쪽), 오른쪽 앞면(u + w 쪽)과 바깥 윤곽(육각형)
  faces(o, b) {
    const z0 = b.z || 0;
    const z1 = z0 + b.h;
    const P = (u, v, z) => this.pt(o, u, v, z);
    const u1 = b.u + b.w;
    const v1 = b.v + b.d;
    const top = [P(b.u, b.v, z1), P(u1, b.v, z1), P(u1, v1, z1), P(b.u, v1, z1)];
    const left = [P(b.u, v1, z1), P(u1, v1, z1), P(u1, v1, z0), P(b.u, v1, z0)];
    const right = [P(u1, v1, z1), P(u1, b.v, z1), P(u1, b.v, z0), P(u1, v1, z0)];
    const hull = [top[0], top[1], right[2], left[2], left[3], top[3]];
    return { top, left, right, hull };
  },

  // 윗면 가운데의 화면 좌표
  topCenter(o, b) {
    return this.pt(o, b.u + b.w / 2, b.v + b.d / 2, (b.z || 0) + b.h);
  },

  // 바닥 (u, v)에 놓인 납작한 타원(얼룩). 화면에서는 가로 반지름 a, 세로 반지름 a / 2인 타원이다.
  // 반지름은 블록 바닥의 짧은 변을 지름으로 하는 원에서 나온다.
  ellipse(o, b) {
    const c = this.pt(o, b.u + b.w / 2, b.v + b.d / 2, b.z || 0);
    const r = Math.min(b.w, b.d) / 2;
    return { x: c.x, y: c.y, a: r * Math.SQRT2, b: r * Math.SQRT2 / 2 };
  },

  // 타원 바깥에 접하는 n각형. 겹침 검사에 쓴다.
  ellipsePoly(e, n = 24) {
    const k = 1 / Math.cos(Math.PI / n);
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      out.push({ x: e.x + Math.cos(t) * e.a * k, y: e.y + Math.sin(t) * e.b * k });
    }
    return out;
  },

  inEllipse(e, p) {
    const dx = (p.x - e.x) / e.a;
    const dy = (p.y - e.y) / e.b;
    return dx * dx + dy * dy <= 1;
  },

  rectPoly(r) {
    return [{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h }];
  },

  // 다각형 여러 개를 감싸는 사각형
  bbox(polys) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const poly of polys) {
      for (const q of poly) {
        x0 = Math.min(x0, q.x);
        y0 = Math.min(y0, q.y);
        x1 = Math.max(x1, q.x);
        y1 = Math.max(y1, q.y);
      }
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  },

  // 점이 다각형 안(경계 포함)에 있는지. 볼록하지 않아도 되고, 같은 꼭짓점이 겹쳐 있어도 된다.
  inPoly(p, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i];
      const b = poly[j];
      if (this.segDist(p, a, b) < 1e-6) return true;
      if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
  },

  segDist(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  },

  // 볼록 다각형 두 개 사이의 거리. 서로 닿거나 겹치면 0 이하(겹치면 -1)를 돌려준다.
  // 분리축으로 겹침을 먼저 보고, 떨어져 있으면 꼭짓점과 변 사이 거리의 최솟값을 잰다.
  gap(a, b) {
    for (const poly of [a, b]) {
      for (let i = 0; i < poly.length; i++) {
        const p = poly[i];
        const q = poly[(i + 1) % poly.length];
        const nx = q.y - p.y;
        const ny = p.x - q.x;
        if (nx === 0 && ny === 0) continue;
        const proj = list => list.map(r => r.x * nx + r.y * ny);
        const pa = proj(a);
        const pb = proj(b);
        if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) {
          let d = Infinity;
          for (const [s, t] of [[a, b], [b, a]]) {
            for (const r of s) {
              for (let k = 0; k < t.length; k++) d = Math.min(d, this.segDist(r, t[k], t[(k + 1) % t.length]));
            }
          }
          return d;
        }
      }
    }
    return -1;
  },

  // 윤곽(볼록 다각형 목록) 두 개 사이의 거리
  outlineGap(A, B) {
    let d = Infinity;
    for (const a of A) for (const b of B) d = Math.min(d, this.gap(a, b));
    return d;
  },

  // ---------- 그리기(p5) ----------

  shade(c, k) {
    return [c[0] * k, c[1] * k, c[2] * k];
  },

  poly(pts) {
    beginShape();
    for (const q of pts) vertex(q.x, q.y);
    endShape(CLOSE);
  },

  // 블록 하나. opts: { weight(테두리 굵기), noTop(윗면을 칠하지 않음) }
  drawBlock(o, b, color, opts = {}) {
    const f = this.faces(o, b);
    push();
    stroke(...UI.COLOR.line);
    strokeWeight(opts.weight || this.LINE);
    fill(...this.shade(color, this.SHADE.left));
    this.poly(f.left);
    fill(...this.shade(color, this.SHADE.right));
    this.poly(f.right);
    if (!opts.noTop) {
      fill(...color);
      this.poly(f.top);
    }
    pop();
    return f;
  },

  // 위가 열린 상자(놓는 곳). 안쪽 벽을 어둡게 칠하고, 바깥 앞면 둘을 그린 뒤 윗면 테두리를 점선으로 긋는다.
  drawOpenBox(o, b, color, opts = {}) {
    const f = this.faces(o, b);
    const z0 = (b.z || 0) + 4;
    const P = (u, v, z) => this.pt(o, u, v, z);
    push();
    noStroke();
    fill(...this.shade(color, 0.58));
    this.poly(f.top);
    // 안쪽 벽 두 개: u = b.u 쪽 벽의 안쪽 면과 v = b.v 쪽 벽의 안쪽 면
    const z1 = (b.z || 0) + b.h;
    fill(...this.shade(color, 0.8));
    this.poly([f.top[0], f.top[3], P(b.u, b.v + b.d, z0), P(b.u, b.v, z0)]);
    fill(...this.shade(color, 0.7));
    this.poly([f.top[0], f.top[1], P(b.u + b.w, b.v, z0), P(b.u, b.v, z0)]);
    stroke(...UI.COLOR.line);
    strokeWeight(opts.weight || this.LINE);
    fill(...this.shade(color, this.SHADE.left));
    this.poly(f.left);
    fill(...this.shade(color, this.SHADE.right));
    this.poly(f.right);
    noFill();
    drawingContext.setLineDash([7, 5]);
    this.poly(f.top);
    drawingContext.setLineDash([]);
    pop();
    return f;
  },

  // 점선 화살표. 끝에 열린 세모 촉을 단다.
  drawArrow(a, b, opts = {}) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const head = opts.head || 12;
    push();
    noFill();
    stroke(...(opts.color || UI.COLOR.line));
    strokeWeight(opts.weight || 2.5);
    drawingContext.setLineDash(opts.solid ? [] : [9, 7]);
    line(a.x, a.y, b.x - Math.cos(ang) * 4, b.y - Math.sin(ang) * 4);
    drawingContext.setLineDash([]);
    line(b.x, b.y, b.x - Math.cos(ang - 0.5) * head, b.y - Math.sin(ang - 0.5) * head);
    line(b.x, b.y, b.x - Math.cos(ang + 0.5) * head, b.y - Math.sin(ang + 0.5) * head);
    pop();
  },

  // 손 표시. (x, y)는 집게손가락 끝이고, s는 크기 배율이다.
  drawHand(x, y, s = 1) {
    const pts = [
      [0, 0], [6, 0], [6, 14], [10, 12], [14, 13], [18, 15], [22, 17], [22, 30], [19, 38], [3, 38], [-4, 26], [-8, 19],
      [-6, 16], [-2, 18], [0, 21]
    ];
    push();
    translate(x - 3 * s, y);
    scale(s);
    fill(255, 253, 248);
    stroke(...UI.COLOR.line);
    strokeWeight(1.8 / s);
    beginShape();
    for (const [px, py] of pts) vertex(px, py);
    endShape(CLOSE);
    line(6, 14, 6, 20);
    line(10, 12, 10, 20);
    line(14, 13, 14, 20);
    pop();
  }
};
