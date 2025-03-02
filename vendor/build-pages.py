#!/usr/bin/env python3
import csv
import datetime
import json
from collections import defaultdict

GOSPELS = 'Matthew Mark Luke John'.split()
nav = csv.writer(open('../_data/readings.csv', 'w+'))
nav.writerow(('pk', 'name'))
dates_csv = csv.reader(open('dates.csv'))
texts_csv = csv.reader(open('texts.csv'))
next(dates_csv), next(texts_csv) # skip headers
calendarium_json = json.load(open('orthocal-python/fixtures/calendarium.json'))
additional_json = json.load(open('additional.json'))

dates_by_pericope_id = defaultdict(list)
for pericope_id, date in dates_csv:
    dates_by_pericope_id[int(pericope_id)].append(date)

texts_by_pericope_id = dict()
for pericope_id, text in texts_csv:
    texts_by_pericope_id[int(pericope_id)] = text


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
    dates = dates_by_pericope_id[pk]
    text = texts_by_pericope_id[pk]
    upcoming = ''
    if dates:
        upcoming = f'''\

### Upcoming Proclamations

God willing, the Church will proclaim this Gospel on the following dates:

'''
        for date in dates:
            d = datetime.date(*map(int, date.split('-')))
            url = f'https://orthocal.info/readings/gregorian/{d.strftime("%Y/%m/%d")}/'
            upcoming += f'1. [{d.strftime("%B, %e, %Y")}]({url})\n'
    print(f'''\
---
title: {name}
pk: {pk}
permalink: /explore/{pk}/
noindex: true
---

{text}
{upcoming}''', file=fp)
