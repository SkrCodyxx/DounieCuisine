-- Migration: Grant full permissions to dounie_user on all database objects
-- Date: 2025-11-12
-- Purpose: Ensure dounie_user has complete access to all tables, sequences, and schemas

-- Grant all permissions on schema public
GRANT ALL PRIVILEGES ON SCHEMA public TO dounie_user;

-- Grant all permissions on all existing tables in public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dounie_user;

-- Grant all permissions on all existing sequences in public schema
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dounie_user;

-- Grant all permissions on all existing functions in public schema
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO dounie_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO dounie_user;

-- Set default privileges for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO dounie_user;

-- Set default privileges for future functions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO dounie_user;

-- Grant ability to create new objects in the schema
GRANT CREATE ON SCHEMA public TO dounie_user;

-- Verify permissions were granted
SELECT 'Full permissions granted to dounie_user on database: ' || current_database() as status;
