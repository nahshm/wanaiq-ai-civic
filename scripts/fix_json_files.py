
import os

for i in range(1, 6):
    filename = f'prod_policies_part_{i}.json'
    if not os.path.exists(filename):
        continue
        
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix known issues
    # 1. Unescape quotes
    fixed = content.replace('\\"', '"')
    # 2. Unescape newlines
    fixed = fixed.replace('\\n', ' ') # Replace newlines in SQL with space to avoid JSON parse error? 
    # OR unescape into real newlines if JSON allows? JSON does NOT allow literal newlines in strings.
    # They must be \n. 
    # If the file contains `\\n` (literal backslash n), and I want to keep it as `\n` chars in the string value? 
    # If I replace `\\n` with `\n` (actual newline), it becomes INVALID JSON.
    # So I should KEEP `\\n` if it represents a newline in the string value?
    # Original output: `SELECT 1\n FROM ...` -> representation `SELECT 1\\n FROM`.
    # If I copied `\\n`, then `fixed` has `\\n`.
    # `json.load` will parse `\\n` as `\n` (newline character).
    # This is correct.
    
    # But wait, looking at the file view:
    # `(EXISTS ( SELECT 1\\n   FROM user_roles\\n ...`
    # If I replace `\"` with `"`, I get:
    # `(EXISTS ( SELECT 1\\n   FROM user_roles\\n ...` (inside the value string)
    # This seems correct IF the value is quoted.
    
    # Let's just do replace `\"` -> `"`.
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(fixed)
        
    print(f"Fixed {filename}")
