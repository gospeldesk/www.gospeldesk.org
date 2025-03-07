---
title: "Matthew 10:16–22"
pk: "38"
permalink: "/readings/matthew-10-16-22/"
noindex: true
---

<div class="reading">
<p><span class="v">16</span>“Behold, I send you out as sheep among wolves. Therefore be wise as serpents, and harmless as doves.  <span class="v">17</span>But beware of men: for they will deliver you up to councils, and in their synagogues they will scourge you.  <span class="v">18</span>Yes, and you will be brought before governors and kings for my sake, for a testimony to them and to the nations.  <span class="v">19</span>But when they deliver you up, don’t be anxious how or what you will say, for it will be given you in that hour what you will say.  <span class="v">20</span>For it is not you who speak, but the Spirit of your Father who speaks in you.  <span class="v">21</span>“Brother will deliver up brother to death, and the father his child. Children will rise up against parents, and cause them to be put to death.  <span class="v">22</span>You will be hated by all men for my name’s sake, but he who endures to the end will be saved. </p>
</div>
{% if page.direct or page.indirect %}
### In This Passage
{% endif %}

{% if page.direct %}
#### Directly
<ol>
{% for slug in page.direct %}
  {% assign person =  site.characters | where:"slug", slug | first %}
  <li>{% if person != nil %}<a href="{{person.id}}">{{ person.name }}</a>{% else %}MISSING: {{ slug }}{% endif %}</li>
{% endfor %}
</ol>
{% endif %}

{% if page.direct %}
#### Indirectly
<ol>
{% for slug in page.indirect %}
  {% assign person =  site.characters | where:"slug", slug | first %}
  <li>{% if person != nil %}<a href="{{person.id}}">{{ person.name }}</a>{% else %}MISSING: {{ slug }}{% endif %}</li>
{% endfor %}
</ol>
{% endif %}


### Upcoming Proclamations

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="https://orthocal.info/readings/gregorian/2025/06/25/">June 25, 2025</a></b></u>, and then again on <a class="next-next-proclamation" href="https://orthocal.info/readings/gregorian/2026/06/17/">June 17, 2026</a>.

