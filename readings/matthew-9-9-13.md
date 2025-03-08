---
title: "Matthew 9:9–13"
pk: "31"
permalink: "/readings/matthew-9-9-13/"
noindex: true
---

<div class="reading">
<p><span class="v">9</span>As Jesus passed by from there, he saw a man called Matthew sitting at the tax collection office. He said to him, “Follow me.” He got up and followed him.  <span class="v">10</span>As he sat in the house, behold, many tax collectors and sinners came and sat down with Jesus and his disciples.  <span class="v">11</span>When the Pharisees saw it, they said to his disciples, “Why does your teacher eat with tax collectors and sinners?”  <span class="v">12</span>When Jesus heard it, he said to them, “Those who are healthy have no need for a physician, but those who are sick do.  <span class="v">13</span>But you go and learn what this means: ‘I desire mercy, and not sacrifice,’ for I came not to call the righteous, but sinners to repentance.” </p>
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

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="https://orthocal.info/readings/gregorian/2025/07/12/">July 12, 2025</a></b></u>, and then again on <a class="next-next-proclamation" href="https://orthocal.info/readings/gregorian/2025/11/16/">November 16, 2025</a>.

