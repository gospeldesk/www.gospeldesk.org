#!/usr/bin/env python3
import csv
import json

out = csv.writer(open('pericopes-by-verse.csv', 'w+'))

def parse_verse(v):
    b,c,v = v.strip().split('.')
    v = v.split()[0]
    c = int(c)
    v = int(v)
    return b,c,v

pericopes_by_verse = dict()
calendarium = json.load(open('../vendor/orthocal-python/fixtures/calendarium.json'))
all_verses = [parse_verse(line) for line in open('verses.txt')]
for verse in all_verses:
    pericopes_by_verse[verse] = []

GOSPELS = 'Matt Mark Luke John'.split()

def parse_chapter_verse(cv):
    return int(cv[:-3]), int(cv[-3:])

for rec in calendarium:
    if rec['model'] != 'calendarium.pericope':
        continue
    pk = rec['pk']
    verses = rec['fields']['verses']
    verse_ranges = verses.split('|')
    for verse_range in verse_ranges:
        book, start, end = verse_range.split('_')
        if book not in GOSPELS:
            continue
        start_chapter, start_verse = parse_chapter_verse(start)
        end_chapter, end_verse = parse_chapter_verse(end)

        start = (book, start_chapter, start_verse)
        part = all_verses[all_verses.index(start):]
        cursor = iter(part)
        while 1:
            try:
                cur = next(cursor)
            except StopIteration:
                break
            if cur[0] != book or cur[1:3] > (end_chapter, end_verse):
                break
            pericopes_by_verse[cur].append(pk)

out.writerow([''] + list(range(1, 398)))
for b,c,v in all_verses:
    pericopes = pericopes_by_verse[(b,c,v)]
    print(f'{b} {c:>2}:{v:<3}', ', '.join([str(pk) for pk in pericopes]) if pericopes else 'MISSING')
    row = ['' for i in list(range(1, 398))]
    for pk in pericopes:
        row[pk-1] = '█'
    out.writerow([f'{b} {c:>2}:{v:<3}'] + row)

# Asked about missing:
#   https://github.com/brianglass/orthocal-python/issues/116
