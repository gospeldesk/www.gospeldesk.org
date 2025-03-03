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
meta_pericopes = open('meta-pericopes.txt')

dates_by_pericope_id = defaultdict(list)
for pericope_id, date in dates_csv:
    dates_by_pericope_id[int(pericope_id)].append(date)

texts_by_pericope_id = dict()
for pericope_id, text in texts_csv:
    texts_by_pericope_id[int(pericope_id)] = text

slugs = set()

def parse_chapter_verse(cv):
    return int(cv[:-3]), int(cv[-3:])

def flerp(date):
    d = datetime.date(*map(int, date.split('-')))
    url = f'https://orthocal.info/readings/gregorian/{d.strftime("%Y/%m/%d")}/'
    return (d.strftime("%B %e, %Y"), url)

for line in meta_pericopes:
    line = line.strip()
    if line.startswith('----'):
        if line.endswith('----'):
            fp = None
            continue
        title = line.split(None, 1)[1]
        slug = title.lower().replace(' ', '-')
        if slug in slugs:
            import pdb; pdb.set_trace()
        slugs.add(slug)
        print(slug)
        fp = open(f'../explore/{slug}.html', 'w+')

    if fp is None:
        continue

    continue

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
        assert len(dates) == 2
        d, url = flerp(dates[0])
        d2, url2 = flerp(dates[1])
        # case 0:
        #   this Gospel
        # case 1:
        #   most of this Gospel ({range})
        # case 2:
        #   a portion of this Gospel ({range})
        #   another portion of this Gospel ({range})
        upcoming = f'''\

### Upcoming Proclamations

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="{url}">{d}</a></b></u>, and then again on <a class="next-next-proclamation" href="{url2}">{d2}</a>.
'''
    print(f'''\
---
title: {name}
pk: {pk}
permalink: /explore/{pk}/
noindex: true
---

{text}
{upcoming}''', file=fp)
