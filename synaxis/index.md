---
title: "Synaxis of the Gospels"
---
<a href="/2024/toward-a-synaxis-of-the-gospels/synaxis-of-the-gospels.jpg"><img src="/2024/toward-a-synaxis-of-the-gospels/synaxis-of-the-gospels.640.jpg"></a>

<div class="helper">
    <a href="./composition.webp"><img src="./composition.webp"></a> &nbsp;
    <a href="./synaxis-of-the-gospels-with-key.jpg"><img src="./synaxis-of-the-gospels-with-key.jpg"></a>
</div>
<style>
    .helper {
        text-align: center;
    }
    .helper a {
        display: inline-block;
    }
    .helper img {
        height: 128px;
    }
</style>

<div class="clear"></div>

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
