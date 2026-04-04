declare class AmoraDB {
  constructor();

  static open(opts?: {
    cap?: number;
    threads?: number;
    walPath?: string | null;
    walSync?: boolean;
  }): AmoraDB;

  set(key: string, value: string): boolean;
  get(key: string): string | null;
  has(key: string): boolean;
  delete(key: string): boolean;

  count(): number;
  capacity(): number;
  hits(): number;
  misses(): number;
  ops(): number;

  heartbeat(): boolean;
  reset(cap?: number): boolean;

  stats(): {
    count: number;
    capacity: number;
    hits: number;
    misses: number;
    total_ops: number;
    set_ops: number;
    get_ops: number;
    has_ops: number;
    delete_ops: number;
    shards: number;
  };

  bench(n?: number): {
    write_ms: number;
    read_ms: number;
    delete_ms: number;
    scan_ms: number;
    write_ops_s: number;
    read_ops_s: number;
    delete_ops_s: number;
  };
}

export = AmoraDB;
