---
title: "Luke 8:1–3"
pk: "237"
permalink: "/readings/luke-8-1-3/"
noindex: true
---

<div class="reading">
<p><span class="v">1</span>Soon afterwards, he went about through cities and villages, preaching and bringing the good news of God’s Kingdom. With him were the twelve,  <span class="v">2</span>and certain women who had been healed of evil spirits and infirmities: Mary who was called Magdalene, from whom seven demons had gone out;  <span class="v">3</span>and Joanna, the wife of Chuzas, Herod’s steward; Susanna; and many others; who served them from their possessions. </p>
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

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="https://orthocal.info/readings/gregorian/2025/10/14/">October 14, 2025</a></b></u>, and then again on <a class="next-next-proclamation" href="https://orthocal.info/readings/gregorian/2026/10/13/">October 13, 2026</a>.

