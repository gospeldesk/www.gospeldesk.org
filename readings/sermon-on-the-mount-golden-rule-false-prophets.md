---
title: "Sermon on the Mount: Golden Rule; False Prophets"
pk: "22"
permalink: "/readings/sermon-on-the-mount-golden-rule-false-prophets/"
noindex: true
---

<div class="reading">
<p><span class="v">12</span>Therefore whatever you desire for men to do to you, you shall also do to them; for this is the law and the prophets.  <span class="v">13</span>“Enter in by the narrow gate; for wide is the gate and broad is the way that leads to destruction, and many are those who enter in by it.  <span class="v">14</span>How narrow is the gate, and restricted is the way that leads to life! Few are those who find it.  <span class="v">15</span>“Beware of false prophets, who come to you in sheep’s clothing, but inwardly are ravening wolves.  <span class="v">16</span>By their fruits you will know them. Do you gather grapes from thorns, or figs from thistles?  <span class="v">17</span>Even so, every good tree produces good fruit; but the corrupt tree produces evil fruit.  <span class="v">18</span>A good tree can’t produce evil fruit, neither can a corrupt tree produce good fruit.  <span class="v">19</span>Every tree that doesn’t grow good fruit is cut down, and thrown into the fire.  <span class="v">20</span>Therefore by their fruits you will know them.  <span class="v">21</span>Not everyone who says to me, ‘Lord, Lord,’ will enter into the Kingdom of Heaven; but he who does the will of my Father who is in heaven.  <span class="v">22</span>Many will tell me in that day, ‘Lord, Lord, didn’t we prophesy in your name, in your name cast out demons, and in your name do many mighty works?’  <span class="v">23</span>Then I will tell them, ‘I never knew you. Depart from me, you who work iniquity.’ </p>
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


