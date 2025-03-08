---
title: Gospel Readings
noindex: true
---

<p>According to the <a href="https://www.oca.org/readings">usage</a> of the <a href="https://www.oca.org/">Orthodox Church in America</a>.</p>

<ol>
{% assign sorted = site.readings | sort: "num" %}
{% for reading in sorted %}
  <li>
    <a href="{{ reading.url }}">{{ reading.title }}</a>{% if reading.ref %}<span class="ref">{{ reading.ref }}</span>{% endif %}
  </li>
{% endfor %}
</ol>
