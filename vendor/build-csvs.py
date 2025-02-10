#!/usr/bin/env python3
import csv
import datetime
import json
import os
import sys
from collections import defaultdict

import django

sys.path.insert(0, 'orthocal-python')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "orthocal.settings")
django.setup()

from calendarium.liturgics.day import Day
from calendarium.models import Pericope

out = csv.writer(open('services.csv', 'w+'))
out2 = csv.writer(open('readings.csv', 'w+'))
dt = datetime.date.today()
ONE_DAY = datetime.timedelta(days=1)
GOSPELS = 'Matthew Mark Luke John'.split()
calendarium_json = json.load(open('orthocal-python/fixtures/calendarium.json'))
missing = set([int(x.strip()) for x in open('missing')]) # TODO: compute from sqlite

remaining = dict()
readings_for_dates = list()
dates_by_pericope_id = dict()
text_by_pericope_id = dict()

for rec in calendarium_json:
    if rec['model'] != 'calendarium.pericope':
        continue
    if rec['fields']['book'] not in GOSPELS:
        continue
    pk = int(rec['pk'])

    # Store text for all pericopes ...
    passage = Pericope.objects.get(id=pk).get_passage()
    text = ' '.join([v.content for v in passage])
    text_by_pericope_id[pk] = text

    # ... but only look for dates where we know we have them.
    if pk in missing:
        continue
    remaining[pk] = 3
    dates_by_pericope_id[pk] = []

while remaining:
    ymd = (dt.year, dt.month, dt.day)
    day = Day(*ymd)
    day.initialize()
    date = '%04d-%02d-%02d' % ymd
    print(date, len(remaining))
    readings = [r for r in day.get_readings() if r.source == 'Gospel']
    for reading in readings:
        pericope = reading.pericope
        pk = pericope.pk

        if pk not in remaining:
            continue

        x = reading.ordering
        if x > 1000:
            service = 'post-Liturgy'
        elif x > 900:
            service = 'Liturgy'
        elif x > 800:
            service = 'Liturgy'
        elif x > 700:
            service = 'Matins'
        elif x > 600:
            service = 'Vespers'
        elif x > 500:
            service = 'Vespers'
        elif x > 400:
            service = '9th hour'
        elif x > 300:
            service = '6th hour'
        elif x > 200:
            service = '3rd hour'
        elif x > 100:
            service = '1st hour'
        elif x > 0:
            service = 'Matins'

        dates_by_pericope_id[pk].append((date, service))
        remaining[pk] -= 1
        if remaining[pk] == 0:
            del remaining[pk]

    dt += ONE_DAY


out.writerow(('id', 'date', 'service'))
for pericope_id, readings in dates_by_pericope_id.items():
    for date, service in readings:
        out.writerow((pericope_id, date, service))

out2.writerow(('id', 'text'))
for pericope_id, text in text_by_pericope_id.items():
    out2.writerow((pericope_id, text))
