// Starts the Firebase emulators (Auth, Firestore, Storage) and keeps their data
// in ./emulator-data between runs. Usage: npm run emulators
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const dataDir = './emulator-data';
const env = { ...process.env };

// The Storage/Firestore emulators need Java. If it was installed after this
// terminal opened, it may not be on PATH yet: look in the usual JDK folders.
const hasJava = spawnSync('java', ['-version'], { stdio: 'ignore', shell: true }).status === 0;
if (!hasJava && process.platform === 'win32') {
  for (const base of ['C:\\Program Files\\Microsoft', 'C:\\Program Files\\Java', 'C:\\Program Files\\Eclipse Adoptium']) {
    if (!existsSync(base)) continue;
    const jdk = readdirSync(base).find((d) => /^jdk/i.test(d) && existsSync(path.join(base, d, 'bin', 'java.exe')));
    if (jdk) {
      env.PATH = `${path.join(base, jdk, 'bin')};${env.PATH}`;
      break;
    }
  }
}

const args = ['firebase', 'emulators:start', `--export-on-exit=${dataDir}`];
if (existsSync(path.join(dataDir, 'firebase-export-metadata.json'))) args.push(`--import=${dataDir}`);

const child = spawn('npx', args, { stdio: 'inherit', shell: true, env });
child.on('exit', (code) => process.exit(code ?? 0));
