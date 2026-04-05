'use strict';

function tryRequire(mod) {
  try {
    return require(mod);
  } catch (_) {
    return null;
  }
}

function loadNativeLayer() {
  const prebuilt = './prebuilds/' + process.platform + '-' + process.arch + '/amoradb.node';
  const candidates = [
    prebuilt,
    './build/Release/amoradb.node',
    './build/Debug/amoradb.node',
  ];
  for (const m of candidates) {
    const loaded = tryRequire(m);
    if (loaded) return loaded;
  }
  return null;
}

function loadWasmLayer() {
  const candidates = [
    process.env.AMORADB_WASM_MODULE,
    'amoradbx-wasm',
    '@amoracoin/amoradbx-wasm',
  ].filter(Boolean);
  for (const m of candidates) {
    const loaded = tryRequire(m);
    if (loaded && typeof loaded.init === 'function') return loaded;
  }
  return null;
}

function resolveEngine() {
  if (process.env.AMORADB_FORCE_WASM === '1') {
    const wasm = loadWasmLayer();
    if (wasm) return { binding: wasm, mode: 'wasm' };
    return { binding: require('./portable_binding'), mode: 'portable' };
  }

  const native = loadNativeLayer();
  if (native) return { binding: native, mode: 'native' };

  const wasm = loadWasmLayer();
  if (wasm) return { binding: wasm, mode: 'wasm' };

  return { binding: require('./portable_binding'), mode: 'portable' };
}

const engine = resolveEngine();
const native = engine.binding;
const runtimeMode = engine.mode;

const DEC = new TextDecoder();

class AmoraDB {
  constructor() {
    this._native = native;
  }

  static open(opts = {}) {
    const db = new AmoraDB();
    const cap = opts.cap || 65536;
    if (!db._native.init(cap)) {
      throw new Error('AmoraDB: init failed');
    }
    return db;
  }

  static runtime() {
    return runtimeMode;
  }

  set(key, value) {
    const val = typeof value === 'string' ? value : String(value);
    return this._native.set(key, val);
  }

  get(key) {
    const result = this._native.get(key);
    return result === null ? null : result;
  }

  has(key) {
    return this._native.has(key);
  }

  delete(key) {
    return this._native.delete(key);
  }

  count() {
    return this._native.count();
  }

  capacity() {
    return this._native.capacity();
  }

  hits() {
    return this._native.hits();
  }

  misses() {
    return this._native.misses();
  }

  ops() {
    return this._native.ops();
  }

  stats() {
    return this._native.stats();
  }

  reset(cap) {
    return this._native.reset(cap || 65536);
  }

  heartbeat() {
    return this._native.heartbeat();
  }

  bench(n) {
    n = n || 1000000;
    return this._native.bench(n);
  }
}

module.exports = AmoraDB;
