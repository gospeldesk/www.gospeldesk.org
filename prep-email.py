#!/usr/bin/env python3
import os

filename = '_posts/' + sorted(os.listdir('_posts'))[-1]
year, month, day, slug = filename.split('-', 3)
slug, ext = slug.split('.')
out = ''
nsep = 0

for line in open(filename):
    # skip front matter
    if line.strip() == '---':
        nsep += 1
        if nsep < 3:
            continue
    elif nsep < 2:
        continue

    # absolutize links
    line = line.replace('"./', f'"https://www.gospeldesk.org/{year}/{slug}/')
    line = line.replace('"/', '"https://www.gospeldesk.org/')

    out += line

print(out, end='')
