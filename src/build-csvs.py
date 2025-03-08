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

dates_csv = csv.writer(open('dates.csv', 'w+'))
dt = datetime.date.today()
CUTOFF = dt + datetime.timedelta(days=365*10)
ONE_DAY = datetime.timedelta(days=1)
GOSPELS = 'Matthew Mark Luke John'.split()
N = 2  # number of readings to find
calendarium_json = json.load(open('orthocal-python/fixtures/calendarium.json'))
additional_json = json.load(open('additional.json'))

remaining = dict()
readings_for_dates = list()
dates_by_pericope_id = dict()

for rec in calendarium_json + additional_json:
    if rec['model'] != 'calendarium.pericope':
        continue
    if rec['fields']['book'] not in GOSPELS:
        continue
    pk = int(rec['pk'])
    remaining[pk] = N  # We look for the next N readings within CUTOFF years.
    dates_by_pericope_id[pk] = []

while remaining and dt < CUTOFF:
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

dates_csv.writerow(('id', 'date'))
for pericope_id, readings in dates_by_pericope_id.items():
    for date in readings:
        dates_csv.writerow((pericope_id, date))

print("Undiscovered proclamations:")
for pk, n in sorted(remaining.items()):
    print(f'http://localhost:4000/explore/{pk}', '' if n == N else f'... {n}!')
