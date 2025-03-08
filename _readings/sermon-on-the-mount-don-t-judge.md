---
title: "Sermon on the Mount: Don't Judge"
pk: "21"
permalink: "/readings/sermon-on-the-mount-don-t-judge/"
noindex: true
---

<div class="reading">
<p><span class="v">1</span>“Don’t judge, so that you won’t be judged.  <span class="v">2</span>For with whatever judgment you judge, you will be judged; and with whatever measure you measure, it will be measured to you.  <span class="v">3</span>Why do you see the speck that is in your brother’s eye, but don’t consider the beam that is in your own eye?  <span class="v">4</span>Or how will you tell your brother, ‘Let me remove the speck from your eye;’ and behold, the beam is in your own eye?  <span class="v">5</span>You hypocrite! First remove the beam out of your own eye, and then you can see clearly to remove the speck out of your brother’s eye.  <span class="v">6</span>“Don’t give that which is holy to the dogs, neither throw your pearls before the pigs, lest perhaps they trample them under their feet, and turn and tear you to pieces.  <span class="v">7</span>“Ask, and it will be given you. Seek, and you will find. Knock, and it will be opened for you.  <span class="v">8</span>For everyone who asks receives. He who seeks finds. To him who knocks it will be opened. </p>
</div>
{% if page.direct or page.indirect %}
### In This Passage
{% endif %}

{% if page.direct %}
{% if page.indirect %}
#### Directly
{% endif %}
<ol>
{% for slug in page.direct %}
  {% assign person =  site.characters | where:"slug", slug | first %}
  <li>{% if person != nil %}<a href="{{person.id}}">{{ person.name }}</a>{% else %}MISSING: {{ slug }}{% endif %}</li>
{% endfor %}
</ol>
{% endif %}

{% if page.indirect %}
{% if page.direct %}
#### Indirectly
{% endif %}
<ol>
{% for slug in page.indirect %}
  {% assign person =  site.characters | where:"slug", slug | first %}
  <li>{% if person != nil %}<a href="{{person.id}}">{{ person.name }}</a>{% else %}MISSING: {{ slug }}{% endif %}</li>
{% endfor %}
</ol>
{% endif %}


### Upcoming Proclamations

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="https://orthocal.info/readings/gregorian/2025/06/21/">June 21, 2025</a></b></u>, and then again on <a class="next-next-proclamation" href="https://orthocal.info/readings/gregorian/2026/06/13/">June 13, 2026</a>.

