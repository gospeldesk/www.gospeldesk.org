---
title: "Sermon on the Mount: Don't Be Anxious"
pk: "20"
permalink: "/readings/sermon-on-the-mount-don-t-be-anxious/"
noindex: true
---

<div class="reading">
<p><span class="v">31</span>“Therefore don’t be anxious, saying, ‘What will we eat?’, ‘What will we drink?’ or, ‘With what will we be clothed?’  <span class="v">32</span>For the Gentiles seek after all these things; for your heavenly Father knows that you need all these things.  <span class="v">33</span>But seek first God’s Kingdom, and his righteousness; and all these things will be given to you as well.  <span class="v">34</span>Therefore don’t be anxious for tomorrow, for tomorrow will be anxious for itself. Each day’s own evil is sufficient.  <span class="v">9</span>Or who is there among you, who, if his son asks him for bread, will give him a stone?  <span class="v">10</span>Or if he asks for a fish, who will give him a serpent?  <span class="v">11</span>If you then, being evil, know how to give good gifts to your children, how much more will your Father who is in heaven give good things to those who ask him! </p>
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

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="https://orthocal.info/readings/gregorian/2025/06/16/">June 16, 2025</a></b></u>, and then again on <a class="next-next-proclamation" href="https://orthocal.info/readings/gregorian/2026/06/08/">June  8, 2026</a>.

