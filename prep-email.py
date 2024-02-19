#!/usr/bin/env python3
import os

filename = sorted(os.listdir('_posts'))[-1]
year, month, day, slug = filename.split('-', 3)
slug, ext = slug.split('.')
url = f'https://www.gospeldesk.org/{year}/{slug}/'
out = ''
nsep = 0

for line in open(f'_posts/{filename}'):
    # skip front matter
    if line.strip() == '---':
        nsep += 1
        if nsep < 3:
            continue
    elif nsep < 2:
        continue

    # absolutize links
    line = line.replace('"./', f'"{url}')
    line = line.replace('"/', '"https://www.gospeldesk.org/')

    out += line

print(f'''
_This is a post from [Gospel Desk](https://www.gospeldesk.org/). You can also [read it on the web]({url})._

---
''')
print(out, end='')
