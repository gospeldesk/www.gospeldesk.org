#!/usr/bin/env python3
import csv
import datetime
import json
import os
import re
import sys
import string
import traceback
from collections import defaultdict

LETTERS_NUMBERS = string.ascii_letters + string.digits
SKIP = "'"
GOSPELS = 'Matthew Mark Luke John'.split()

def flerp(date):
    d = datetime.date(*map(int, date.split('-')))
    url = f'https://www.oca.org/readings/daily/{d.strftime("%Y/%m/%d")}'
    return (d.strftime("%B %e, %Y"), url)

def sluggize(title, subtitle=''):
    base = title
    if subtitle:
        base += ': ' + subtitle
    chars = []
    for char in base.lower():
        if char in LETTERS_NUMBERS:
            pass
        elif char in SKIP:
            char = ""
        else:
            char = " "
        chars.append(char)
    # '  foo bar   '.split() == ['foo', 'bar'] 👍
    return  '-'.join(''.join(chars).split())

def check_quote(s):
    open_quote = close_quote = ''
    if s.startswith('"'):
        s, open_quote = s[1:], '“'
    if s.endswith('"'):
        s, close_quote = s[:-1], '”'
    return s, open_quote, close_quote

def main():
    i, cur, pericopes = 0, None, []
    Pericope.reset()

    for line in open('source.txt'):
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
                if ':' in title:
                    title, subtitle = title.split(':')
                    subtitle = subtitle.strip()
            i += 1
            cur = Pericope(i, title, subtitle)
            pericopes.append(cur)
        else:
            try:
                cur.add(line)
            except:
                print("choked on: \x1b[1;31m", line, "\x1b[0m")
                raise
    cur.flush()

    N = len(pericopes)
    for i in range(N):
        pericope = pericopes[i]
        prev = '' if i == 0 else pericopes[i-1].slug
        next_ = '' if i == N-1 else pericopes[i+1].slug
        pericope.prev = prev
        pericope.next = next_
        pericope.write()

    known = {fn.split('.')[0] for fn in os.listdir('../_readings')}
    for slug in known - Pericope.slugs:
        print('pruning', slug)
        os.unlink(f'../_readings/{slug}.md')

    for char in characters:
        filepath = f'../_characters/{char}.md'
        if os.path.exists(filepath):
            continue
        name = char.title()
        open(filepath, 'w+').write(f'''\
---
name: "{name}"
---
''')
    known = {fn.split('.')[0] for fn in os.listdir('../_characters')}
    for char in known - characters:
        print('pruning', char)
        os.unlink(f'../_characters/{char}.md')

class Pericope(object):

    @classmethod
    def reset(cls):
        cls.slugs = set()
        cls.book = ''

    def __init__(self, i, title, subtitle):
        if not title:
            raise ValueError # they should all have titles by now

        self.i = i
        self.title = title
        self.subtitle = subtitle

        slug = sluggize(title, subtitle)
        assert slug not in self.slugs, slug
        self.slugs.add(slug)
        self.slug = slug
        if '(' in self.title:
            self.title = self.title.split('(')[0].rstrip()

        self.pks = set()
        self.verse_buffer = []
        self.elements = []
        self.direct, self.indirect = characters_by_slug[self.slug]
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
        elif line.startswith('  '):
            splitter = line.strip()
            splitter = splitter.replace('" ', '” ')
            splitter = splitter.replace(' "', ' “')
            h, t = splitter.split()
            b,c,v, inc, text = self.verse_buffer[-1]
            head, tail = text.split(splitter)
            head += h
            tail = t + tail
            self.verse_buffer[-1][4] = head
            self.flush_paragraph()
            self.verse_buffer.append([b,c,v, False, tail])
        else:
            line, open_quote, close_quote = check_quote(line)
            bcv = line[:10]
            pks_sub = line[10:].strip()
            if 's/' in pks_sub:
                pks, sub = pks_sub.split('s/', 1)
                pks = pks.rstrip()
            else:
                pks = pks_sub
                sub = ''
            b, cv = bcv.split()
            book = 'Matthew' if b == 'Matt' else b
            if self.book:
                if self.book != book:
                    self.book = 'Composite'
            else:
                self.book = book
            c, v = map(int, cv.split(':'))
            for pk in pks.split():
                self.pks.add(pk.replace(',', ''))
            text = open_quote + WEB[b][c][v]
            if close_quote:
                text = text.rstrip() + close_quote
            if sub:
                frm, to = sub.split('/')
                text = re.sub(frm, to, text)
            self.verse_buffer.append([b,c,v, True, text])

    @property
    def text(self):
        def make_verse(b,c,v, inc, text):
            if inc:
                return f'<span class="v">{v}</span>{text}'
            else:
                return text

        fragments = []
        for el in self.elements:
            if type(el) is str:     # section heading
                fragments.append(f'<h4>{el.strip()}</h4>')
            elif type(el) is list:  # paragraph
                text =  ' '.join([make_verse(*a) for a in el])
                fragments.append(f'<p>{text}</p>')
        return '\n'.join(fragments)

    @property
    def ref(self):
        sb,sc,sv,_,st = self.elements[0][0]
        eb,ec,ev,_,et = self.elements[-1][-1]
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
book: "{self.book}"
excerpt: "{excerpt}"
noindex: true
{frontmatter}---

{self.text}

{upcoming}'''

        if new != old:
            open(f'../_readings/{self.slug}.md', 'w+').write(new)

        if '--csv' in sys.argv:
            csv_ref = self.ref
            csv_slug = self.slug
            csv_title = self.title
            if self.subtitle:
                csv_title += ': ' + self.subtitle
            print(f'"{csv_ref}","=HYPERLINK(""https://www.gospeldesk.org/readings/{csv_slug}/"", ""{csv_title}"")"')

# Load dates.
dates_csv = csv.reader(open('dates.csv'))
next(dates_csv) # skip headers
dates_by_pericope_id = defaultdict(list)
for pericope_id, date in dates_csv:
    dates_by_pericope_id[int(pericope_id)].append(date)

# Load characters.
characters_csv = csv.reader(open('characters.csv'))
next(characters_csv) # skip headers
characters_by_slug = defaultdict(lambda: [None, None])
def clean(chars):
    out = []
    for c in chars.split():
        out.append(c.lower())
    return out
characters = set()
for passage, title, direct, indirect in characters_csv:
    slug = sluggize(title)

    direct = clean(direct)
    characters |= set(direct)
    characters_by_slug[slug][0] = direct

    indirect = clean(indirect)
    characters |= set(indirect)
    characters_by_slug[slug][1] = indirect


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


if __name__ == '__main__':
    if '-d' in sys.argv:
        for line in sys.stdin:
            sys.stdout.write(line)
            try:
                main()
            except KeyboardInterrupt:
                raise
            except:
                print()
                traceback.print_exc()
                print()
    else:
        main()
