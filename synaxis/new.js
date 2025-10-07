function getJSON(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    if (xhr.status == 200) {
      var data = JSON.parse(xhr.responseText);
      callback(data)
    } else {
      console.log(xhr.responseText);
    }
  };
  xhr.open('GET', url);
  xhr.send();
}

function degrees_to_radians(deg) {
  return deg * (Math.PI / 180);
}
function polar_to_cartesian(person, unit) {
  return {
    x: person.r * unit * Math.cos(degrees_to_radians(person.t)),
    y: person.r * unit * Math.sin(degrees_to_radians(person.t)),
  }
}


// DND

let activeItem, offsetX, offsetY;

function dragStart(e) {
	e.preventDefault();
	activeItem = e.target.closest('div');
  var rect = activeItem.getBoundingClientRect();
  offsetX = rect.left - e.pageX;
  offsetY = rect.top - e.pageY;
}

function drag(e) {
  if (activeItem) {
    e.preventDefault();
    activeItem.style.top = e.pageY + offsetY;
    activeItem.style.left = e.pageX + offsetX;
  }
}

function dragEnd(e) {
  e.preventDefault();
  activeItem = null;
}


// Draw

function draw(container) {
  var W = document.documentElement.clientWidth;
  var H = document.documentElement.clientHeight;
  var D = Math.min(W, H);
  var centerX = W / 2;
  var centerY = H / 2;
  var unit = Math.min(W / 15, H / 21) / 1.5;
  var halfUnit = unit / 2;
  container.innerHTML = '';

  let i = 1;
  let j = 1;

  window._data.forEach(function(person) {
    if (person.r === null) {
      person.r = 1 * j;
      if (i++ > 12) {
        j++;
        i = 1
      };
      person.t = (13 - i) * (180 / 12);
      console.log(i, person.t);
      person.bg = 'pink';
    }
    var a = document.createElement('div');
    a.href = `/characters/${person.slug}/`;

    var img = document.createElement('img');
    img.src = "person.svg"
    img.style.height = unit * person.scale;
    img.style.width = unit * person.scale;

    a.style.display = 'block';
    a.style.position = 'absolute';
    a.style.background = person.bg;
    var coords = polar_to_cartesian(person, unit);
    a.style.top = centerY + coords.y - (halfUnit * person.scale);
    a.style.left = centerX + coords.x - (halfUnit * person.scale);
    a.append(img);
    var label = document.createElement('span');
    label.innerHTML = `${person.slug}`;
    label.style = 'color: white; font: bold 8px/8px monospace; text-transform: uppercase; position: absolute; bottom: 2px; left: 4px';
    a.append(label);
  	a.addEventListener('mousedown', dragStart);
    container.append(a);
  });
};


window.onload = function() {
  getJSON('synaxis.json', function(data) {
    window._data = data;
    var body = document.getElementsByTagName('body')[0];
    body.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    draw(body);
  });
};

window.addEventListener('resize', draw);
