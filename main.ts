// Penyerahan "Dompet Rumah" sebagai situs statis: skrip kecil ini menyalin
// folder app/ dan screenshots/ ke direktori keluaran, lalu merangkum
// semuanya ke dalam dossier.json untuk penilai — tanpa server, tanpa
// jaringan, hanya berkas yang sudah ada di repo ini.
//
// Dompet Rumah — the hand-in program (Node 22, standard library only).
//
// The entry is the static site in app/ beside this file plus the
// screenshots/ renders of it. This program copies both into the output
// directory and writes dossier.json with the kit's vendored library, so
// the judge reads exactly the site and screenshots the repo holds.
//
// In the grader the output directory is /output; outside it,
// MAKEFUN_OUTPUT_DIR stands in for it:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

try {
  mkdirSync(out, { recursive: true });
} catch (error) {
  console.error(`Tidak bisa membuat direktori keluaran ${out}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps match the scorer's own limits, so a dossier built here is one
// the gate accepts: at most 4 screenshots of 256 KiB each, at most 993
// files and 16 MiB under app/, and the dossier text capped at 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
