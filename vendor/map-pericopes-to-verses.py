#!/usr/bin/env python3
import json

def parse_verse(v):
    b,c,v = v.strip().split('*')[0].strip().split()
    v = v.split()[0]
    c = int(c)
    v = int(v)
    return b,c,v

pericopes_by_verse = dict()
calendarium = json.load(open('orthocal-python/fixtures/calendarium.json'))
additional = json.load(open('additional.json'))
all_verses = [parse_verse(line) for line in open('verses.txt')]
for verse in all_verses:
    pericopes_by_verse[verse] = []

GOSPELS = 'Matt Mark Luke John'.split()

def parse_chapter_verse(cv):
    return int(cv[:-3]), int(cv[-3:])

for rec in calendarium + additional:
    if rec['model'] != 'calendarium.pericope':
        continue
    pk = rec['pk']
    verses = rec['fields']['verses']
    verse_ranges = verses.split('|')
    preverse = rec['fields']['preverse']
    if preverse:
        verse_ranges = [f'{book}_{preverse}_{preverse}'] + verse_ranges
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

stack = set()
for b,c,v in all_verses:
    pericopes = set(pericopes_by_verse[(b,c,v)])
    # TODO - if overlapped only a single verse, don't fold together
    # TODO - handle gaps - fold together Matt 10:32 - 11:1, Matt 12:14-12:30
    if not stack & pericopes:
        print('----')
    stack = pericopes
    print(f'{b} {c:>2}:{v:<3}', ', '.join([str(pk) for pk in pericopes]) if pericopes else 'MISSING')
