---
layout: default
title: Gospel Readings
noindex: true
---
{% assign sorted = site.readings | sort: "num" %}
<header>
  <h2>{{ page.title }}</h2>
    <div class="meta">
    According to the <a href="https://www.oca.org/readings">usage</a> of the <a href="https://www.oca.org/">Orthodox Church in America</a>.
    </div>
</header>
{% include readings-list.html readings=sorted %}

{% assign first_reading = sorted | first %}
{% assign last_reading = sorted | last %}
<script>
  document.addEventListener('keydown', function(e) {
    if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
      return; // no-op
    } else {
      if (e.key === 'l') {
        window.location.href = '{{ first_reading.url }}';
      }
      if (e.key === 'h') {
        window.location.href = '{{ last_reading.url }}';
      }
    }
  });
</script>
