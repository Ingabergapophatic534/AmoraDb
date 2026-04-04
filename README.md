<div align="center">

<img src="https://github.com/amoracoin-org/AmoraDb/blob/main/assets/amoradb-logo.jpeg" alt="AmoraDB" width="180"/>

# AmoraDB

**Ultra-High-Performance Embedded Key-Value Engine**

*Built in C · Native Node.js Addon · SIMD Accelerated*

[![License: MIT](https://img.shields.io/badge/License-MIT-blueviolet.svg)](#license)
[![Node.js](https://img.shields.io/badge/Node.js-Native%20Addon-339933?logo=nodedotjs)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platforms-Win/Mac/Linux-4B0082)](#)

</div>

---

### 📖 Documentation

- **[CHANGELOG.md](CHANGELOG.md)**: Track all notable changes and version history.
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: Guide for setting up development environment and contributing code.
- **[SPEC.md](SPEC.md)**: Deep dive into the internal architecture, sharding, and binary formats.

---

AmoraDB is a hand-crafted, zero-dependency key-value store written entirely in C and compiled as a native Node.js addon. It delivers **true millions of operations per second** with minimal latency and memory footprint.

Designed for scenarios where you need maximum performance: caching, session storage, real-time data structures, and high-throughput APIs.

---

## ✨ Features

| Capability | Detail |
|---|---|
| **Native Addon** | Pure C compiled with native optimizations |
| **Hash Map** | Swiss Table-inspired design with SIMD-accelerated probing |
| **Sharding** | 64 independent shards for lock-free parallelism |
| **Bloom Filters** | 256 KB per shard (2M bits) for zero-cost negative lookups |
| **Spinlocks** | Fast mutex for cross-platform thread safety |
| **Slab Allocator** | 20 size classes, memory pooling |
| **Inline Keys** | Up to 22 bytes stored directly in slot (zero allocation) |
| **Max Values** | Up to 1 MB per value |
| **Max Keys** | Up to 4 KB per key |
| **64-bit Ready** | Full 64-bit hash distribution |

---

## 📊 Performance

### Native C Benchmark (1M Operations)

| Operation | Throughput | Latency |
|---|---|---|
| **Write** | ~2.0M-2.5M ops/s | ~0.4-0.5µs |
| **Read** | ~2.5M-3.0M ops/s | ~0.3-0.4µs |
| **Delete** | ~2.0M-2.5M ops/s | ~0.4-0.5µs |

### Comparison (Native In-Memory)

| Engine | Write/s | Read/s | Notes |
|---|---|---|---|
| **AmoraDB v2.0** | ~2.0M+ | ~2.5M+ | Native C · 64 shards |
| LMDB | ~1.2M | ~2.0M | mmap · B+Tree |
| RocksDB | ~700K | ~900K | LSM · disk-tuned |
| LevelDB | ~400K | ~600K | LSM · disk |
| Redis (local) | ~500K | ~800K | TCP overhead |

### Run Benchmark

```bash
npm install
node benchmark.js
```

### Performance Tips

1. **Use short keys** — 10-20 byte keys are optimal
2. **Batch operations** — group writes for maximum throughput
3. **Inline keys** — keys ≤ 22 bytes use zero extra allocation
4. **64-bit hash** — excellent distribution, minimal collisions
---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                   index.js                       │  JS Wrapper
│  Transparent API · Buffer handling                │
└────────────────────┬────────────────────────────┘
                     │  NAPI (native)
┌────────────────────▼────────────────────────────┐
│              native.c → .node                    │  Native Addon
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Shard 0  │  │ Shard 1  │  │  ...63   │       │  64 Shards
│  │ HashMap  │  │ HashMap  │  │ HashMap  │       │
│  │ Bloom    │  │ Bloom    │  │ Bloom    │       │  256KB Bloom/shard
│  │ Spinlock │  │ Spinlock │  │ Spinlock │       │  Thread-safe
│  └──────────┘  └──────────┘  └──────────┘       │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │      Bump Allocator + Slab Pool          │   │  Memory
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │     RapidHash (64-bit, SIMD-ready)       │   │  Hash
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Hash function:** RapidHash-inspired 64-bit hash — excellent distribution, minimal collisions.

**Thread safety:** Spinlocks on every shard for safe multi-threaded access.

**Memory:** Bump allocator with slab pooling — fast allocation, no fragmentation.

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- Bundled WebAssembly binary (`amora_core_mt_simd.wasm`) when installed from npm (or build from source — see below)

### Installation

```bash
npm install amoradbx
```

### Basic Usage

```js
const AmoraDB = require('amoradbx');

// Open a database (in-memory + optional WAL persistence)
const db = AmoraDB.open(null, {
  threads:  4,
  cap:      65536,      // Initial capacity (entries)
  walPath:  './my.wal', // Omit for pure in-memory
  walSync:  true,       // fsync on every WAL flush
});

// Basic operations
db.set('user:1', 'alice');
db.get('user:1');         // → 'alice'
db.has('user:1');         // → true
db.delete('user:1');

// Multi-get
const results = db.mget(['user:1', 'user:2', 'missing']);
// → ['alice', 'bob', null]

// Prefix scan
const entries = db.scan('user:');
// → [{ key: 'user:1', value: 'alice' }, ...]

// Range scan
const range = db.range('user:1', 'user:9');
```

### Atomic Batch Writes

```js
db.batch([
  { op: 'set',    key: 'account:1', value: '500' },
  { op: 'set',    key: 'account:2', value: '300' },
  { op: 'delete', key: 'account:old' },
]);
// All succeed or all roll back — no partial writes.
```

### Buffered Writes (High Throughput)

```js
// setBuffered queues writes in a 512KB command buffer
for (let i = 0; i < 100_000; i++) {
  db.setBuffered(`key:${i}`, `value:${i}`);
}
db.flush(); // Commit all at once
```

### Snapshot Export / Import

```js
// Export entire database to a Buffer
const snapshot = db.export(128 * 1024 * 1024); // 128MB max

// Import into a fresh instance
const db2 = AmoraDB.open(null, { cap: 65536 });
const count = db2.import(snapshot);
console.log(`Imported ${count} entries`);
```

---

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `threads` | `number` | `1` | Number of worker threads (max 8) |
| `cap` | `number` | `65536` | Initial hash map capacity per shard |
| `walPath` | `string\|null` | `null` | Path for WAL file. `null` = no persistence |
| `walSync` | `boolean` | `true` | `fsync` after every WAL flush |

---

## 🔧 API Reference

### Core Operations

| Method | Returns | Description |
|---|---|---|
| `db.heartbeat()` | `boolean` | Check if WASM core is responsive |
| `db.set(key, value)` | `void` | Insert or update a key |
| `db.get(key)` | `string\|null` | Retrieve a value |
| `db.has(key)` | `boolean` | Check existence (uses bloom filter) |
| `db.delete(key)` | `void` | Remove a key |
| `db.setBuffered(key, value)` | `void` | Buffered write (flush manually) |
| `db.mget(keys[])` | `(string\|null)[]` | Batch get (up to 8192 keys) |
| `db.batch(ops[])` | `void` | Atomic multi-operation batch |
| `db.scan(prefix)` | `{key,value}[]` | All keys with given prefix |
| `db.range(from, to)` | `{key,value}[]` | Lexicographic range scan |

### Maintenance

| Method | Returns | Description |
|---|---|---|
| `db.gc()` | `number` | Compact tombstones across all shards |
| `db.autoCompact()` | `number` | GC if fragmentation > 25% |
| `db.fragmentation()` | `number` | Current fragmentation percentage |
| `db.flush()` | `void` | Flush pending command buffer |
| `db.persist()` | `void` | Flush + WAL write |
| `db.restore()` | `void` | Reload from WAL |
| `db.reset(cap?)` | `void` | Wipe and reinitialize |
| `db.close()` | `Promise<void>` | Async: flush, persist, terminate workers |
| `db.import(buf)` | `number` | Import snapshot buffer |
| `db.export(max?)` | `Buffer` | Export database to snapshot buffer |

### Observability

```js
const s = db.stats();
// {
//   count:          number,   // Live entries
//   capacity:       number,   // Allocated slots
//   deleted:        number,   // Tombstone count
//   shards:         64,
//   threads:        number,
//   load:           '73.2%',
//   fragmentation:  '12%',
//   hit_rate:       '98.7%',
//   total_ops:      number,
//   write_errors:   number,
//   wal_errors:     number,
//   compactions:    number,
//   arena_kb:       string,
//   wal_kb:         string,
//   wasm_mb:        string,
//   mem_shared:     boolean,
// }
```

### Benchmark

```js
const b = db.bench(1_000_000);
// {
//   ops:          1000000,
//   write_ms:     '312ms',   write_ops_s:  '3.20M',
//   read_ms:      '276ms',   read_ops_s:   '3.62M',
//   delete_ms:    '289ms',   delete_ops_s: '1.73M',
//   scan_ms:      '1.42ms',
// }
```

---

## 🔒 Limits & Safety

| Constraint | Limit |
|---|---|
| Maximum key size | 4,096 bytes |
| Maximum value size | 1,048,576 bytes (1 MB) |
| Inline key fast path | ≤ 22 bytes (zero heap allocation) |
| Shards | 64 |
| Worker threads | 8 |
| Scan results per call | 4,096 |
| WAL max size | 32 MB |

All limits are validated on the JavaScript side before reaching WASM. Violations throw a `RangeError` immediately.

---

## 🛠 Building from Source

### Prerequisites

- Node.js ≥ 16
- Python 3.x (for node-gyp)
- C++ compiler (gcc/clang/MSVC)

### Build

```bash
cd npm
npm install
npm run build
```

This will compile the native addon for your current platform.

### Prebuilt Binaries

The package includes prebuilt binaries for:
- Windows x64
- macOS x64 (Intel)
- macOS arm64 (Apple Silicon)
- Linux x64

If a prebuilt isn't available for your platform, it will be compiled automatically during `npm install`.

---

## 📁 Project Structure

```
amora/
├── npm/                    # Native Node.js addon package
│   ├── package.json         # Package config with prebuilds
│   ├── binding.gyp         # node-gyp build config
│   ├── index.js            # JS wrapper (same API as WASM version)
│   └── src/
│       └── native.c       # Pure C NAPI addon
├── amora.js               # Legacy WASM version (deprecated)
├── amora_core.c           # Original WASM core (reference)
├── test.js                # Test suite
└── benchmark.js          # Performance benchmarks
```

---

## 🧪 Running Tests

```bash
node test.js
```

The test suite covers: heartbeat, set/get/has/delete, large values (512 KB), key/value size validation, stress (100K keys), and the native 1M-op benchmark.

---

## 📄 License

MIT © AmoraDB Authors

---

<div align="center">
  <sub>Built with obsession for performance. No dependencies. No compromises.</sub>
</div>

