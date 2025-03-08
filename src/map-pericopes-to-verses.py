#!/usr/bin/env python3
import json
from collections import defaultdict

def parse_verse(v):
    b,c,v = v.strip().split('*')[0].strip().split()
    v = v.split()[0]
    c = int(c)
    v = int(v)
    return b,c,v

pericope_map = dict()
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


pericope_map = dict()
for b,c,v in all_verses:
    pericopes = pericopes_by_verse[(b,c,v)]
    for pk in pericopes:
        pericope_map[pk] = {*pericopes} ^ {pk}

import pdb; pdb.set_trace()

meta_i = 700000
meta_to_pk = defaultdict(set)
pk_to_meta = dict()
for b,c,v in all_verses:
    pericopes = pericopes_by_verse[(b,c,v)]
    metas = list(set([pk_to_meta[pk] for pk in pericopes if pk in pk_to_meta]))
    assert len(metas) in (0, 1), (pericopes, metas)
    if metas:
        meta_i = metas[0]
    else:
        meta_i += 1
        print('----')
    for pk in pericopes:
        meta_to_pk[meta_i].add(pk)
        pk_to_meta[pk] = meta_i
    print(f'{b} {c:>2}:{v:<3} {meta_i}', ', '.join([str(pk) for pk in pericopes]) if pericopes else 'MISSING')
