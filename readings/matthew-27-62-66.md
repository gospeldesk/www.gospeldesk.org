---
title: "Matthew 27:62–66"
pk: ""
permalink: "/readings/matthew-27-62-66/"
noindex: true
---

<div class="reading">
<p><span class="v">62</span>Now on the next day, which was the day after the Preparation Day, the chief priests and the Pharisees were gathered together to Pilate,  <span class="v">63</span>saying, “Sir, we remember what that deceiver said while he was still alive: ‘After three days I will rise again.’  <span class="v">64</span>Command therefore that the tomb be made secure until the third day, lest perhaps his disciples come at night and steal him away, and tell the people, ‘He is risen from the dead;’ and the last deception will be worse than the first.”  <span class="v">65</span>Pilate said to them, “You have a guard. Go, make it as secure as you can.”  <span class="v">66</span>So they went with the guard and made the tomb secure, sealing the stone. </p>
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


