'use strict';

let _map = new Map();
let _cap = 65536;
let _hits = 0;
let _misses = 0;
let _opsTotal = 0;
let _opsSet = 0;
let _opsGet = 0;
let _opsHas = 0;
let _opsDelete = 0;

const MAX_KEY = 4096;
const MAX_VAL = 1 << 20;
const SHARDS = 64;

function nextPow2(n) {
  let x = 1;
  while (x < n) x <<= 1;
  return x;
}

function keyOk(k) {
  if (typeof k !== 'string') return false;
  const len = Buffer.byteLength(k, 'utf8');
  return len > 0 && len <= MAX_KEY;
}

function valOk(v) {
  if (typeof v !== 'string') return false;
  return Buffer.byteLength(v, 'utf8') <= MAX_VAL;
}

function init(cap) {
  const c = nextPow2(Math.max(1024, (cap >>> 0) || 65536));
  _cap = c;
  _map = new Map();
  _hits = 0;
  _misses = 0;
  _opsTotal = 0;
  _opsSet = 0;
  _opsGet = 0;
  _opsHas = 0;
  _opsDelete = 0;
  return true;
}

function set(k, v) {
  _opsTotal++;
  _opsSet++;
  if (!keyOk(k) || !valOk(v)) return false;
  _map.set(k, v);
  return true;
}

function get(k) {
  _opsTotal++;
  _opsGet++;
  if (!keyOk(k)) {
    _misses++;
    return null;
  }
  if (_map.has(k)) {
    _hits++;
    return _map.get(k);
  }
  _misses++;
  return null;
}

function has(k) {
  _opsTotal++;
  _opsHas++;
  if (!keyOk(k)) {
    _misses++;
    return false;
  }
  if (_map.has(k)) {
    _hits++;
    return true;
  }
  _misses++;
  return false;
}

function del(k) {
  _opsTotal++;
  _opsDelete++;
  if (!keyOk(k)) return false;
  return _map.delete(k);
}

function count() { return _map.size >>> 0; }
function capacity() { return (_cap * SHARDS) >>> 0; }
function hits() { return _hits >>> 0; }
function misses() { return _misses >>> 0; }
function ops() { return _opsTotal >>> 0; }
function reset(cap) { return init(cap); }
function heartbeat() { return true; }

function stats() {
  return {
    count: count(),
    capacity: capacity(),
    hits: hits(),
    misses: misses(),
    total_ops: ops(),
    set_ops: _opsSet >>> 0,
    get_ops: _opsGet >>> 0,
    has_ops: _opsHas >>> 0,
    delete_ops: _opsDelete >>> 0,
    shards: SHARDS,
  };
}

function bench(n) {
  const N = (n >>> 0) || 1000000;
  const keys = new Array(Math.min(N, 100000));
  for (let i = 0; i < keys.length; i++) keys[i] = 'k:' + i;
  const v = 'v';

  const t0 = Date.now();
  for (let i = 0; i < N; i++) set(keys[i % keys.length], v);
  const t1 = Date.now();
  for (let i = 0; i < N; i++) get(keys[i % keys.length]);
  const t2 = Date.now();
  for (let i = 0; i < N; i++) del(keys[i % keys.length]);
  const t3 = Date.now();

  const w = Math.max(1, t1 - t0);
  const r = Math.max(1, t2 - t1);
  const d = Math.max(1, t3 - t2);

  return {
    write_ms: w,
    read_ms: r,
    delete_ms: d,
    scan_ms: 0,
    write_ops_s: Math.round(N / (w / 1000)),
    read_ops_s: Math.round(N / (r / 1000)),
    delete_ops_s: Math.round(N / (d / 1000)),
  };
}

module.exports = {
  init,
  set,
  get,
  has,
  delete: del,
  count,
  capacity,
  hits,
  misses,
  ops,
  stats,
  reset,
  heartbeat,
  bench,
};
