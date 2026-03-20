import { Pool, QueryResult, QueryResultRow } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

const pool: Pool =
  global.pgPool ??
  new Pool({
    user: "neondb_owner",
    password: "npg_MRoc1Zv0Qutf",
    host: "ep-noisy-wind-a8hdb2ow-pooler.eastus2.azure.neon.tech",
    port: 5432,
    database: "neondb",
    ssl: {
      rejectUnauthorized: false,
    },
  });

pool.on('error', (error) => {
  console.error('[database] Error inesperado en el pool de conexiones', error);
});

if (process.env.NODE_ENV !== 'production') global.pgPool = pool;

export async function sql<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  try {
    const res = await pool.query(text, params);
    return res as QueryResult<T>;
  } catch (error) {
    console.error('[database] Error ejecutando consulta', { text, error });
    throw error;
  }
}
