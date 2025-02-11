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
from calendarium.models import Pericope, Verse, Reading

out = csv.writer(open('services.csv', 'w+'))
out2 = csv.writer(open('readings.csv', 'w+'))
dt = datetime.date.today()
ONE_DAY = datetime.timedelta(days=1)
GOSPELS = 'Matthew Mark Luke John'.split()
calendarium_json = json.load(open('orthocal-python/fixtures/calendarium.json'))
additional_json = json.load(open('additional.json'))
known_pericope_ids = set([x['pericope'] for x in
    Reading.objects.filter(source='Gospel').values('pericope').distinct()])
known_pericope_ids.remove(113) # hack - I'm not finding a date for this one in the next 10 years

remaining = dict()
readings_for_dates = list()
dates_by_pericope_id = dict()
text_by_pericope_id = dict()

for rec in calendarium_json + additional_json:
    if rec['model'] != 'calendarium.pericope':
        continue
    if rec['fields']['book'] not in GOSPELS:
        continue
    pk = int(rec['pk'])

    # Store text for all pericopes ...
    passage = Verse.objects.lookup_reference(rec['fields']['sdisplay'])
    text = ' '.join([v.content for v in passage])
    text_by_pericope_id[pk] = text

    # ... but only look for dates where we know we will find them in the next few years.
    if pk not in known_pericope_ids:
        continue
    remaining[pk] = 3
    dates_by_pericope_id[pk] = []

while remaining:
    ymd = (dt.year, dt.month, dt.day)
    day = Day(*ymd)
    day.initialize()
    date = '%04d-%02d-%02d' % ymd
    #print(date, len(remaining))
    readings = [r for r in day.get_readings() if r.source == 'Gospel']
    for reading in readings:
        pericope = reading.pericope
        pk = pericope.pk

        if pk not in remaining:
            continue

        dates_by_pericope_id[pk].append(date)
        remaining[pk] -= 1
        if remaining[pk] == 0:
            del remaining[pk]

    dt += ONE_DAY


out.writerow(('id', 'date'))
for pericope_id, readings in dates_by_pericope_id.items():
    for date in readings:
        out.writerow((pericope_id, date))

out2.writerow(('id', 'text'))
for pericope_id, text in text_by_pericope_id.items():
    out2.writerow((pericope_id, text))
