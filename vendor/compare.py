#!/usr/bin/env python
load = lambda path: set([int(x.strip()) for x in open(path)])
missing = load('missing')
not_missing = load('orthocal-python/not-missing')
import pdb; pdb.set_trace()
assert not (missing ^ not_missing)
for x in range(398):
    print(x)
