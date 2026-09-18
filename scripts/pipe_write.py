import sys, os
path = sys.argv[1]
d = os.path.dirname(path)
if d: os.makedirs(d, exist_ok=True)
with open(path, 'w', encoding='utf-8') as f:
    f.write(sys.stdin.read())
print('Piped wrote', path)
