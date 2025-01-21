#!/usr/bin/env python3
import csv
import json
from collections import defaultdict

GOSPELS = 'Matt Mark Luke John'.split()
dates = csv.reader(open('dates-by-pericope.csv'))
calendarium = json.load(open('../vendor/orthocal-python/fixtures/calendarium.json'))

by_pericope = defaultdict(list)
for date, pericope, service in dates:
    by_pericope[pericope].append((date, service))

def parse_chapter_verse(cv):
    return int(cv[:-3]), int(cv[-3:])

for rec in calendarium:
    if rec['model'] != 'calendarium.pericope':
        continue
    rec['fields']['book'] not in GOSPELS:
        continue
    pk = rec['pk']
    name = rec['fields']['display']
    fp = open(f'{pk}.md', 'w+')
    print(f'''\
---
title: {name}
pk: {pk}
---

## Upcoming Services

God willing, this Gospel will be proclaimed at the following services:

''', file=fp)
    for date, service in by_pericope[pk]:
        if service == 'Liturgy':
            service = ''
        else:
            service = f'({service})'
        print(f'1. {date}{service}', file=fp)
