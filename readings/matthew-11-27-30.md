---
title: "Matthew 11:27–30"
pk: "46"
permalink: "/readings/matthew-11-27-30/"
noindex: true
---

<div class="reading">
<p><span class="v">27</span>All things have been delivered to me by my Father. No one knows the Son, except the Father; neither does anyone know the Father, except the Son, and he to whom the Son desires to reveal him.  <span class="v">28</span>“Come to me, all you who labor and are heavily burdened, and I will give you rest.  <span class="v">29</span>Take my yoke upon you, and learn from me, for I am gentle and humble in heart; and you will find rest for your souls.  <span class="v">30</span>For my yoke is easy, and my burden is light.” </p>
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

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="https://orthocal.info/readings/gregorian/2025/05/03/">May  3, 2025</a></b></u>, and then again on <a class="next-next-proclamation" href="https://orthocal.info/readings/gregorian/2025/07/03/">July  3, 2025</a>.

