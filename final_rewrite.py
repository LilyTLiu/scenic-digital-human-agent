"""Complete rewrite of TourPage return block"""
import os

# Read the JSX template from a separate file
jsx_path = 'final_layout.jsx'
tour_path = 'frontend/src/pages/tourist/TourPage.tsx'

with open(tour_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the return block
ret_start = content.find('\n  return (')
ret_end_candidates = []
# Find closing ')' that matches the opening '(' after 'return ('
depth = 0
for i in range(ret_start + len('\n  return ('), len(content)):
    ch = content[i]
    if ch == '(':
        depth += 1
    elif ch == ')':
        if depth == 0:
            ret_end = i + 1
            break
        depth -= 1
    elif ch == '{':
        depth += 1
    elif ch == '}':
        depth -= 1

# Read JSX template
with open(jsx_path, 'r', encoding='utf-8') as f:
    new_jsx = f.read()

content = content[:ret_start] + new_jsx

with open(tour_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('TourPage rewritten')
