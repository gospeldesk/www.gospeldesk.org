#!/usr/bin/env python3
import csv
import datetime
import os
import sys
from collections import defaultdict

import django

sys.path.insert(0, 'orthocal-python')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "orthocal.settings")
django.setup()

from calendarium.liturgics.day import Day

out = csv.writer(open('services.csv', 'w+'))
out2 = csv.writer(open('readings.csv', 'w+'))
dt = datetime.date.today()
ONE_DAY = datetime.timedelta(days=1)

readings_for_dates = []

for i in range(365+7):
    ymd = (dt.year, dt.month, dt.day)
    day = Day(*ymd)
    day.initialize()
    readings = [r for r in day.get_readings() if r.source == 'Gospel']
    readings_for_dates.append(('%04d-%02d-%02d' % ymd, readings))
    dt += ONE_DAY

dates_by_pericope_id = defaultdict(list)
text_by_pericope_id = dict()
for date, readings in readings_for_dates:
    for reading in readings:
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
        pericope = reading.pericope
        text = ' '.join([v.content for v in pericope.get_passage()])
        dates_by_pericope_id[reading.pericope.pk].append((date, service))
        text_by_pericope_id[reading.pericope.pk] = text

out.writerow(('id', 'date', 'service'))
for pericope_id, readings in dates_by_pericope_id.items():
    for date, service in readings:
        out.writerow((pericope_id, date, service))

out2.writerow(('id', 'text'))
for pericope_id, text in text_by_pericope_id.items():
    out2.writerow((pericope_id, text))
