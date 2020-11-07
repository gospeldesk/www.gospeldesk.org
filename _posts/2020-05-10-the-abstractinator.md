---
layout: post
heading: The Abstractinator
excerpt: "I am writing software to help compile information for <cite>The Gospels, with a Narrative Apparatus</cite>."
byline: by Chad Whitacre
is_published: yes
---

I hope, under God, to publish a print edition of the Gospels that encodes more
information about their narrative structure than standard text layout
conventions allow for. By "standard text layout conventions" I'm referring to
things like whitespace, punctuation, paragraphing, and sections. I want more! I
want to see the frames, scenes, and characters of the story. I'm calling the
visual representation of this extra information a "[narrative
apparatus](/a-narrative-apparatus/)" (on the pattern of a [critical
apparatus](https://en.wikipedia.org/wiki/Critical_apparatus)).

---

[![Prototype 1.0](/a-narrative-apparatus/prototype-1.png)](/a-narrative-apparatus/prototype-1.pdf)

<div class="caption">A prototype of <cite>The Gospels, with a Narrative
Apparatus</cite>.</div>

---

In order to produce this edition, I need to first compile the information I
want to include regarding the Gospels' narrative structure. So far I've been
using ad-hoc text files and simple scripts for this sort of thing, but to
accomplish what I want with the Narrative Apparatus, I need to go deeper, so I
have started working on software specifically for this purpose. I'm calling it
The Abstractinator.


#### Decoding Abstractions in Text

The Abstractinator is software to decode all of the textual abstractions in the
entire Tri-State Area (that's a [cartoon
reference](https://phineasandferb.fandom.com/wiki/List_of_Doofenshmirtz%27s_schemes_and_inventions),
for my kids 😁).

Maybe some day the scope of The Abstractinator will expand downwards into text
criticism, and characters (text characters, as opposed to story characters)
will be the atom. For now, <b>words</b> are the atom. The Abstractinator helps
me gather words into <b>selections</b>, and those selections into higher-order
selections. A hierarchy of selections is a <b>stack</b>, and The Abstractinator
lets me attach my own names to each level in each stack. A <b>book</b> in
The Abstractinator is the full ordered set of words that are in scope at a
given time.

For example, the [SBLGNT](http://sblgnt.com/) defines an ordered set of words
comprising an edition of the Greek New Testament: a book. They of course gather
words into the well-established [verse and
chapter](https://en.wikipedia.org/wiki/Chapters_and_verses_of_the_Bible)
divisions. This is a stack in Abstractinator terminology, "verse" being the
name for a first-order selection of words within this stack, and "chapter"
naming a second-order selection of verses. The SBLGNT also gathers words into
paragraphs, and paragraphs into sections: a second stack. Interestingly, this
second stack intersects with the first, in that chapter breaks always land on
paragraph breaks. SBLGNT sections _are_ chapters. I haven't looked to see
whether verses ever cross a paragraph boundary.

---

[![SBLGNT sections are chapters](../sblgnt-chapter-section.png)](../sblgnt-chapter-section.png)

<div class="caption">In the SBLGNT, sections <u>are</u> chapters.</div>

---

In developing my own set of narrative abstractions, I would like to use the
SBLGNT, since the Greek is more definitive, but I think I should start with an
English translation, to be more accessible. I expect to operate first on the
WEB, since that is the version I used for [The Gospels](/the-gospels/), and
partnerships for the ALV, ESV, or NIV seem quite remote.

There are lots of interesting challenges here, both technical and in terms of
user experience. So far I've implemented word selection (as opposed to the
standard character-based selection we're all used to) and it's enough to get me
excited about the possibilities and want to share it with you. I actually
started building something like this way back in 2007. Maybe this time it will
actually come to fruition.

Stay tuned! 📺

---

[![The Abstractinator](../the-abstractinator.png)](../the-abstractinator.png)
