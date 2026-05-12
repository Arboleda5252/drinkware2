const { sql } = require("./app/Datalibs/database");
const { readFileSync } = require("fs");

async function runMigration() {
  try {
    const migrationSQL = readFileSync("./migrations/002_create_historial_entrega.sql", "utf-8");
    await sql(migrationSQL);
    console.log("Migración ejecutada exitosamente");
  } catch (error) {
    console.error("Error ejecutando migración:", error);
  } finally {
    process.exit(0);
  }
}

runMigration();