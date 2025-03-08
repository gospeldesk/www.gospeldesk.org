---
title: "Mark 6:1–7"
pk: "149"
permalink: "/readings/mark-6-1-7/"
noindex: true
---

<div class="reading">
<p><span class="v">1</span>He went out from there. He came into his own country, and his disciples followed him.  <span class="v">2</span>When the Sabbath had come, he began to teach in the synagogue, and many hearing him were astonished, saying, “Where did this man get these things?” and, “What is the wisdom that is given to this man, that such mighty works come about by his hands?  <span class="v">3</span>Isn’t this the carpenter, the son of Mary, and brother of James, Joses, Judah, and Simon? Aren’t his sisters here with us?” They were offended at him.  <span class="v">4</span>Jesus said to them, “A prophet is not without honor, except in his own country, and among his own relatives, and in his own house.”  <span class="v">5</span>He could do no mighty work there, except that he laid his hands on a few sick people, and healed them.  <span class="v">6</span>He marveled because of their unbelief. He went around the villages teaching.  <span class="v">7</span>He called to himself the twelve, and began to send them out two by two; and he gave them authority over the unclean spirits. </p>
</div>
{% if page.direct or page.indirect %}
### In This Passage
{% endif %}

{% if page.direct %}
{% if page.indirect %}
#### Directly
{% endif %}
<ol>
{% for slug in page.direct %}
  {% assign person =  site.characters | where:"slug", slug | first %}
  <li>{% if person != nil %}<a href="{{person.id}}">{{ person.name }}</a>{% else %}MISSING: {{ slug }}{% endif %}</li>
{% endfor %}
</ol>
{% endif %}

{% if page.indirect %}
{% if page.direct %}
#### Indirectly
{% endif %}
<ol>
{% for slug in page.indirect %}
  {% assign person =  site.characters | where:"slug", slug | first %}
  <li>{% if person != nil %}<a href="{{person.id}}">{{ person.name }}</a>{% else %}MISSING: {{ slug }}{% endif %}</li>
{% endfor %}
</ol>
{% endif %}


### Upcoming Proclamations

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="https://orthocal.info/readings/gregorian/2025/09/16/">September 16, 2025</a></b></u>, and then again on <a class="next-next-proclamation" href="https://orthocal.info/readings/gregorian/2026/09/08/">September  8, 2026</a>.

