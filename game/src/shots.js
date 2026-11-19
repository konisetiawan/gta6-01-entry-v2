const shotNames = ['start', 'play', 'chase', 'end'];

export function setShotScene(world) {
  const query = new URLSearchParams(location.search);
  const named = query.get('shot');
  const shot = shotNames.includes(named) ? named : shotNames.find(name => query.has(name));
  if (!shot || shot === 'start') {
    world.scene = 'title';
    return;
  }

  world.paused = false;
  world.startTime = performance.now() - 42000;
  if (shot === 'play') {
    world.scene = 'play';
    world.mission = 1;
    world.wanted = 0;
    world.player.x = 900;
    world.player.y = 500;
    world.player.angle = 0.04;
    world.player.score = 1250;
    world.player.money = 640;
    const car = { id: 'shot-coupe', x: 900, y: 500, angle: 0.04, speed: 82, color: '#e56e50', traffic: false, parked: false, radius: 19 };
    world.world.cars.push(car);
    world.player.car = car;
    world.player.speed = car.speed;
    world.notice = 'Mara: drive to the marked pickup point.';
    return;
  }

  if (shot === 'chase') {
    world.scene = 'play';
    world.mission = 4;
    world.wanted = 3;
    world.missionHadTwo = true;
    world.siren = 1;
    world.player.x = 1300;
    world.player.y = 900;
    world.player.angle = 0.18;
    world.player.score = 2470;
    world.player.money = 1250;
    const car = { id: 'shot-getaway', x: 1300, y: 900, angle: 0.18, speed: 154, color: '#398f87', traffic: false, parked: false, radius: 19 };
    world.world.cars.push(car);
    world.player.car = car;
    world.player.speed = car.speed;
    world.police = [
      { x: 1110, y: 830, angle: 0.35, speed: 150, radius: 20, car: true },
      { x: 1510, y: 875, angle: 3.2, speed: 145, radius: 20, car: true },
      { x: 1270, y: 1115, angle: -1.25, speed: 138, radius: 20, car: true },
    ];
    world.officers = [{ x: 1160, y: 1030, angle: -0.7, speed: 105, radius: 10, onFoot: true }];
    world.notice = 'Three stars · reach the marina.';
    return;
  }

  world.scene = 'complete';
  world.mission = 5;
  world.player.score = 7850;
  world.player.money = 2750;
  world.best = Math.max(world.best, world.player.score);
  world.startTime = performance.now() - 248000;
}
