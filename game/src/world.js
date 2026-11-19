import { C } from './config.js';
import { choose, seeded } from './random.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const roadX = [100, 500, 900, 1300, 1700, 2100, 2500];
const roadY = [100, 500, 900, 1300, 1700];
const paletteCars = ['#e56e50', '#e8c45e', '#53a69b', '#5984a1', '#a789ba', '#f0eee0', '#d8874c'];

export class World {
  constructor(seed = 1) {
    this.random = seeded(seed);
    this.seed = seed;
    this.world = this.makeCity();
    this.reset();
  }
  makeCity() {
    const buildings = [];
    for (let row = 0; row < roadY.length - 1; row++) for (let col = 0; col < roadX.length - 1; col++) {
      const left = roadX[col] + C.road / 2 + C.sidewalk + 13;
      const top = roadY[row] + C.road / 2 + C.sidewalk + 13;
      const right = roadX[col + 1] - C.road / 2 - C.sidewalk - 13;
      const bottom = roadY[row + 1] - C.road / 2 - C.sidewalk - 13;
      if (col === 1 && row === 1) continue;
      if (row === 3 && col >= 4) continue;
      const split = this.random() < .48;
      const inset = 12 + this.random() * 18;
      const w = (right - left - inset * 2) * (split ? .47 : .88);
      const h = (bottom - top - inset * 2) * (split ? .72 : .88);
      const colors = [C.colors.building, C.colors.building2, C.colors.building3];
      buildings.push({ x: left + inset, y: top + inset, w, h, color: choose(this.random, colors), roof: this.random() });
      if (split) buildings.push({ x: left + inset + w + 14, y: top + inset + 9, w, h: h * .83, color: choose(this.random, colors), roof: this.random() });
    }
    const cars = [];
    for (let i = 0; i < C.cars.count; i++) {
      const horizontal = this.random() < .53;
      const lane = Math.floor(this.random() * (horizontal ? roadY.length : roadX.length));
      const sign = this.random() < .5 ? -1 : 1;
      const speed = C.cars.traffic * (.65 + this.random() * .5);
      cars.push({ id: `traffic-${i}`, x: horizontal ? 80 + this.random() * 2300 : roadX[lane] + (this.random() < .5 ? -25 : 25), y: horizontal ? roadY[lane] + (this.random() < .5 ? -25 : 25) : 80 + this.random() * 1550, angle: horizontal ? (sign > 0 ? 0 : Math.PI) : (sign > 0 ? Math.PI / 2 : -Math.PI / 2), speed, color: choose(this.random, paletteCars), traffic: true, parked: false, axis: horizontal ? 'x' : 'y', sign, radius: C.cars.radius });
    }
    const parked = [];
    for (let i = 0; i < 15; i++) {
      const horizontal = this.random() < .5;
      const lane = Math.floor(this.random() * (horizontal ? roadY.length : roadX.length));
      parked.push({ id: `parked-${i}`, x: horizontal ? 100 + this.random() * 2200 : roadX[lane] + (this.random() < .5 ? -36 : 36), y: horizontal ? roadY[lane] + (this.random() < .5 ? -36 : 36) : 110 + this.random() * 1450, angle: horizontal ? (this.random() < .5 ? 0 : Math.PI) : (this.random() < .5 ? Math.PI / 2 : -Math.PI / 2), speed: 0, color: choose(this.random, paletteCars), traffic: false, parked: true, radius: C.cars.radius });
    }
    const people = [];
    for (let i = 0; i < C.world.people; i++) {
      const x = 130 + this.random() * 2260;
      const y = 130 + this.random() * 1470;
      people.push({ x, y, angle: this.random() * Math.PI * 2, speed: 18 + this.random() * 22, color: choose(this.random, ['#f7d67a', '#e98f76', '#6f9f91', '#d6a2bd', '#7890b0']), down: 0, radius: 8 });
    }
    const packages = [
      { x: 272, y: 273, got: false }, { x: 1470, y: 1110, got: false }, { x: 2270, y: 1518, got: false },
    ];
    return { buildings, cars: [...parked, ...cars], people, packages, roadX, roadY };
  }
  reset() {
    this.player = { x: 740, y: 136, angle: 0, car: null, speed: 0, radius: C.player.radius, money: 250, score: 0, health: C.player.health };
    this.scene = 'title'; this.paused = false; this.mission = 0; this.wanted = 0; this.bust = 0;
    this.police = []; this.officers = []; this.heatTimer = 0; this.calmTimer = 0; this.elapsed = 0; this.notice = 'Mara is waiting';
    this.best = this.loadBest(); this.startTime = 0; this.lastCrime = -100; this.missionHadTwo = false;
    this.world.packages.forEach(item => item.got = false);
  }
  loadBest() { try { return Number(localStorage.getItem('solmar-best') || 0); } catch { return 0; } }
  saveBest() {
    if (this.player.score <= this.best) return;
    this.best = this.player.score;
    try { localStorage.setItem('solmar-best', String(this.best)); } catch { /* storage is optional */ }
  }
  start() { this.scene = 'play'; this.startTime = performance.now(); this.notice = 'Mara: keep your head down.'; }
  crime(amount = 1, message = 'The neighborhood noticed.') {
    this.wanted = clamp(this.wanted + amount, 0, C.wanted.max);
    this.lastCrime = this.elapsed; this.calmTimer = 0; this.notice = message;
    this.missionHadTwo ||= this.wanted >= 2;
  }
  get missionData() { return C.missions[this.mission] || null; }
  get objective() {
    if (this.mission === 1) return C.world.pickup;
    if (this.mission === 4) return C.world.marina;
    if (this.mission === 3) return this.world.packages.find(item => !item.got) || null;
    if (this.mission === 0) return this.nearestCar();
    return this.player;
  }
  nearestCar() {
    let best = null, bestDistance = 110;
    for (const car of this.world.cars) { if (car.traffic && Math.abs(car.speed) > 5) continue; const d = dist(this.player, car); if (d < bestDistance) { best = car; bestDistance = d; } }
    return best;
  }
  interact(input) {
    if (this.scene === 'title') { if (input.down('enter') || input.down(' ')) this.start(); return; }
    if (this.scene === 'busted' || this.scene === 'complete') { if (input.down('enter') || input.down(' ')) { this.reset(); this.start(); } return; }
    if (input.down('p') && !this.pWasDown) this.paused = !this.paused;
    this.pWasDown = input.down('p');
    if (this.paused) return;
    if (input.down('e') && !this.eWasDown) this.toggleCar();
    this.eWasDown = input.down('e');
  }
  toggleCar() {
    if (this.player.car) {
      const car = this.player.car; const side = this.player.angle + Math.PI / 2;
      this.player.x = car.x + Math.cos(side) * 34; this.player.y = car.y + Math.sin(side) * 34;
      this.player.car = null; this.player.speed = 0; this.notice = 'Back on foot'; return;
    }
    const car = this.nearestCar();
    if (!car) { this.notice = 'Move closer to a car'; return; }
    car.traffic = false; car.parked = false; car.speed = 0; this.player.car = car;
    this.player.x = car.x; this.player.y = car.y; this.player.angle = car.angle; this.crime(1, 'Vehicle taken · wanted level up');
    this.player.money += 40; this.player.score += 50;
    if (this.mission === 0) this.finishMission();
  }
  finishMission() {
    this.player.score += 500 + this.mission * 250; this.player.money += 300 + this.mission * 100;
    this.notice = `${this.missionData?.title || 'Mara'} complete`;
    this.mission++;
    if (this.mission >= C.missions.length) { this.scene = 'complete'; this.saveBest(); }
  }
  update(dt, input) {
    this.interact(input);
    if (this.scene !== 'play' || this.paused) return;
    dt = Math.min(dt, .05); this.elapsed += dt;
    this.moveTraffic(dt); this.movePeople(dt); this.movePlayer(dt, input); this.movePolice(dt); this.checkContacts(dt); this.checkMission();
    if (this.wanted >= 3) this.siren = (this.siren || 0) + dt; else this.siren = 0;
  }
  blocked(x, y, radius = 12) {
    if (x < radius || y < radius || x > C.cityW - radius || y > C.cityH - radius || y > 1700 && x > 1700) return true;
    return this.world.buildings.some(b => x + radius > b.x && x - radius < b.x + b.w && y + radius > b.y && y - radius < b.y + b.h);
  }
  moveTraffic(dt) {
    for (const car of this.world.cars) {
      if (!car.traffic || car === this.player.car) continue;
      const step = car.speed * car.sign * dt;
      if (car.axis === 'x') { car.x += step; if (car.x > C.cityW + 30) car.x = -25; if (car.x < -30) car.x = C.cityW + 20; }
      else { car.y += step; if (car.y > 1650) car.y = -20; if (car.y < -30) car.y = 1650; }
      if (this.blocked(car.x + Math.cos(car.angle) * 30, car.y + Math.sin(car.angle) * 30, 5)) car.speed = 0;
    }
  }
  movePeople(dt) {
    for (const person of this.world.people) {
      if (person.down > 0) { person.down -= dt; continue; }
      if (this.random() < .012) person.angle += (this.random() - .5) * 1.8;
      const nx = person.x + Math.cos(person.angle) * person.speed * dt, ny = person.y + Math.sin(person.angle) * person.speed * dt;
      if (this.blocked(nx, ny, person.radius)) person.angle += 2.3; else { person.x = nx; person.y = ny; }
    }
  }
  movePlayer(dt, input) {
    const p = this.player;
    if (p.car) {
      const car = p.car; const gas = input.down('w', 'arrowup') ? 1 : 0; const brake = input.down('s', 'arrowdown') ? 1 : 0;
      const steer = (input.down('a', 'arrowleft') ? -1 : 0) + (input.down('d', 'arrowright') ? 1 : 0);
      car.speed = clamp(car.speed + (gas * C.cars.acceleration - brake * C.cars.acceleration * 1.3 - (gas || brake ? 0 : car.speed * 1.7)) * dt, -110, C.cars.playerSpeed);
      if (Math.abs(car.speed) > 8) car.angle += steer * C.cars.turn * dt * Math.min(1, Math.abs(car.speed) / 95) * Math.sign(car.speed);
      const nx = car.x + Math.cos(car.angle) * car.speed * dt, ny = car.y + Math.sin(car.angle) * car.speed * dt;
      if (!this.blocked(nx, ny, C.cars.radius)) { car.x = nx; car.y = ny; } else { car.speed *= -.18; this.notice = 'Buildings stop the car'; }
      for (const other of this.world.cars) if (other !== car && Math.hypot(other.x - car.x, other.y - car.y) < 34) { car.speed *= .65; other.speed = 0; }
      p.x = car.x; p.y = car.y; p.angle = car.angle; p.speed = car.speed;
      if (Math.abs(car.speed) > 90) for (const person of this.world.people) if (!person.down && dist(car, person) < 25) { person.down = 5; this.crime(1, 'Pedestrian struck · wanted level up'); p.score += 100; }
      return;
    }
    const dx = (input.down('d', 'arrowright') ? 1 : 0) - (input.down('a', 'arrowleft') ? 1 : 0);
    const dy = (input.down('s', 'arrowdown') ? 1 : 0) - (input.down('w', 'arrowup') ? 1 : 0);
    const length = Math.hypot(dx, dy) || 1; const pace = C.player.speed * (input.down('shift') ? C.player.run : 1);
    if (dx || dy) p.angle = Math.atan2(dy, dx);
    const nx = p.x + dx / length * pace * dt, ny = p.y + dy / length * pace * dt;
    if (!this.blocked(nx, p.y, p.radius)) p.x = nx; if (!this.blocked(p.x, ny, p.radius)) p.y = ny; p.speed = dx || dy ? pace : 0;
    if (input.down(' ') && !this.attackCooldown) {
      this.attackCooldown = .4;
      const target = this.world.people.find(person => !person.down && dist(person, { x: p.x + Math.cos(p.angle) * 30, y: p.y + Math.sin(p.angle) * 30 }) < 26);
      if (target) { target.down = 4; this.crime(1, 'Assault reported · wanted level up'); p.score += 80; }
    } else this.attackCooldown = Math.max(0, (this.attackCooldown || 0) - dt);
  }
  ensurePursuit() {
    const count = Math.min(7, this.wanted * 2);
    while (this.police.length < count) {
      const angle = this.random() * Math.PI * 2; const d = 440 + this.random() * 160;
      this.police.push({ x: clamp(this.player.x + Math.cos(angle) * d, 30, C.cityW - 30), y: clamp(this.player.y + Math.sin(angle) * d, 30, 1660), angle, speed: C.cars.traffic * 1.25 + this.wanted * 8, radius: 20, car: true });
    }
    while (this.officers.length < Math.max(0, this.wanted - 1)) {
      const angle = this.random() * Math.PI * 2; const d = 290 + this.random() * 150;
      this.officers.push({ x: clamp(this.player.x + Math.cos(angle) * d, 30, C.cityW - 30), y: clamp(this.player.y + Math.sin(angle) * d, 30, 1660), radius: 10, speed: 92 + this.wanted * 12, angle, onFoot: true });
    }
  }
  movePolice(dt) {
    if (this.wanted > 0) this.ensurePursuit();
    for (const unit of this.police) {
      const angle = Math.atan2(this.player.y - unit.y, this.player.x - unit.x);
      unit.angle += Math.atan2(Math.sin(angle - unit.angle), Math.cos(angle - unit.angle)) * Math.min(1, dt * 1.9);
      const speed = unit.speed; const nx = unit.x + Math.cos(unit.angle) * speed * dt, ny = unit.y + Math.sin(unit.angle) * speed * dt;
      if (!this.blocked(nx, ny, 14)) { unit.x = nx; unit.y = ny; } else unit.angle += Math.PI / 2;
    }
    for (const officer of this.officers) {
      const angle = Math.atan2(this.player.y - officer.y, this.player.x - officer.x); officer.angle = angle;
      const nx = officer.x + Math.cos(angle) * officer.speed * dt, ny = officer.y + Math.sin(angle) * officer.speed * dt;
      if (!this.blocked(nx, ny, officer.radius)) { officer.x = nx; officer.y = ny; }
    }
  }
  checkContacts(dt) {
    const close = [...this.police, ...this.officers].some(unit => dist(unit, this.player) < 270);
    if (close || this.elapsed - this.lastCrime < C.wanted.cooldown) this.calmTimer = 0; else this.calmTimer += dt;
    if (this.calmTimer > C.wanted.starTime) { this.heatTimer += dt; if (this.heatTimer > C.wanted.decay) { this.wanted = Math.max(0, this.wanted - 1); this.heatTimer = 0; this.notice = 'The streets have cooled down'; } }
    if (this.player.car) { this.bust = Math.max(0, this.bust - dt * .5); return; }
    const touching = this.officers.some(unit => dist(unit, this.player) < 24);
    this.bust = touching ? this.bust + dt : Math.max(0, this.bust - dt * .65);
    if (this.bust >= C.wanted.bustTime) { this.scene = 'busted'; this.saveBest(); }
  }
  checkMission() {
    const p = this.player;
    if (this.mission === 1 && dist(p, C.world.pickup) < 55) this.finishMission();
    else if (this.mission === 2) { if (this.wanted >= 2) this.missionHadTwo = true; if (this.missionHadTwo && this.wanted === 0) this.finishMission(); }
    else if (this.mission === 3) {
      for (const item of this.world.packages) if (!item.got && dist(p, item) < 40) { item.got = true; p.money += 200; p.score += 150; this.notice = 'Package collected · $200'; this.pickupSound?.(); }
      if (this.world.packages.every(item => item.got)) this.finishMission();
    } else if (this.mission === 4 && this.wanted >= 3 && dist(p, C.world.marina) < 70) this.finishMission();
  }
  sceneSnapshot() {
    const elapsed = Math.max(0, (performance.now() - this.startTime) / 1000);
    return { elapsed, speed: Math.abs(this.player.speed), objective: this.objective, mission: this.missionData, packages: this.world.packages };
  }
}
