import sys, os, base64
filepath = sys.argv[1]
b64_data = sys.argv[2]
d = os.path.dirname(filepath)
if d:
    os.makedirs(d, exist_ok=True)
with open(filepath, 'wb') as f:
    f.write(base64.b64decode(b64_data))
print('Wrote', filepath)
