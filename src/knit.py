#!/usr/bin/env python3
import csv
import string

inp = csv.reader(open('characters.csv'))
headers = next(inp)
by_slug = {}

SKIP = "'"
LETTERS_NUMBERS = string.ascii_letters + string.digits

def sluggize(title, subtitle=''):
    base = title
    if subtitle:
        base += ': ' + subtitle
    chars = []
    for char in base.lower():
        if char in LETTERS_NUMBERS:
            pass
        elif char in SKIP:
            char = ""
        else:
            char = " "
        chars.append(char)
    # '  foo bar   '.split() == ['foo', 'bar'] 👍
    return  '-'.join(''.join(chars).split())

for row in inp:
    rec = dict(zip(headers, row))
    if not rec['✔']:
        continue
    by_slug[rec['Slug']] = (rec['Direct'], rec['Indirect'])

class Pericope:
    def __init__(self, title):
        self.slug = sluggize(title)
        self.lines = []
        self.insert_after = 0

    def add(self, line):
        if line.startswith('|'):
            return
        self.lines.append(line)
        if line.startswith('>'):
            self.insert_at = 1

    def flush(self):
        direct, indirect = by_slug.get(self.slug, ('', ''))
        for i, line in enumerate(self.lines):
            print(line)
            if i == self.insert_after:
                print('| ', direct.strip()) if direct else ''
                print('||', indirect.strip()) if indirect else ''

cur = None

for line in open('source.txt'):
    line = line.rstrip()
    if line.startswith('-- '):
        continue  # comment
    if line.startswith('----'):
        if cur:
            cur.flush()
        if line.endswith('----'):
            raise heck
        title = line.split(None, 1)[1]
        cur = Pericope(title)
    try:
        cur.add(line)
    except:
        print("choked on: \x1b[1;31m", line, "\x1b[0m")
        raise

cur.flush()
