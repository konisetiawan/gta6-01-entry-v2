export const C = {
  width: 1280, height: 720, cityW: 2560, cityH: 1920, road: 104, block: 296, sidewalk: 19,
  player: { speed: 178, run: 1.58, radius: 12, health: 100 },
  cars: { radius: 19, playerSpeed: 305, acceleration: 440, turn: 2.9, friction: 0.985, traffic: 106, count: 22 },
  wanted: { max: 5, decay: 11, cooldown: 13, bustTime: 2.7, starTime: 17 },
  world: { people: 34, packageCount: 3, pickup: { x: 1175, y: 852 }, marina: { x: 2248, y: 280 } },
  missions: [
    { title: 'A ride for Mara', objective: 'Steal any car. Find a ride nearby and press E.', kind: 'car' },
    { title: 'The handoff', objective: 'Drive to the marked pickup point.', kind: 'pickup' },
    { title: 'Heat on the boulevard', objective: 'Escape the police at two stars.', kind: 'escape' },
    { title: 'Three little favors', objective: 'Collect the three packages around Solmar.', kind: 'packages' },
    { title: 'Last light', objective: 'Reach the marina while carrying three stars.', kind: 'marina' },
  ],
  colors: {
    sky: '#a8d5d0', sea: '#348f9b', seaDeep: '#247783', sand: '#e8c98e', foam: '#d8efdf',
    ground: '#d6d2b6', park: '#83ae76', parkDark: '#558866', road: '#59656a', roadLine: '#e7d27f',
    sidewalk: '#d8cdb1', building: '#e9a46e', building2: '#f1ce8f', building3: '#d98170', roof: '#9b5e54',
    player: '#f4f1df', ink: '#142d36', panel: 'rgba(12,31,39,.88)', gold: '#ffd56a', coral: '#ff795f',
    mint: '#83ddba', police: '#87d8ef', white: '#fff9e9', shadow: 'rgba(15,34,35,.25)',
  },
};
