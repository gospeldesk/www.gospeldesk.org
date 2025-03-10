#!/usr/bin/env python3

control = set()
for line in open('verses.txt'):
    b,c,vstar = line.strip().split(None, 2)
    v = vstar.split()[0] if '*' in vstar else vstar
    control.add((b,c,v))

test = set()
GOSPELS = 'Matt Mark Luke John'.split()
for line in open('master.txt'):
    if line[:4] not in GOSPELS:
        continue
    b, cv, pks = line.strip().split(None, 2)
    c, v = cv.split(':')
    test.add((b,c,v,))

if control != test:
    print(control - test)
    print(test - control)
