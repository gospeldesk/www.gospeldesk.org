---
layout: default
title: Gospel Readings
noindex: true
---
<header>
  <h2>{{ page.title }}</h2>
    <div class="meta">
    According to the <a href="https://www.oca.org/readings">usage</a> of the <a href="https://www.oca.org/">Orthodox Church in America</a>.
    </div>
</header>
<section class="readings">
  <ol>
  {% assign sorted = site.readings | sort: "num" %}
  {% for reading in sorted %}
    <li>
      <a href="{{ reading.url }}">{{ reading.title }}{% if reading.subtitle %}<br><span class="subtitle">{{ reading.subtitle }}</span>{% endif %}</a>{% if reading.ref %}<span class="ref">{{ reading.ref }}</span>{% endif %}
    </li>
  {% endfor %}
  </ol>
</section>
