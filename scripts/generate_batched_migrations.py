"""
Incremental RLS Policy Optimization Script
Applies optimizations one policy at a time via direct SQL execution
"""
import json

def optimize_sql(sql):
    if not sql: return None
    sql = sql.replace('auth.uid()', '(select auth.uid())')
    sql = sql.replace('auth.jwt()', '(select auth.jwt())')
    sql = sql.replace('auth.role()', '(select auth.role())')
    sql = sql.replace('(select (select auth.uid()))', '(select auth.uid())')
    sql = sql.replace('(select (select auth.jwt()))', '(select auth.jwt())')
    sql = sql.replace('(select (select auth.role()))', '(select auth.role())')
    return sql

# Load all policies
policies = []
for i in range(1, 6):
    try:
        with open(f'prod_policies_part_{i}.json', 'r', encoding='utf-8') as f:
            chunk = json.load(f)
            policies.extend(chunk)
    except FileNotFoundError:
        pass

print(f"Found {len(policies)} policies to optimize")
print("Generating batched SQL migration...")

# Generate migration batches (10 policies per batch to avoid timeout)
batch_size = 10
batches = []

for i in range(0, len(policies), batch_size):
    batch_policies = policies[i:i+batch_size]
    batch_sql = ["BEGIN;"]
    
    for p in batch_policies:
        table = p['tablename']
        name = p['policyname']
        cmd = p['cmd']
        qual = p['qual']
        with_check = p['with_check']
        
        # DROP old policy
        batch_sql.append(f'DROP POLICY IF EXISTS "{name}" ON public.{table};')
        
        # Build CREATE POLICY
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
        batch_sql.append(create_sql)
    
    batch_sql.append("COMMIT;")
    batches.append('\n'.join(batch_sql))

# Save batches
for idx, batch_content in enumerate(batches):
    filename = f'supabase/migrations/batch_{idx+1}_optimize.sql'
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(batch_content)
    print(f"Generated batch {idx+1}/{len(batches)}: {filename}")

print(f"\nCreated {len(batches)} migration batches")
print(f"Each batch contains ~{batch_size} policies")
print("\nTo apply:")
print("Run each batch individually via Supabase MCP or CLI")
