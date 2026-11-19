import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outputSetting = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const output = isAbsolute(outputSetting) ? outputSetting : resolve(here, outputSetting);
const gameSource = join(here, 'game');
const screenshotsSource = join(here, 'screenshots');
const gameOutput = join(output, 'game');
const screenshotsOutput = join(output, 'screenshots');

mkdirSync(output, { recursive: true });
rmSync(gameOutput, { recursive: true, force: true });
rmSync(screenshotsOutput, { recursive: true, force: true });
mkdirSync(screenshotsOutput, { recursive: true });
cpSync(gameSource, gameOutput, { recursive: true });
if (existsSync(screenshotsSource)) cpSync(screenshotsSource, screenshotsOutput, { recursive: true });

const dossier = buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(output, 'dossier.json'), dossier);
