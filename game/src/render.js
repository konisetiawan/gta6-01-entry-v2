import { C } from './config.js';

const TAU = Math.PI * 2;
const rounded = (ctx, x, y, w, h, r = 12) => {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
};
const text = (ctx, value, x, y, size, color = C.colors.white, weight = 600, align = 'left') => {
  ctx.font = `${weight} ${size}px system-ui, sans-serif`; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(value, x, y);
};

export class Renderer {
  constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.scale = 1; this.offsetX = 0; this.offsetY = 0; this.resize(); window.addEventListener('resize', () => this.resize()); }
  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(innerWidth * dpr); this.canvas.height = Math.round(innerHeight * dpr);
    this.scale = Math.min(this.canvas.width / C.width, this.canvas.height / C.height);
    this.offsetX = (this.canvas.width - C.width * this.scale) / 2; this.offsetY = (this.canvas.height - C.height * this.scale) / 2;
  }
  pointer(x, y) { return { x: (x * this.canvas.width / innerWidth - this.offsetX) / this.scale, y: (y * this.canvas.height / innerHeight - this.offsetY) / this.scale }; }
  draw(world) {
    const ctx = this.ctx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.colors.ink; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
    const camera = { x: Math.max(0, Math.min(C.cityW - C.width, world.player.x - C.width / 2)), y: Math.max(0, Math.min(C.cityH - C.height, world.player.y - C.height / 2)) };
    this.drawWorld(ctx, world, camera);
    if (world.scene === 'title') this.title(ctx, world);
    else if (world.scene === 'busted') this.endCard(ctx, world, false);
    else if (world.scene === 'complete') this.endCard(ctx, world, true);
    else { if (world.paused) this.pause(ctx); else this.hud(ctx, world, camera); }
  }
  drawWorld(ctx, world, camera) {
    ctx.save(); ctx.translate(-camera.x, -camera.y);
    ctx.fillStyle = C.colors.ground; ctx.fillRect(0, 0, C.cityW, C.cityH);
    ctx.fillStyle = C.colors.sea; ctx.fillRect(0, 1810, C.cityW, 110);
    ctx.fillStyle = C.colors.sand; ctx.fillRect(0, 1660, C.cityW, 150);
    ctx.fillStyle = C.colors.foam; ctx.globalAlpha = .48;
    for (let x = 0; x < C.cityW; x += 82) { ctx.fillRect(x + 6, 1680 + Math.sin(x) * 9, 42, 3); ctx.fillRect(x + 29, 1717 + Math.cos(x * .2) * 7, 31, 2); } ctx.globalAlpha = 1;
    for (const x of world.world.roadX) { ctx.fillStyle = C.colors.sidewalk; ctx.fillRect(x - 63, 0, 126, 1690); ctx.fillStyle = C.colors.road; ctx.fillRect(x - 52, 0, 104, 1690); this.roadMarks(ctx, x - 52, 0, 104, 1690, false); }
    for (const y of world.world.roadY) { ctx.fillStyle = C.colors.sidewalk; ctx.fillRect(0, y - 63, C.cityW, 126); ctx.fillStyle = C.colors.road; ctx.fillRect(0, y - 52, C.cityW, 104); this.roadMarks(ctx, 0, y - 52, C.cityW, 104, true); }
    this.drawPark(ctx); this.drawMarina(ctx);
    for (const b of world.world.buildings) this.building(ctx, b);
    for (const item of world.world.packages) if (!item.got && world.mission === 3) this.package(ctx, item);
    if (world.mission === 1) this.marker(ctx, C.world.pickup, C.colors.mint);
    if (world.mission === 4) this.marker(ctx, C.world.marina, C.colors.gold);
    for (const car of world.world.cars) this.car(ctx, car, false);
    for (const unit of world.police) this.car(ctx, unit, true);
    for (const person of world.world.people) this.person(ctx, person);
    for (const officer of world.officers) this.person(ctx, officer, true);
    if (!world.player.car) this.player(ctx, world.player);
    ctx.restore();
  }
  roadMarks(ctx, x, y, w, h, horizontal) {
    ctx.save(); ctx.strokeStyle = C.colors.roadLine; ctx.lineWidth = 2; ctx.setLineDash([18, 23]); ctx.globalAlpha = .58; ctx.beginPath();
    if (horizontal) { ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); } else { ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); } ctx.stroke(); ctx.restore();
  }
  building(ctx, b) {
    ctx.fillStyle = 'rgba(43,49,40,.18)'; ctx.fillRect(b.x + 9, b.y + 11, b.w, b.h);
    ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = b.roof > .5 ? '#f3d59b' : '#f0bb83'; ctx.fillRect(b.x + 7, b.y + 7, b.w - 14, b.h - 14);
    ctx.fillStyle = C.colors.roof; ctx.fillRect(b.x + 13, b.y + 13, b.w - 26, 9);
    ctx.fillStyle = 'rgba(255,249,225,.7)';
    for (let xx = b.x + 19; xx < b.x + b.w - 10; xx += 31) { ctx.fillRect(xx, b.y + 29, 12, 9); ctx.fillRect(xx, b.y + b.h - 23, 12, 9); }
    ctx.fillStyle = 'rgba(135,86,67,.23)'; ctx.fillRect(b.x + b.w * .45, b.y + b.h - 18, 25, 18);
  }
  drawPark(ctx) {
    const x = 500 + C.road / 2, y = 500 + C.road / 2, s = C.block - 22;
    ctx.fillStyle = C.colors.park; ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#d8cda4'; ctx.fillRect(x + 20, y + s * .48, s - 40, 18); ctx.fillRect(x + s * .48, y + 20, 18, s - 40);
    ctx.fillStyle = '#73a18c'; ctx.beginPath(); ctx.ellipse(x + s * .52, y + s * .52, 44, 29, -.3, 0, TAU); ctx.fill();
    for (let i = 0; i < 13; i++) { const tx = x + 26 + (i * 47 % (s - 52)), ty = y + 26 + (i * 71 % (s - 52)); ctx.fillStyle = C.colors.parkDark; ctx.beginPath(); ctx.arc(tx + 4, ty + 5, 13, 0, TAU); ctx.fill(); ctx.fillStyle = '#82b77f'; ctx.beginPath(); ctx.arc(tx, ty, 12, 0, TAU); ctx.fill(); }
  }
  drawMarina(ctx) {
    const x = 2188, y = 205; ctx.fillStyle = '#8e7b62'; ctx.fillRect(x - 16, y + 55, 145, 64); ctx.fillStyle = C.colors.sea; ctx.fillRect(x + 56, y + 80, 280, 155);
    ctx.fillStyle = '#b7966a'; ctx.fillRect(x + 36, y + 66, 14, 166);
    for (let i = 0; i < 4; i++) { ctx.fillRect(x + 76 + i * 55, y + 78, 6, 108); ctx.fillRect(x + 56, y + 93 + i * 34, 82, 5); }
    ctx.fillStyle = '#fff1d0'; ctx.font = '700 13px system-ui'; ctx.fillText('MARINA', x - 5, y + 43);
  }
  car(ctx, car, police) {
    ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.angle);
    ctx.fillStyle = 'rgba(22,42,45,.24)'; ctx.beginPath(); ctx.ellipse(1, 4, 23, 13, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = police ? '#f5f0de' : car.color; ctx.beginPath(); ctx.roundRect(-22, -11, 44, 22, 7); ctx.fill();
    ctx.fillStyle = police ? '#376f8b' : 'rgba(28,58,67,.72)'; ctx.beginPath(); ctx.roundRect(-10, -8, 19, 16, 4); ctx.fill();
    ctx.fillStyle = '#f4e6bb'; ctx.fillRect(15, -7, 4, 5); ctx.fillRect(15, 2, 4, 5);
    ctx.fillStyle = '#332f32'; ctx.fillRect(-14, -12, 9, 3); ctx.fillRect(7, -12, 9, 3); ctx.fillRect(-14, 9, 9, 3); ctx.fillRect(7, 9, 9, 3);
    if (police) { ctx.fillStyle = '#e95d5d'; ctx.fillRect(-5, -12, 8, 3); ctx.fillStyle = '#67c8e0'; ctx.fillRect(3, -12, 7, 3); }
    ctx.restore();
  }
  person(ctx, person, police = false) {
    ctx.save(); ctx.translate(person.x, person.y); ctx.rotate(person.angle || 0);
    if (person.down > 0) { ctx.fillStyle = person.color || '#f5f0de'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 6, .25, 0, TAU); ctx.fill(); }
    else { ctx.fillStyle = 'rgba(30,43,39,.22)'; ctx.beginPath(); ctx.ellipse(1, 5, 9, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = police ? '#f2e9d5' : person.color; ctx.beginPath(); ctx.arc(0, 0, police ? 9 : 8, 0, TAU); ctx.fill(); if (police) { ctx.fillStyle = '#387a9c'; ctx.fillRect(-5, -4, 10, 5); ctx.fillStyle = '#f3d271'; ctx.fillRect(-2, -8, 4, 3); } }
    ctx.restore();
  }
  player(ctx, p) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    ctx.fillStyle = 'rgba(15,37,39,.35)'; ctx.beginPath(); ctx.ellipse(1, 5, 13, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.colors.player; ctx.beginPath(); ctx.roundRect(-9, -10, 19, 20, 7); ctx.fill();
    ctx.fillStyle = C.colors.coral; ctx.beginPath(); ctx.arc(1, -2, 6, 0, TAU); ctx.fill(); ctx.fillStyle = C.colors.ink; ctx.fillRect(5, -2, 9, 3); ctx.restore();
  }
  package(ctx, item) {
    const bob = Math.sin(performance.now() / 190 + item.x) * 4; ctx.save(); ctx.translate(item.x, item.y + bob); ctx.fillStyle = C.colors.gold; ctx.shadowColor = C.colors.gold; ctx.shadowBlur = 18; ctx.beginPath(); ctx.roundRect(-10, -10, 20, 20, 5); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#fff5cc'; ctx.lineWidth = 2; ctx.strokeRect(-5, -5, 10, 10); ctx.restore();
  }
  marker(ctx, target, color) {
    const bob = Math.sin(performance.now() / 230) * 7; ctx.save(); ctx.translate(target.x, target.y + bob); ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 27, 0, TAU); ctx.stroke(); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(-9, -31); ctx.lineTo(9, -31); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  hud(ctx, world, camera) {
    const p = world.player; const data = world.sceneSnapshot();
    ctx.fillStyle = 'rgba(10,27,34,.87)'; rounded(ctx, 26, 24, 376, 128, 17); ctx.fill();
    ctx.fillStyle = C.colors.mint; rounded(ctx, 43, 40, 5, 95, 3); ctx.fill();
    text(ctx, 'SOLMAR  /  VICE COAST', 62, 54, 12, '#9bc4bf', 700);
    text(ctx, `$${p.money.toLocaleString()}`, 62, 89, 27, C.colors.white, 750); text(ctx, `SCORE  ${p.score.toLocaleString()}`, 62, 119, 14, '#c6dbd3', 650);
    text(ctx, p.car ? `${Math.round(data.speed * .18)} KM/H` : 'ON FOOT', 358, 64, 14, C.colors.gold, 700, 'right');
    text(ctx, 'WANTED', 62, 139, 10, '#97afad', 700);
    for (let i = 0; i < C.wanted.max; i++) this.star(ctx, 124 + i * 27, 134, i < world.wanted ? C.colors.coral : '#405259');
    this.minimap(ctx, world); this.missionPanel(ctx, world); this.objectiveArrow(ctx, world);
    if (world.bust > 0) { ctx.fillStyle = C.colors.panel; rounded(ctx, 474, 652, 332, 40, 12); ctx.fill(); text(ctx, 'BUST', 490, 677, 11, '#f0d8c5', 800); ctx.fillStyle = '#573f43'; rounded(ctx, 542, 665, 245, 12, 6); ctx.fill(); ctx.fillStyle = C.colors.coral; rounded(ctx, 542, 665, 245 * Math.min(1, world.bust / C.wanted.bustTime), 12, 6); ctx.fill(); }
    if (world.notice && world.elapsed - (world.lastNotice || 0) < 4) { /* short status is also in the mission panel */ }
    if (world.wanted >= 3) this.siren(ctx, world);
    text(ctx, 'WASD MOVE  ·  E CAR  ·  SPACE HIT  ·  P PAUSE', 640, 696, 11, 'rgba(255,249,233,.62)', 600, 'center');
  }
  star(ctx, x, y, color) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = color; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 5 : 10; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.restore();
  }
  missionPanel(ctx, world) {
    ctx.fillStyle = 'rgba(10,27,34,.88)'; rounded(ctx, 26, 584, 430, 82, 15); ctx.fill();
    const mission = world.missionData; text(ctx, 'MARA  /  STORY', 46, 609, 10, C.colors.mint, 750);
    text(ctx, mission ? `${world.mission + 1}   ${mission.title}` : 'Story complete', 46, 632, 15, C.colors.white, 700);
    text(ctx, mission?.objective || 'You made it out.', 46, 652, 12, '#c1d5d1', 500);
  }
  minimap(ctx, world) {
    const x = 1090, y = 24, w = 164, h = 133; ctx.fillStyle = 'rgba(10,27,34,.9)'; rounded(ctx, x, y, w, h, 15); ctx.fill();
    const mx = px => x + 8 + px / C.cityW * (w - 16), my = py => y + 8 + py / C.cityH * (h - 16);
    ctx.save(); rounded(ctx, x + 7, y + 7, w - 14, h - 14, 9); ctx.clip(); ctx.fillStyle = '#aebaa0'; ctx.fillRect(x + 7, y + 7, w - 14, h - 14);
    ctx.fillStyle = C.colors.sea; ctx.fillRect(x + 7, my(1810), w - 14, y + h - my(1810)); ctx.fillStyle = C.colors.sand; ctx.fillRect(x + 7, my(1660), w - 14, my(1810) - my(1660));
    ctx.strokeStyle = '#59666a'; ctx.lineWidth = 4; for (const rx of world.world.roadX) { ctx.beginPath(); ctx.moveTo(mx(rx), y); ctx.lineTo(mx(rx), y + h); ctx.stroke(); } for (const ry of world.world.roadY) { ctx.beginPath(); ctx.moveTo(x, my(ry)); ctx.lineTo(x + w, my(ry)); ctx.stroke(); }
    ctx.fillStyle = '#75a67b'; ctx.fillRect(mx(552), my(552), 44, 36);
    for (const unit of [...world.police, ...world.officers]) { ctx.fillStyle = '#e66560'; ctx.beginPath(); ctx.arc(mx(unit.x), my(unit.y), 2.5, 0, TAU); ctx.fill(); }
    if (world.objective) { ctx.fillStyle = C.colors.gold; ctx.beginPath(); ctx.arc(mx(world.objective.x), my(world.objective.y), 3.8, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.translate(mx(world.player.x), my(world.player.y)); ctx.rotate(world.player.angle); ctx.fillStyle = '#fff8dc'; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-3, -3); ctx.lineTo(-2, 3); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.restore(); text(ctx, 'SOLMAR', x + 11, y + h - 8, 8, '#dbebe0', 750);
  }
  objectiveArrow(ctx, world) {
    const target = world.objective; if (!target || world.mission === 2 || world.mission === 0 && world.player.car) return;
    const dx = target.x - world.player.x, dy = target.y - world.player.y; const a = Math.atan2(dy, dx);
    ctx.save(); ctx.translate(640, 48); ctx.rotate(a); ctx.fillStyle = C.colors.gold; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(9, 8); ctx.lineTo(0, 4); ctx.lineTo(-9, 8); ctx.closePath(); ctx.fill(); ctx.restore();
    const d = Math.round(Math.hypot(dx, dy)); text(ctx, `${d} m`, 640, 78, 11, '#fff2c9', 700, 'center');
  }
  siren(ctx, world) {
    const pulse = .32 + .18 * Math.sin(world.elapsed * 5); ctx.fillStyle = `rgba(236,73,68,${pulse})`; rounded(ctx, 424, 27, 186, 31, 10); ctx.fill(); text(ctx, 'POLICE RADIO · ACTIVE', 517, 47, 10, '#fff6e6', 750, 'center');
  }
  title(ctx, world) {
    ctx.fillStyle = 'rgba(8,24,31,.48)'; ctx.fillRect(0, 0, C.width, C.height);
    ctx.fillStyle = 'rgba(10,28,36,.91)'; rounded(ctx, 100, 65, 1080, 590, 26); ctx.fill();
    ctx.fillStyle = C.colors.mint; rounded(ctx, 140, 108, 5, 111, 3); ctx.fill();
    text(ctx, 'A SUNLIT CITY. A LONG WAY OUT.', 168, 129, 12, '#a8c7bc', 750); text(ctx, 'SOLMAR', 164, 207, 77, C.colors.white, 850);
    text(ctx, 'VICE COAST STORIES', 169, 240, 14, C.colors.gold, 750);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; rounded(ctx, 745, 108, 380, 378, 17); ctx.fill();
    text(ctx, 'THE CITY IS YOURS', 776, 151, 13, C.colors.mint, 750);
    text(ctx, 'Mara has five favors to ask.', 776, 190, 21, C.colors.white, 700);
    text(ctx, 'Take a car. Make the handoff.', 776, 221, 15, '#c0d2cb', 500);
    text(ctx, 'Lose the heat. Find your exit.', 776, 246, 15, '#c0d2cb', 500);
    const lines = [['W A S D / ARROWS', 'Walk, run with Shift'], ['E', 'Enter or leave a car'], ['W A S D', 'Drive · Space to swing'], ['P', 'Pause the story']];
    lines.forEach((row, i) => { const yy = 302 + i * 38; text(ctx, row[0], 778, yy, 11, C.colors.gold, 750); text(ctx, row[1], 945, yy, 12, '#dde8df', 500); });
    ctx.fillStyle = C.colors.mint; rounded(ctx, 166, 305, 263, 59, 15); ctx.fill(); text(ctx, 'START  →', 298, 343, 18, '#14333a', 800, 'center');
    text(ctx, 'CLICK START OR PRESS ENTER', 168, 392, 10, '#9bb8b1', 700);
    text(ctx, `BEST SCORE  ${world.best.toLocaleString()}`, 168, 465, 12, '#e6d399', 700);
    text(ctx, 'Fictional city · Original story · Every run writes its own legend', 168, 567, 12, '#93aba8', 500);
    ctx.fillStyle = '#29434a'; ctx.fillRect(168, 590, 948, 1);
    text(ctx, 'SOLMAR  /  01', 168, 620, 10, '#7e9997', 700); text(ctx, 'COASTLINE  •  AFTERGLOW  •  GETAWAY', 1115, 620, 10, '#7e9997', 700, 'right');
  }
  pause(ctx) { ctx.fillStyle = 'rgba(7,21,27,.65)'; ctx.fillRect(0, 0, C.width, C.height); text(ctx, 'PAUSED', 640, 337, 42, C.colors.white, 800, 'center'); text(ctx, 'Press P to return to Solmar', 640, 375, 15, '#c4d4cf', 500, 'center'); }
  endCard(ctx, world, complete) {
    ctx.fillStyle = 'rgba(7,20,27,.83)'; ctx.fillRect(0, 0, C.width, C.height); ctx.fillStyle = 'rgba(16,42,51,.94)'; rounded(ctx, 240, 105, 800, 510, 24); ctx.fill();
    ctx.fillStyle = complete ? C.colors.mint : C.colors.coral; rounded(ctx, 285, 148, 5, 90, 3); ctx.fill();
    text(ctx, complete ? 'THE COAST IS YOURS' : 'BUSTED', 320, 172, 13, complete ? C.colors.mint : '#ff9b7f', 800);
    text(ctx, complete ? 'Last light, new life.' : 'The run ends here.', 320, 223, 45, C.colors.white, 800);
    if (complete) { const seconds = Math.max(0, (performance.now() - world.startTime) / 1000); text(ctx, `TIME  ${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`, 320, 289, 17, '#cbded5', 600); }
    text(ctx, `FINAL SCORE  ${world.player.score.toLocaleString()}`, 320, 333, 19, C.colors.gold, 750);
    text(ctx, `MONEY  $${world.player.money.toLocaleString()}     BEST  ${world.best.toLocaleString()}`, 320, 369, 14, '#b3c8c3', 550);
    ctx.fillStyle = 'rgba(255,255,255,.07)'; rounded(ctx, 320, 421, 640, 1, 1); ctx.fill();
    ctx.fillStyle = C.colors.mint; rounded(ctx, 320, 464, 238, 57, 14); ctx.fill(); text(ctx, 'PLAY AGAIN  ↗', 439, 501, 16, '#14333a', 800, 'center');
    text(ctx, 'CLICK OR PRESS ENTER', 320, 552, 10, '#8ca9a5', 700);
    text(ctx, complete ? 'MARA SAYS: THE WATER LOOKS DIFFERENT AT DAWN.' : 'THE STREETLIGHTS ARE STILL ON. TRY AGAIN.', 320, 587, 11, '#8fa8a4', 600);
  }
}
