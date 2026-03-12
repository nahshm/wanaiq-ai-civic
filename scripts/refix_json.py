
import os

for i in range(1, 6):
    filename = f'prod_policies_part_{i}.json'
    if not os.path.exists(filename):
        continue
        
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We already replaced \" with ".
    # Now any remaining \ are likely invalid or remnants of newlines.
    # Replace \ with space.
    fixed = content.replace('\\', ' ')
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(fixed)
        
    print(f"Refixed {filename}")
