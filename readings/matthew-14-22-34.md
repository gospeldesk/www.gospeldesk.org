---
title: "Matthew 14:22–34"
pk: "64"
permalink: "/readings/matthew-14-22-34/"
noindex: true
---

<div class="reading">
<p><span class="v">22</span>Immediately Jesus made the disciples get into the boat, and to go ahead of him to the other side, while he sent the multitudes away.  <span class="v">23</span>After he had sent the multitudes away, he went up into the mountain by himself to pray. When evening had come, he was there alone.  <span class="v">24</span>But the boat was now in the middle of the sea, distressed by the waves, for the wind was contrary.  <span class="v">25</span>In the fourth watch of the night, Jesus came to them, walking on the sea.  <span class="v">26</span>When the disciples saw him walking on the sea, they were troubled, saying, “It’s a ghost!” and they cried out for fear.  <span class="v">27</span>But immediately Jesus spoke to them, saying, “Cheer up! It is I! Don’t be afraid.”  <span class="v">28</span>Peter answered him and said, “Lord, if it is you, command me to come to you on the waters.”  <span class="v">29</span>He said, “Come!” Peter stepped down from the boat, and walked on the waters to come to Jesus.  <span class="v">30</span>But when he saw that the wind was strong, he was afraid, and beginning to sink, he cried out, saying, “Lord, save me!”  <span class="v">31</span>Immediately Jesus stretched out his hand, took hold of him, and said to him, “You of little faith, why did you doubt?”  <span class="v">32</span>When they got up into the boat, the wind ceased.  <span class="v">33</span>Those who were in the boat came and worshiped him, saying, “You are truly the Son of God!”  <span class="v">34</span>When they had crossed over, they came to the land of Gennesaret. </p>
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

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="https://orthocal.info/readings/gregorian/2025/08/10/">August 10, 2025</a></b></u>, and then again on <a class="next-next-proclamation" href="https://orthocal.info/readings/gregorian/2026/08/02/">August  2, 2026</a>.

