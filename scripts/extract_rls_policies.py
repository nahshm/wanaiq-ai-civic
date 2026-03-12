#!/usr/bin/env python3
"""
RLS Policy Extractor
Scans all Supabase migration files and extracts CREATE POLICY statements
that use auth.uid(), auth.jwt(), or auth.role() without SELECT wrappers.
"""

import re
import os
from pathlib import Path
from collections import defaultdict

# Pattern to match CREATE POLICY statements with auth functions
POLICY_PATTERN = re.compile(
    r'CREATE POLICY\s+"([^"]+)"\s+ON\s+(?:public\.)?(\w+)\s+'
    r'(?:AS\s+\w+\s+)?'
    r'FOR\s+(\w+)\s+'
    r'(?:TO\s+\w+\s+)?'
    r'(?:USING|WITH CHECK)\s*\((.*?)\);',
    re.DOTALL | re.IGNORECASE
)

# Pattern to detect unoptimized auth calls
UNOPTIMIZED_AUTH = re.compile(
    r'(?<!\(select\s)auth\.(uid|jwt|role)\(',
    re.IGNORECASE
)

def extract_policies(migration_file):
    """Extract all RLS policies from a migration file."""
    with open(migration_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    policies = []
    for match in POLICY_PATTERN.finditer(content):
        policy_name, table_name, operation, condition = match.groups()
        
        # Check if policy has unoptimized auth calls
        if UNOPTIMIZED_AUTH.search(condition):
            policies.append({
                'name': policy_name,
                'table': table_name,
                'operation': operation,
                'condition': condition.strip(),
                'full_statement': match.group(0),
                'file': os.path.basename(migration_file)
            })
    
    return policies

def optimize_policy(policy):
    """Generate optimized version of a policy."""
    # Replace auth.uid() with (select auth.uid())
    optimized_condition = re.sub(
        r'\bauth\.(uid|jwt|role)\(',
        r'(select auth.\1(',
        policy['condition']
    )
    # Close the select wrapper
    optimized_condition = re.sub(
        r'\(select auth\.(uid|jwt|role)\(\)',
        r'(select auth.\1())',
        optimized_condition
    )
    
    return optimized_condition

def main():
    migrations_dir = Path('e:/WANA_antigravity/wana-connect-civic/supabase/migrations')
    
    all_policies = []
    policies_by_table = defaultdict(list)
    
    # Scan all migration files
    for migration_file in sorted(migrations_dir.glob('*.sql')):
        if migration_file.name.endswith('.bak'):
            continue
            
        policies = extract_policies(migration_file)
        all_policies.extend(policies)
        
        for policy in policies:
            policies_by_table[policy['table']].append(policy)
    
    # Generate report
    print(f"=== RLS Policy Optimization Report ===")
    print(f"Total policies requiring optimization: {len(all_policies)}")
    print(f"Affected tables: {len(policies_by_table)}")
    print()
    
    # Group by table
    for table, policies in sorted(policies_by_table.items()):
        print(f"\n## Table: {table} ({len(policies)} policies)")
        for policy in policies:
            print(f"  - {policy['name']}")
            print(f"    Operation: {policy['operation']}")
            print(f"    File: {policy['file']}")
            print(f"    Current: {policy['condition'][:80]}...")
            optimized = optimize_policy(policy)
            print(f"    Optimized: {optimized[:80]}...")
            print()

if __name__ == '__main__':
    main()
