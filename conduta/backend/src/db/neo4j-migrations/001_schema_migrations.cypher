CREATE CONSTRAINT schema_migration_id IF NOT EXISTS
FOR (m:SchemaMigration) REQUIRE m.id IS UNIQUE;
