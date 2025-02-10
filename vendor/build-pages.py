#!/usr/bin/env python3
import csv
import datetime
import json
from collections import defaultdict

GOSPELS = 'Matthew Mark Luke John'.split()
nav = csv.writer(open('../_data/readings.csv', 'w+'))
nav.writerow(('pk', 'name'))
services_csv = csv.reader(open('services.csv'))
readings_csv = csv.reader(open('readings.csv'))
next(services_csv), next(readings_csv) # skip headers
calendarium_json = json.load(open('orthocal-python/fixtures/calendarium.json'))

services_by_pericope_id = defaultdict(list)
for pericope_id, date, service in services_csv:
    services_by_pericope_id[int(pericope_id)].append((date, service))

readings_by_pericope_id = defaultdict(list)
for pericope_id, reading in readings_csv:
    readings_by_pericope_id[int(pericope_id)] = reading

def parse_chapter_verse(cv):
    return int(cv[:-3]), int(cv[-3:])

for rec in calendarium_json:
    if rec['model'] != 'calendarium.pericope':
        continue
    if rec['fields']['book'] not in GOSPELS:
        continue
    pk = int(rec['pk'])
    name = rec['fields']['display']
    nav.writerow((pk, name))
    fp = open(f'../explore/{pk}.md', 'w+')
    services = services_by_pericope_id[pk]
    s = '' if services_by_pericope_id[pk] == 1 else 's'
    reading = readings_by_pericope_id[pk]
    print(f'''\
---
title: {name}
pk: {pk}
permalink: /explore/{pk}/
noindex: true
---

{reading}

### Upcoming Services

God willing, this Gospel will be proclaimed at the following services:

''', file=fp)
    for date, service in services_by_pericope_id[pk]:
        date = datetime.date(*map(int, date.split('-')))
        url = f'https://orthocal.info/readings/gregorian/{date.strftime("%Y/%m/%d")}/'
        print(f'1. {service} on [{date.strftime("%B, %e, %Y")}]({url})', file=fp)
