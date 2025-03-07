---
title: "Matthew 27:27–32"
pk: "122"
permalink: "/readings/matthew-27-27-32/"
noindex: true
---

<div class="reading">
<p><span class="v">27</span>Then the governor’s soldiers took Jesus into the Praetorium, and gathered the whole garrison together against him.  <span class="v">28</span>They stripped him, and put a scarlet robe on him.  <span class="v">29</span>They braided a crown of thorns and put it on his head, and a reed in his right hand; and they kneeled down before him, and mocked him, saying, “Hail, King of the Jews!”  <span class="v">30</span>They spat on him, and took the reed and struck him on the head.  <span class="v">31</span>When they had mocked him, they took the robe off him, and put his clothes on him, and led him away to crucify him.  <span class="v">32</span>As they came out, they found a man of Cyrene, Simon by name, and they compelled him to go with them, that he might carry his cross. </p>
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


