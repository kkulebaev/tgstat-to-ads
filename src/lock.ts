import type pg from 'pg';

function hashToInt32(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return h;
}

export async function withAdvisoryLock<T>(params: {
  pool: pg.Pool;
  key: string;
  fn: () => Promise<T>;
}): Promise<T> {
  const lockKey = hashToInt32(params.key);
  const client = await params.pool.connect();
  try {
    const got = await client.query<{ locked: boolean }>(
      'select pg_try_advisory_lock($1)::boolean as locked',
      [lockKey],
    );
    const locked = got.rows[0]?.locked === true;
    if (!locked) {
      throw new Error('Job is already running (advisory lock not acquired)');
    }

    return await params.fn();
  } finally {
    try {
      await client.query('select pg_advisory_unlock($1)', [lockKey]);
    } finally {
      client.release();
    }
  }
}
