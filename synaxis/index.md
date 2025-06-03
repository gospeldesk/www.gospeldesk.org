---
title: "Synaxis of the Gospels"
---
<a href="/2024/toward-a-synaxis-of-the-gospels/synaxis-of-the-gospels.jpg"><img src="/2024/toward-a-synaxis-of-the-gospels/synaxis-of-the-gospels.640.jpg"></a>

{% assign groups = site.synaxis | sort:"order" %}
{% for group in groups %}
<h3>{{ group.title }}</h3>
<ol>
{% assign characters = group.characters | split: " " %}
{% for slug in characters %}
  {% assign person =  site.characters | where:"slug", slug | first %}
  <li>{% if person != nil %}<a href="{{person.id}}">{{ person.name }}</a>{% else %}MISSING: {{ slug }}{% endif %}</li>
{% endfor %}
</ol>
{% endfor %}
