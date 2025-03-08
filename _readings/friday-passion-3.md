---
title: "Friday Passion 3"
pk: "118"
permalink: "/readings/friday-passion-3/"
noindex: true
---

<div class="reading">
<p><span class="v">57</span>Those who had taken Jesus led him away to Caiaphas the high priest, where the scribes and the elders were gathered together.  <span class="v">58</span>But Peter followed him from a distance, to the court of the high priest, and entered in and sat with the officers, to see the end.  <span class="v">59</span>Now the chief priests, the elders, and the whole council sought false testimony against Jesus, that they might put him to death;  <span class="v">60</span>and they found none. Even though many false witnesses came forward, they found none. But at last two false witnesses came forward,  <span class="v">61</span>and said, “This man said, ‘I am able to destroy the temple of God, and to build it in three days.’”  <span class="v">62</span>The high priest stood up, and said to him, “Have you no answer? What is this that these testify against you?”  <span class="v">63</span>But Jesus held his peace. The high priest answered him, “I adjure you by the living God, that you tell us whether you are the Christ, the Son of God.”  <span class="v">64</span>Jesus said to him, “You have said it. Nevertheless, I tell you, after this you will see the Son of Man sitting at the right hand of Power, and coming on the clouds of the sky.”  <span class="v">65</span>Then the high priest tore his clothing, saying, “He has spoken blasphemy! Why do we need any more witnesses? Behold, now you have heard his blasphemy.  <span class="v">66</span>What do you think?” They answered, “He is worthy of death!”  <span class="v">67</span>Then they spat in his face and beat him with their fists, and some slapped him,  <span class="v">68</span>saying, “Prophesy to us, you Christ! Who hit you?”  <span class="v">69</span>Now Peter was sitting outside in the court, and a maid came to him, saying, “You were also with Jesus, the Galilean!”  <span class="v">70</span>But he denied it before them all, saying, “I don’t know what you are talking about.”  <span class="v">71</span>When he had gone out onto the porch, someone else saw him, and said to those who were there, “This man also was with Jesus of Nazareth.”  <span class="v">72</span>Again he denied it with an oath, “I don’t know the man.”  <span class="v">73</span>After a little while those who stood by came and said to Peter, “Surely you are also one of them, for your speech makes you known.”  <span class="v">74</span>Then he began to curse and to swear, “I don’t know the man!” Immediately the rooster crowed.  <span class="v">75</span>Peter remembered the word which Jesus had said to him, “Before the rooster crows, you will deny me three times.” He went out and wept bitterly. </p>
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

God willing, the Church will proclaim this Gospel on <u><b><a class="next-proclamation" href="https://orthocal.info/readings/gregorian/2025/04/18/">April 18, 2025</a></b></u>, and then again on <a class="next-next-proclamation" href="https://orthocal.info/readings/gregorian/2026/04/10/">April 10, 2026</a>.

