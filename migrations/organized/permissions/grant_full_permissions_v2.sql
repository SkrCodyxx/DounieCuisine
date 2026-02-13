-- Migration: Grant full permissions to dounie_user - Version robuste
-- Date: 2025-11-12
-- Purpose: Ensure dounie_user has complete access to all tables, sequences, and schemas

-- Connect as superuser to make dounie_user the owner of objects if needed
-- Grant all permissions on schema public
GRANT ALL PRIVILEGES ON SCHEMA public TO dounie_user WITH GRANT OPTION;

-- Grant all permissions on all existing tables in public schema (ignore errors for already owned tables)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.' || quote_ident(r.tablename) || ' TO dounie_user WITH GRANT OPTION';
    END LOOP;
END
$$;

-- Grant all permissions on all existing sequences in public schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'GRANT ALL PRIVILEGES ON SEQUENCE public.' || quote_ident(r.sequence_name) || ' TO dounie_user WITH GRANT OPTION';
    END LOOP;
END
$$;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO dounie_user WITH GRANT OPTION;

-- Set default privileges for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO dounie_user WITH GRANT OPTION;

-- Set default privileges for future functions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO dounie_user WITH GRANT OPTION;

-- Grant ability to create new objects in the schema
GRANT CREATE ON SCHEMA public TO dounie_user WITH GRANT OPTION;

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO dounie_user;

SELECT 'All permissions granted successfully to dounie_user!' as result;
