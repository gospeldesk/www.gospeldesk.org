---
title: "Sermon on the Mount: Adultery; Divorce"
pk: "14"
permalink: "/readings/sermon-on-the-mount-adultery-divorce/"
noindex: true
---

<div class="reading">
<p><span class="v">27</span>“You have heard that it was said, ‘You shall not commit adultery;’  <span class="v">28</span>but I tell you that everyone who gazes at a woman to lust after her has committed adultery with her already in his heart.  <span class="v">29</span>If your right eye causes you to stumble, pluck it out and throw it away from you. For it is more profitable for you that one of your members should perish, than for your whole body to be cast into Gehenna.  <span class="v">30</span>If your right hand causes you to stumble, cut it off, and throw it away from you. For it is more profitable for you that one of your members should perish, than for your whole body to be cast into Gehenna.  <span class="v">31</span>“It was also said, ‘Whoever shall put away his wife, let him give her a writing of divorce,’  <span class="v">32</span>but I tell you that whoever puts away his wife, except for the cause of sexual immorality, makes her an adulteress; and whoever marries her when she is put away commits adultery. </p>
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

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="https://orthocal.info/readings/gregorian/2025/06/12/">June 12, 2025</a></b></u>, and then again on <a class="next-next-proclamation" href="https://orthocal.info/readings/gregorian/2026/06/04/">June  4, 2026</a>.

