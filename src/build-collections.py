#!/usr/bin/env python3
import csv
import datetime
import json
import os
import sys
import string
from collections import defaultdict

LETTERS_NUMBERS = string.ascii_letters + string.digits
GOSPELS = 'Matthew Mark Luke John'.split()

# Load dates.
dates_csv = csv.reader(open('dates.csv'))
next(dates_csv) # skip headers
dates_by_pericope_id = defaultdict(list)
for pericope_id, date in dates_csv:
    dates_by_pericope_id[int(pericope_id)].append(date)

# Load verses.
gospels_csv = csv.reader(open('gospels.csv'))
WEB = defaultdict(lambda: defaultdict(dict))
for b,c,v,text in gospels_csv:
    WEB[b][int(c)][int(v)] = text

BK = {
    'MAT': 'Matt',
    'MRK': 'Mark',
    'LUK': 'Luke',
    'JHN': 'John'
}

def flerp(date):
    d = datetime.date(*map(int, date.split('-')))
    url = f'https://orthocal.info/readings/gregorian/{d.strftime("%Y/%m/%d")}/'
    return (d.strftime("%B %e, %Y"), url)

def sluggize(base):
    chars = [char if char in LETTERS_NUMBERS else ' ' for char in base.lower()]
    return  '-'.join(''.join(chars).split())

def main():
    i, cur, pericopes = 0, None, []
    Pericope.reset()

    for line in open('master.txt'):
        line = line.rstrip()
        if line.startswith('-- '):
            continue  # comment
        if line.startswith('----'):
            if cur:
                cur.flush()
            if line.endswith('----'):
                title = ''
                subtitle = ''
            else:
                title = line.split(None, 1)[1]
                subtitle = ''
                open_quote = close_quote = False
                if title.startswith('"'):
                    title = title[1:]
                    open_quote = True
                if title.endswith('"'):
                    title = title[:-1]
                    close_quote = True
                if ':' in title:
                    title, subtitle = title.split(':')
                    subtitle = subtitle.strip()
            i += 1
            cur = Pericope(i, title, subtitle, open_quote, close_quote)
            pericopes.append(cur)
        else:
            cur.add(line)
    cur.flush()

    N = len(pericopes)
    for i in range(N):
        pericope = pericopes[i]
        prev = '' if i == 0 else pericopes[i-1].slug
        next_ = '' if i == N-1 else pericopes[i+1].slug
        pericope.prev = prev
        pericope.next = next_
        pericope.write()

    old = {fn.split('.')[0] for fn in os.listdir('../_readings')}
    new = Pericope.slugs
    for slug in old - Pericope.slugs:
        print('pruning', slug)
        os.unlink(f'../_readings/{slug}.md')

class Pericope(object):

    @classmethod
    def reset(cls):
        cls.slugs = set()

    def __init__(self, i, title, subtitle, open_quote, close_quote):
        self.i = i
        self.title = title
        self.subtitle = subtitle
        self.open_quote = open_quote
        self.close_quote = close_quote
        self.pks = set()
        self.verse_buffer = []
        self.elements = []
        self.direct = []
        self.indirect = []
        self.related = []
        self.prev = ''
        self.next = ''

    def add(self, line):
        if line.startswith('#'):
            if line[1:]:
                self.flush_paragraph()
                self.elements.append(line[1:])
        elif not line:
            self.flush_paragraph()
        elif line.startswith('>'):
            self.related = line[1:].strip().split()
        elif line.startswith('||'):
            self.indirect = line[2:].strip().split()
        elif line.startswith('|'):
            self.direct = line[1:].strip().split()
        elif line.startswith(' '):
            splitter = line.strip().replace('"', '”')
            h, t = splitter.split()
            head, tail = self.verse_buffer[-1][3].split(splitter)
            head += h
            tail = t + tail
            self.verse_buffer[-1][3] = head
            self.flush_paragraph()
            self.verse_buffer.append([None, None, None, tail])
        else:
            bcv = line[:10]
            pks = line[10:].strip()
            b, cv = bcv.split()
            c, v = map(int, cv.split(':'))
            for pk in pks.split():
                self.pks.add(pk.replace(',', ''))
            text = WEB[b][c][v]
            self.verse_buffer.append([b,c,v, text])

    @property
    def text(self):
        def make_verse(b,c,v, text):
            if v:
                return f'<span class="v">{v}</span>{text}'
            else:
                return text

        fragments = []
        i_last = len(self.elements) - 1
        for i, el in enumerate(self.elements):
            if type(el) is str:     # section heading
                fragments.append(f'<h4>{el.strip()}</h4>')
            elif type(el) is list:  # paragraph
                text =  ' '.join([make_verse(*a) for a in el])
                if self.open_quote and i == 0:
                    v = ''
                    if text.startswith('<span class="v">'):
                        v, text = text.split('</span>', 1)
                        v += '</span>'
                    text = v + '“' + text
                if self.close_quote and i == i_last:
                    text = text.rstrip() + '”'
                fragments.append(f'<p>{text}</p>')
        return '\n'.join(fragments)

    @property
    def ref(self):
        sb,sc,sv,st = self.elements[0][0]
        eb,ec,ev,et = self.elements[-1][-1]
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

        # create slug - done late so ref is available
        if not self.title:
            self.title = self.ref
        slug_base = self.title
        if self.subtitle:
            slug_base += ': ' + self.subtitle
        slug = sluggize(slug_base)
        assert slug not in self.slugs, slug
        self.slugs.add(slug)
        self.slug = slug

    def write(self):
        if self.title == self.ref:
            excerpt = ''
        else:
            excerpt = self.ref
            try:
                os.unlink(f'../_readings/{sluggize(self.ref)}.md')
            except FileNotFoundError:
                pass

        try:
            old = fp = open(f'../_readings/{self.slug}.md').read()
        except FileNotFoundError:
            old = ''
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
        frontmatter = ''
        if self.title != self.ref:
            frontmatter += 'ref: "' + self.ref + '"\n'
        if self.subtitle :
            frontmatter += 'subtitle: "' + self.subtitle + '"\n'
        if self.related:
            frontmatter += 'related: ["' + '", "'.join(self.related) + '"]\n'
        if self.direct:
            frontmatter += 'direct: ["' + '", "'.join(self.direct) + '"]\n'
        if self.indirect:
            frontmatter += 'indirect: ["' + '", "'.join(self.indirect) + '"]\n'
        if self.prev:
            frontmatter += 'prev_slug: "' + self.prev + '"\n'
        if self.next:
            frontmatter += 'next_slug: "' + self.next + '"\n'

        new = f'''\
---
title: "{self.title}"
pk: "{pk}"
num: {self.i}
excerpt: "{excerpt}"
noindex: true
{frontmatter}---

{self.text}

{upcoming}'''

        if new != old:
            open(f'../_readings/{self.slug}.md', 'w+').write(new)

if __name__ == '__main__':
    if '-d' in sys.argv:
        for line in sys.stdin:
            sys.stdout.write(line)
            main()
    else:
        main()
