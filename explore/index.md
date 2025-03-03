---
title: Explore
noindex: true
---

Passages from the Gospels are read at services throughout the year. Visit
[Orthocal](https://orthocal.info/) to explore by date. Explore passage by
passage below.

<ol>
{% for reading in site.data.readings %}
  <li>
    <a href="./{{ reading.slug }}/">
      {{ reading.title }}
    </a> {% if reading.ref %}({{ reading.ref }}){% endif %}
  </li>
{% endfor %}
</ol>
