import pg from 'pg';

export type StateRow = {
  key: string;
  photo_message_id: number | null;
  cta_message_id: number | null;
};

const { Pool } = pg;

export function createPool(databaseUrl: string): pg.Pool {
  return new Pool({ connectionString: databaseUrl });
}

export async function ensureSchema(pool: pg.Pool): Promise<void> {
  await pool.query(`
    create table if not exists state (
      key text primary key,
      photo_message_id integer,
      cta_message_id integer,
      updated_at timestamptz not null default now()
    );
  `);
}

export async function loadState(pool: pg.Pool, key: string): Promise<StateRow> {
  const res = await pool.query<StateRow>(
    `select key, photo_message_id, cta_message_id from state where key = $1 limit 1`,
    [key],
  );
  const row = res.rows[0];
  if (row) return row;
  return { key, photo_message_id: null, cta_message_id: null };
}

export async function saveState(
  pool: pg.Pool,
  row: StateRow,
): Promise<void> {
  await pool.query(
    `
    insert into state(key, photo_message_id, cta_message_id)
    values ($1, $2, $3)
    on conflict (key) do update
      set photo_message_id = excluded.photo_message_id,
          cta_message_id = excluded.cta_message_id,
          updated_at = now();
    `,
    [row.key, row.photo_message_id, row.cta_message_id],
  );
}
