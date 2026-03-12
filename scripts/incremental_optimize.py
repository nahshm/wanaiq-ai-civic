import json
import subprocess
import sys

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

print(f"Loaded {len(policies)} policies to optimize")

success_count = 0
error_count = 0
skipped_count = 0
errors = []

for idx, p in enumerate(policies, 1):
    table = p['tablename']
    name = p['policyname']
    cmd = p['cmd']
    qual = p['qual']
    with_check = p['with_check']
    
    # Build CREATE POLICY statement
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
    
    # Build transaction SQL
    transaction_sql = f'''BEGIN;
DROP POLICY IF EXISTS "{name}" ON public.{table};
{create_sql}
COMMIT;'''
    
    # Try to execute via supabase CLI
    try:
        result = subprocess.run(
            ['npx', 'supabase', 'db', 'query', '--project-ref', 'zcnjpczplkbdmmovlrtv'],
            input=transaction_sql,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            success_count += 1
            print(f"✓ [{idx}/{len(policies)}] {table}.{name}")
        else:
            error_count += 1
            error_msg = result.stderr.strip()
            errors.append({
                'table': table,
                'policy': name,
                'error': error_msg
            })
            print(f"✗ [{idx}/{len(policies)}] {table}.{name}: {error_msg[:100]}")
            
    except subprocess.TimeoutExpired:
        error_count += 1
        errors.append({
            'table': table,
            'policy': name,
            'error': 'Timeout'
        })
        print(f"✗ [{idx}/{len(policies)}] {table}.{name}: Timeout")
    except Exception as e:
        error_count += 1
        errors.append({
            'table': table,
            'policy': name,
            'error': str(e)
        })
        print(f"✗ [{idx}/{len(policies)}] {table}.{name}: {str(e)}")

# Summary
print("\n" + "="*60)
print("MIGRATION SUMMARY")
print("="*60)
print(f"Total policies: {len(policies)}")
print(f"✓ Successfully optimized: {success_count}")
print(f"✗ Failed: {error_count}")
print(f"Success rate: {(success_count/len(policies)*100):.1f}%")

if errors:
    print(f"\n{len(errors)} errors encountered:")
    with open('optimization_errors.json', 'w', encoding='utf-8') as f:
        json.dump(errors, f, indent=2)
    print("Error details saved to: optimization_errors.json")
