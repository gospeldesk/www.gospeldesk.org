---
title: "Calling of the First Apostles"
pk: "9"
permalink: "/readings/calling-of-the-first-apostles/"
noindex: true
---

<div class="reading">
<p><span class="v">18</span>Walking by the sea of Galilee, he saw two brothers: Simon, who is called Peter, and Andrew, his brother, casting a net into the sea; for they were fishermen.  <span class="v">19</span>He said to them, “Come after me, and I will make you fishers for men.”  <span class="v">20</span>They immediately left their nets and followed him.  <span class="v">21</span>Going on from there, he saw two other brothers, James the son of Zebedee, and John his brother, in the boat with Zebedee their father, mending their nets. He called them.  <span class="v">22</span>They immediately left the boat and their father, and followed him.  <span class="v">23</span>Jesus went about in all Galilee, teaching in their synagogues, preaching the Good News of the Kingdom, and healing every disease and every sickness among the people.  <span class="v">24</span>The report about him went out into all Syria. They brought to him all who were sick, afflicted with various diseases and torments, possessed with demons, epileptics, and paralytics; and he healed them. </p>
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

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="https://orthocal.info/readings/gregorian/2025/06/22/">June 22, 2025</a></b></u>, and then again on <a class="next-next-proclamation" href="https://orthocal.info/readings/gregorian/2026/06/14/">June 14, 2026</a>.

