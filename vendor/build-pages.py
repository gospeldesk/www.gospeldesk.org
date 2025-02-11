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
additional_json = json.load(open('additional.json'))

services_by_pericope_id = defaultdict(list)
for pericope_id, date in services_csv:
    services_by_pericope_id[int(pericope_id)].append(date)

readings_by_pericope_id = defaultdict(list)
for pericope_id, reading in readings_csv:
    readings_by_pericope_id[int(pericope_id)] = reading

def parse_chapter_verse(cv):
    return int(cv[:-3]), int(cv[-3:])

for rec in calendarium_json + additional_json:
    if rec['model'] != 'calendarium.pericope':
        continue
    if rec['fields']['book'] not in GOSPELS:
        continue
    pk = int(rec['pk'])
    name = rec['fields']['display']
    nav.writerow((pk, name))
    fp = open(f'../explore/{pk}.md', 'w+')
    services = services_by_pericope_id[pk]
    reading = readings_by_pericope_id[pk]
    upcoming = ''
    if services:
        upcoming = f'''\

### Upcoming Proclamations

God willing, the Church will proclaim this Gospel in services on the following dates:

'''
        for date in services:
            date = datetime.date(*map(int, date.split('-')))
            url = f'https://orthocal.info/readings/gregorian/{date.strftime("%Y/%m/%d")}/'
            upcoming += f'1. [{date.strftime("%B, %e, %Y")}]({url})\n'
    print(f'''\
---
title: {name}
pk: {pk}
permalink: /explore/{pk}/
noindex: true
---

{reading}
{upcoming}''', file=fp)
