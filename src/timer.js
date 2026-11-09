// 전역 타이머다. 인트로를 떠나는 순간 시작해서 결과 화면에 닿을 때 멈춘다.
// 매 프레임 실제로 흐른 시간(초)을 받아 남은 시간에서 빼며, 프레임 수로 세지 않는다.
// p5 함수를 쓰지 않으므로 브라우저 밖에서도 그대로 시험할 수 있다.

const GameTimer = {
  remaining: 0,     // 남은 시간(초, 소수까지)
  running: false,   // 인트로를 떠난 뒤부터 결과에 닿기 전까지 true
  paused: false,    // 개발용 일시정지. 디버그 키 P로만 켠다
  elapsed: 0,       // 타이머가 실제로 흐른 시간(초). 디버그 키 [ ] 로 남은 시간을 바꿔도 이 값은 그대로다

  reset(limitSec) {
    this.remaining = limitSec;
    this.running = false;
    this.paused = false;
    this.elapsed = 0;
  },

  start() {
    this.running = true;
  },

  stop() {
    this.running = false;
  },

  togglePause() {
    this.paused = !this.paused;
  },

  // 디버그 키 [ 와 ] 에서 쓴다. 0 아래로는 내려가지 않는다.
  addSeconds(sec) {
    this.remaining = Math.max(0, this.remaining + sec);
  },

  // draw()가 매 프레임 부른다. dtSec는 지난 프레임부터 실제로 흐른 시간(초)이다.
  update(dtSec) {
    if (!this.running || this.paused) return;
    this.remaining = Math.max(0, this.remaining - dtSec);
    this.elapsed += dtSec;
  },

  isOver() {
    return this.running && this.remaining <= 0;
  },

  // 화면에 보여 주고 점수에 쓰는 남은 초. 올림이라서 0초는 시간이 다 됐을 때만 보인다.
  wholeSeconds() {
    return Math.ceil(this.remaining);
  },

  isWarning() {
    return this.wholeSeconds() <= CONFIG.WARNING_SEC;
  },

  // 초를 mm:ss 글자로 바꾼다. 예: 125 → "02:05"
  format(sec) {
    const s = Math.max(0, Math.ceil(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return mm + ':' + ss;
  }
};
