---
title: "Matthew 27:55–61"
pk: ""
permalink: "/readings/matthew-27-55-61/"
noindex: true
---

<div class="reading">
<p><span class="v">55</span>Many women were there watching from afar, who had followed Jesus from Galilee, serving him.  <span class="v">56</span>Among them were Mary Magdalene, Mary the mother of James and Joses, and the mother of the sons of Zebedee.  <span class="v">57</span>When evening had come, a rich man from Arimathaea, named Joseph, who himself was also Jesus’ disciple came.  <span class="v">58</span>This man went to Pilate, and asked for Jesus’ body. Then Pilate commanded the body to be given up.  <span class="v">59</span>Joseph took the body, and wrapped it in a clean linen cloth,  <span class="v">60</span>and laid it in his own new tomb, which he had cut out in the rock, and he rolled a great stone against the door of the tomb, and departed.  <span class="v">61</span>Mary Magdalene was there, and the other Mary, sitting opposite the tomb. </p>
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


