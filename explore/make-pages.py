#!/usr/bin/env python3
import csv
import datetime
import json
from collections import defaultdict

GOSPELS = 'Matthew Mark Luke John'.split()
nav = csv.writer(open('../_data/readings.csv', 'w+'))
nav.writerow(('pk', 'name'))
dates = csv.reader(open('dates-by-pericope.csv'))
next(dates)  # skip headers
calendarium = json.load(open('../vendor/orthocal-python/fixtures/calendarium.json'))

by_pericope = defaultdict(list)
for pericope, date, service in dates:
    by_pericope[int(pericope)].append((date, service))

def parse_chapter_verse(cv):
    return int(cv[:-3]), int(cv[-3:])

for rec in calendarium:
    if rec['model'] != 'calendarium.pericope':
        continue
    if rec['fields']['book'] not in GOSPELS:
        continue
    pk = int(rec['pk'])
    name = rec['fields']['display']
    nav.writerow((pk, name))
    fp = open(f'{pk}.md', 'w+')
    s = '' if by_pericope[pk] == 1 else 's'
    print(f'''\
---
title: {name}
pk: {pk}
noindex: true
---

### Upcoming Services

God willing, this Gospel will be proclaimed at the following service{s} over the next year:

''', file=fp)
    for date, service in by_pericope[pk]:
        date = datetime.date(*map(int, date.split('-')))
        url = f'https://orthocal.info/readings/gregorian/{date.strftime("%Y/%m/%d")}/'
        print(f'1. {service} on [{date.strftime("%B, %e, %Y")}]({url})', file=fp)
