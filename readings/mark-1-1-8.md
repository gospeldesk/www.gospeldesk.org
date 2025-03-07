---
title: "Mark 1:1–8"
pk: "127"
permalink: "/readings/mark-1-1-8/"
noindex: true
---

<div class="reading">
<p><span class="v">1</span>The beginning of the Good News of Jesus Christ, the Son of God.  <span class="v">2</span>As it is written in the prophets, “Behold, I send my messenger before your face, who will prepare your way before you:  <span class="v">3</span>the voice of one crying in the wilderness, ‘Make ready the way of the Lord! Make his paths straight!’”  <span class="v">4</span>John came baptizing in the wilderness and preaching the baptism of repentance for forgiveness of sins.  <span class="v">5</span>All the country of Judea and all those of Jerusalem went out to him. They were baptized by him in the Jordan river, confessing their sins.  <span class="v">6</span>John was clothed with camel’s hair and a leather belt around his waist. He ate locusts and wild honey.  <span class="v">7</span>He preached, saying, “After me comes he who is mightier than I, the thong of whose sandals I am not worthy to stoop down and loosen.  <span class="v">8</span>I baptized you in water, but he will baptize you in the Holy Spirit.” </p>
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

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="https://orthocal.info/readings/gregorian/2026/01/04/">January  4, 2026</a></b></u>, and then again on <a class="next-next-proclamation" href="https://orthocal.info/readings/gregorian/2026/01/05/">January  5, 2026</a>.

