export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, down: false, clicked: false };
    this.canvas = canvas;
    window.addEventListener('keydown', event => {
      const key = event.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
      this.keys.add(key);
    });
    window.addEventListener('keyup', event => this.keys.delete(event.key.toLowerCase()));
    window.addEventListener('blur', () => { this.keys.clear(); this.mouse.down = false; });
    canvas.addEventListener('pointermove', event => this.point(event));
    canvas.addEventListener('pointerdown', event => { this.point(event); this.mouse.down = true; this.mouse.clicked = true; canvas.focus(); });
    window.addEventListener('pointerup', () => { this.mouse.down = false; });
  }
  point(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = (event.clientX - rect.left) / rect.width * 1280;
    this.mouse.y = (event.clientY - rect.top) / rect.height * 720;
  }
  down(...keys) { return keys.some(key => this.keys.has(key)); }
  consumeClick() { const value = this.mouse.clicked; this.mouse.clicked = false; return value; }
}
