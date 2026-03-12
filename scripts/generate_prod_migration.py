
import json
import re

output_file = 'supabase/migrations/prod_optimized_migration.sql'

policies = []

# Load 5 chunks
for i in range(1, 6):
    try:
        with open(f'prod_policies_part_{i}.json', 'r', encoding='utf-8') as f:
            chunk = json.load(f)
            policies.extend(chunk)
    except FileNotFoundError:
        pass

print(f"Loaded {len(policies)} policies.")

sql_statements = []
sql_statements.append("BEGIN;")

def optimize_sql(sql):
    if not sql: return None
    # Replace unoptimized calls
    sql = sql.replace('auth.uid()', '(select auth.uid())')
    sql = sql.replace('auth.jwt()', '(select auth.jwt())')
    sql = sql.replace('auth.role()', '(select auth.role())')
    
    # Fix double wrapping: (select (select auth.uid())) -> (select auth.uid())
    sql = sql.replace('(select (select auth.uid()))', '(select auth.uid())')
    sql = sql.replace('(select (select auth.jwt()))', '(select auth.jwt())')
    sql = sql.replace('(select (select auth.role()))', '(select auth.role())')
    
    return sql

for p in policies:
    table = p['tablename']
    name = p['policyname']
    cmd = p['cmd']
    qual = p['qual']
    with_check = p['with_check']
    
    # Minified DROP
    sql_statements.append(f'DROP POLICY IF EXISTS "{name}" ON public.{table};')
    
    create_sql = f'CREATE POLICY "{name}" ON public.{table} FOR {cmd}'
    
    if cmd == 'SELECT':
        if qual:
            create_sql += f' USING ({optimize_sql(qual)})'
    elif cmd == 'INSERT':
        if with_check:
            create_sql += f' WITH CHECK ({optimize_sql(with_check)})'
    elif cmd == 'UPDATE':
        if qual:
            create_sql += f' USING ({optimize_sql(qual)})'
        if with_check:
             create_sql += f' WITH CHECK ({optimize_sql(with_check)})'
    elif cmd == 'DELETE':
        if qual:
            create_sql += f' USING ({optimize_sql(qual)})'
    elif cmd == 'ALL':
        if qual:
            create_sql += f' USING ({optimize_sql(qual)})'
        if with_check:
             create_sql += f' WITH CHECK ({optimize_sql(with_check)})'
             
    create_sql += ';'
    sql_statements.append(create_sql)

# Verification Block (Minified)
verification_sql = """
DO $$
DECLARE
  unoptimized_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unoptimized_count
  FROM pg_policies
  WHERE (definition LIKE '%auth.uid()%' OR definition LIKE '%auth.jwt()%' OR definition LIKE '%auth.role()%')
    AND definition NOT LIKE '%(select auth.uid())%'
    AND definition NOT LIKE '%(select auth.jwt())%'
    AND definition NOT LIKE '%(select auth.role())%';
  IF unoptimized_count > 0 THEN
    RAISE WARNING 'Found % unoptimized policies', unoptimized_count;
  ELSE
    RAISE NOTICE 'Optimization Complete';
  END IF;
END $$;
"""
sql_statements.append(verification_sql.strip())
sql_statements.append("COMMIT;")

with open(output_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_statements))

print(f"Generated {output_file}")
