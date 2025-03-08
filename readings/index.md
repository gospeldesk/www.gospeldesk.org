---
title: Gospel Readings
noindex: true
---

<ol>
{% assign sorted = site.readings | sort: "num" %}
{% for reading in sorted %}
  <li>
    <a href="{{ reading.url }}">{{ reading.title }}</a>{% if reading.ref %}<span class="ref">{{ reading.ref }}</span>{% endif %}
  </li>
{% endfor %}
</ol>
