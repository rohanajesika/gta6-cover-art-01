// Vice Sunset Cover Studio — the entry program (Node 22, standard library
// only). It hands the app in: it copies this repository's app/ and
// screenshots/ folders into the output directory and writes
// dossier.json there, the summary the judge reads, using the vendored
// make.fun library in vendor/makefun-app.ts (which must stay untouched).
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader MAKEFUN_OUTPUT_DIR is unset and the output is /output.
// The program is deterministic: two runs over the same tree write the same
// bytes, because it only copies files and lets buildDossier summarise them.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The folder this file lives in — the repository root.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
// Where the handed-in entry goes: the grader's /output, or the directory
// named by MAKEFUN_OUTPUT_DIR when running the program by hand.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The gate's caps, as the kit's reference states them: the dossier text is
// capped at 160 KiB, at most 4 screenshots of 256 KiB each, app/ at most
// 993 entries and 48 MiB, and no path under app/ longer than 1000 bytes.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
