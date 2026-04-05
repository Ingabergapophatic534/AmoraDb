'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const prebuilt = path.join(__dirname, 'prebuilds', `${process.platform}-${process.arch}`, 'amoradb.node');
if (fs.existsSync(prebuilt)) process.exit(0);
if (process.env.AMORADB_FORCE_WASM === '1') process.exit(0);

let nodeGypBin = null;
try {
  nodeGypBin = require.resolve('node-gyp/bin/node-gyp.js');
} catch (_) {}

if (!nodeGypBin) process.exit(0);

const res = spawnSync(process.execPath, [nodeGypBin, 'rebuild'], {
  cwd: __dirname,
  stdio: 'inherit',
});

if (res.status !== 0) {
  process.stderr.write('AmoraDB: native build failed; install completed with fallback engine support.\n');
}
process.exit(0);
