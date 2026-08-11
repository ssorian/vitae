import 'dotenv/config'
import { sql } from 'drizzle-orm'
import { db } from './index'

type QueryResult<T> = { rows: T[] }

async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('No se puede resetear la base de datos en producción')
  }

  await db.execute(sql.raw('DROP SCHEMA public CASCADE'))
  await db.execute(sql.raw('CREATE SCHEMA public'))

  const privileges = (await db.execute(sql`
    SELECT
      has_schema_privilege(current_user, 'public', 'USAGE')
      AND has_schema_privilege(current_user, 'public', 'CREATE') AS "hasPrivileges"
  `)) as QueryResult<{ hasPrivileges: boolean }>

  if (!privileges.rows[0]?.hasPrivileges) {
    await db.execute(sql.raw('GRANT USAGE, CREATE ON SCHEMA public TO CURRENT_USER'))
  }

  console.log('Base de datos limpiada correctamente')
}

resetDatabase().catch((error) => {
  console.error('Error al limpiar la base de datos:', error)
  process.exitCode = 1
})
