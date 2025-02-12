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

out = csv.writer(open('dates.csv', 'w+'))
out2 = csv.writer(open('texts.csv', 'w+'))
dt = datetime.date.today()
cutoff = dt + datetime.timedelta(days=365*10)
ONE_DAY = datetime.timedelta(days=1)
GOSPELS = 'Matthew Mark Luke John'.split()
calendarium_json = json.load(open('orthocal-python/fixtures/calendarium.json'))
additional_json = json.load(open('additional.json'))

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

    # Store text for all pericopes.
    passage = Verse.objects.lookup_reference(rec['fields']['sdisplay'])
    text = ' '.join([v.content for v in passage])
    text_by_pericope_id[pk] = text

    remaining[pk] = 3  # We look for the next three proclamations (within 10 years).
    dates_by_pericope_id[pk] = []

while remaining and dt < cutoff:
    ymd = (dt.year, dt.month, dt.day)
    day = Day(*ymd)
    day.initialize()
    date = '%04d-%02d-%02d' % ymd
    print(date, len(remaining))
    readings = [r for r in day.get_readings() if r.pericope.book in GOSPELS]
    for reading in readings:
        pericope = reading.pericope
        pk = pericope.pk
        if pk not in remaining:
            continue
        if date not in dates_by_pericope_id[pk]:  # some rare double-ups
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

print("Undiscovered proclamations:")
for pk, n in sorted(remaining.items()):
    print(f'http://localhost:4000/explore/{pk}', '' if n == 3 else f'... {n}!')
