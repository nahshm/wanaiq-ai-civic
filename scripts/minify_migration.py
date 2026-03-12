
import re

input_file = 'supabase/migrations/20260109134500_optimize_rls_auth_calls.sql'
output_file = 'supabase/migrations/minified_migration.sql'

with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

clean_lines = []
for line in lines:
    stripped = line.strip()
    if not stripped:
        continue
    if stripped.startswith('--'):
        continue
    clean_lines.append(line)

content = ''.join(clean_lines)

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Minified {input_file} to {output_file}")
