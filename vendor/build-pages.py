#!/usr/bin/env python3
import csv
import datetime
import json
import string
from collections import defaultdict

LETTERS_NUMBERS = string.ascii_letters + string.digits
GOSPELS = 'Matthew Mark Luke John'.split()
nav = csv.writer(open('../_data/readings.csv', 'w+'))
nav.writerow(('slug', 'title', 'ref'))
dates_csv = csv.reader(open('dates.csv'))
next(dates_csv) # skip headers
gospels_csv = csv.reader(open('gospels.csv'))
meta_pericopes = open('meta-pericopes.txt')

dates_by_pericope_id = defaultdict(list)
for pericope_id, date in dates_csv:
    dates_by_pericope_id[int(pericope_id)].append(date)

WEB = defaultdict(lambda: defaultdict(dict))
for b,c,v,text in gospels_csv:
    WEB[b][int(c)][int(v)] = text

BK = {
    'MAT': 'Matt',
    'MRK': 'Mark',
    'LUK': 'Luke',
    'JHN': 'John'
}

def htmlize(b,c,v,t):
    return f'<span class="verse"><span class="v">{v}</span>{t}</span>'

def flerp(date):
    d = datetime.date(*map(int, date.split('-')))
    url = f'https://orthocal.info/readings/gregorian/{d.strftime("%Y/%m/%d")}/'
    return (d.strftime("%B %e, %Y"), url)

def main():
    cur = None

    for line in meta_pericopes:
        line = line.strip()
        if line == '====':
            continue
        elif line.startswith('----'):
            if cur:
                cur.flush()
            if line.endswith('----'):
                title = ''
            else:
                title = line.split(None, 1)[1]
            cur = Pericope(title)
        else:
            cur.add(line)

class Pericope(object):

    __slugs = set()

    def __init__(self, title):
        self.title = title
        self.pks = set()
        self.verse_buffer = []
        self.elements = []

    def add(self, line):
        if line.startswith('#'):
            if line[1:]:
                self.elements.append(line[1:])
        elif not line:
            self.flush_paragraph()
        else:
            bcv = line[:10]
            pks = line[10:].strip()
            b, cv = bcv.split()
            c, v = map(int, cv.split(':'))
            for pk in pks.split():
                self.pks.add(pk.replace(',', ''))
            self.verse_buffer.append((b,c,v))

    @property
    def text(self):
        fragments = []
        for el in self.elements:
            if type(el) is str:     # section heading
                fragments.append(f'<h3>{el}</h3>')
            elif type(el) is list:  # paragraph
                text =  ' '.join([htmlize(b,c,v, WEB[b][c][v]) for b,c,v in el])
                fragments.append(f'<p>{text}</p>')
        return '\n'.join(fragments)

    @property
    def ref(self):
        sb,sc,sv = self.elements[0][0]
        eb,ec,ev = self.elements[-1][-1]
        sb = 'Matthew' if sb == 'Matt' else sb
        eb = 'Matthew' if eb == 'Matt' else eb
        # TODO make this fully robust
        if eb != sb:
            return 'Composite'
        elif ec != sc:
            return f'{sb} {sc}:{sv}–{ec}:{ev}'
        else:
            return f'{sb} {sc}:{sv}–{ev}'

    def flush_paragraph(self):
        self.elements.append(self.verse_buffer)
        self.verse_buffer = []

    def flush(self):
        self.flush_paragraph()

        if self.title:
            title = self.title
            ref = self.ref
        else:
            title = self.ref
            ref = ''

        slug = [c if c in LETTERS_NUMBERS else ' ' for c in title.lower()]
        slug = '-'.join(''.join(slug).split())
        assert slug not in self.__slugs, slug
        self.__slugs.add(slug)

        nav.writerow((slug, title, ref))

        fp = open(f'../explore/{slug}.md', 'w+')
        pk = ''
        dates = None
        if self.pks:
            pk = int(sorted(self.pks)[0])
            dates = dates_by_pericope_id[pk]
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
title: "{title}"
pk: "{pk}"
permalink: "/explore/{slug}/"
noindex: true
---

{self.text}
{upcoming}''', file=fp)

if __name__ == '__main__':
    main()
