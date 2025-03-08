---
title: "Wednesday Presanctified"
pk: "117"
permalink: "/readings/wednesday-presanctified/"
noindex: true
---

<div class="reading">
<p><span class="v">6</span>Now when Jesus was in Bethany, in the house of Simon the leper,  <span class="v">7</span>a woman came to him having an alabaster jar of very expensive ointment, and she poured it on his head as he sat at the table.  <span class="v">8</span>But when his disciples saw this, they were indignant, saying, “Why this waste?  <span class="v">9</span>For this ointment might have been sold for much, and given to the poor.”  <span class="v">10</span>However, knowing this, Jesus said to them, “Why do you trouble the woman? She has done a good work for me.  <span class="v">11</span>For you always have the poor with you; but you don’t always have me.  <span class="v">12</span>For in pouring this ointment on my body, she did it to prepare me for burial.  <span class="v">13</span>Most certainly I tell you, wherever this Good News is preached in the whole world, what this woman has done will also be spoken of as a memorial of her.”  <span class="v">14</span>Then one of the twelve, who was called Judas Iscariot, went to the chief priests,  <span class="v">15</span>and said, “What are you willing to give me, that I should deliver him to you?” They weighed out for him thirty pieces of silver.  <span class="v">16</span>From that time he sought opportunity to betray him. </p>
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

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="https://orthocal.info/readings/gregorian/2025/04/16/">April 16, 2025</a></b></u>, and then again on <a class="next-next-proclamation" href="https://orthocal.info/readings/gregorian/2026/04/08/">April  8, 2026</a>.

