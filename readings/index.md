---
title: Gospel Readings
noindex: true
---

<ol>
{% assign sorted = site.readings | sort: "num" %}
{% for reading in sorted %}
  <li>
    <a href="./{{ reading.slug }}/">{{ reading.title }}</a>{% if reading.ref %}<span class="ref">{{ reading.ref }}</span>{% endif %}
  </li>
{% endfor %}
</ol>

<style>
  .ref {
    display: block;
    font-size: 10pt;
    text-decoration: none ! important;
    text-transform: uppercase;
    color: var(--gray);
  }
</style>
