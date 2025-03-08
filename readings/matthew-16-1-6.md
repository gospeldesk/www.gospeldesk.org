---
title: "Matthew 16:1–6"
pk: "70"
permalink: "/readings/matthew-16-1-6/"
noindex: true
---

<div class="reading">
<p><span class="v">1</span>The Pharisees and Sadducees came, and testing him, asked him to show them a sign from heaven.  <span class="v">2</span>But he answered them, “When it is evening, you say, ‘It will be fair weather, for the sky is red.’  <span class="v">3</span>In the morning, ‘It will be foul weather today, for the sky is red and threatening.’ Hypocrites! You know how to discern the appearance of the sky, but you can’t discern the signs of the times!  <span class="v">4</span>An evil and adulterous generation seeks after a sign, and there will be no sign given to it, except the sign of the prophet Jonah.” He left them, and departed.  <span class="v">5</span>The disciples came to the other side and had forgotten to take bread.  <span class="v">6</span>Jesus said to them, “Take heed and beware of the yeast of the Pharisees and Sadducees.” </p>
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

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="https://orthocal.info/readings/gregorian/2025/07/28/">July 28, 2025</a></b></u>, and then again on <a class="next-next-proclamation" href="https://orthocal.info/readings/gregorian/2026/07/20/">July 20, 2026</a>.

