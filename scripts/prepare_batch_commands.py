"""
Apply all migration batches sequentially to production
"""
import os
import json
import time

project_id = "zcnjpczplkbdmmovlrtv"
batch_dir = "supabase/migrations"

# Find all batch files
batch_files = sorted([f for f in os.listdir(batch_dir) if f.startswith('batch_') and f.endswith('_optimize.sql')])

print(f"Found {len(batch_files)} batch files to apply")
print("="*60)

results = []

for idx, batch_file in enumerate(batch_files, 1):
    batch_path = os.path.join(batch_dir, batch_file)
    
    with open(batch_path, 'r', encoding='utf-8') as f:
        batch_sql = f.read()
    
    print(f"\n[{idx}/{len(batch_files)}] Applying {batch_file}...")
    
    # Save as JSON command for MCP execution
    command = {
        "project_id": project_id,
        "query": batch_sql
    }
    
    with open(f'batch_command_{idx}.json', 'w') as f:
        json.dump(command, f, indent=2)
    
    print(f"    Generated command file: batch_command_{idx}.json")
    print(f"    Execute via: mcp_supabase-mcp-server_execute_sql")
    
    results.append({
        "batch": idx,
        "file": batch_file,
        "command_file": f'batch_command_{idx}.json'
    })

print("\n" + "="*60)
print(f"Generated {len(results)} command files")
print("\nTo apply all batches:")
print("Execute each batch_command_*.json file via Supabase MCP execute_sql tool")

with open('batch_execution_plan.json', 'w') as f:
    json.dump(results, f, indent=2)
    
print("\nExecution plan saved to: batch_execution_plan.json")
