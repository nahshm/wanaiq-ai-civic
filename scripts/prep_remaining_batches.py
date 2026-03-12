"""
Apply migration batches 3-17 via Supabase execute_sql in sequence
This outputs SQL commands ready to be executed via MCP
"""
import os
import json

batch_dir = "supabase/migrations"
output_dir = "batch_sql_commands"
os.makedirs(output_dir, exist_ok=True)

# Get all batch files except 1 and 2
batch_files = sorted([f for f in os.listdir(batch_dir) if f.startswith('batch_') and f.endswith('_optimize.sql')])
batch_files = [f for f in batch_files if not f.startswith('batch_1_') and not f.startswith('batch_2_')]

print(f"Preparing {len(batch_files)} batches for execution (skipping batch 1 and 2)")
print("="*60)

for batch_file in batch_files:
    batch_path = os.path.join(batch_dir, batch_file)
    
    with open(batch_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Save SQL to individual command files
    output_file = os.path.join(output_dir, batch_file)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print(f"✓ Prepared {batch_file}")

print("="*60)
print(f"All batch SQL files saved to: {output_dir}/")
print("\nReady to execute via Supabase MCP")
