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
function radians_to_degrees(rad) {
  return (rad * 180) / Math.PI;
}
function polar_to_cartesian(person, unit) {
  return {
    x: person.r * unit * Math.cos(degrees_to_radians(person.t)),
    y: person.r * unit * Math.sin(degrees_to_radians(person.t)),
  }
}

function round(n, places) {
  var factor = 10**places;
  return Math.round((n * factor)) / factor;
}

function cartesian_to_polar(person, unit) {
  return {
    r: round(Math.sqrt((person.x * person.x) + (person.y * person.y)) / unit, 2),
    t: round(radians_to_degrees(Math.atan2(person.y, person.x)), 1)
  }
}


// DND

function toggleSelected(person) {
  if (person.classList.contains('selected')) {
    person.classList.remove('selected');
  } else {
  }
}

function click(e) {
  if (['HTML', 'BODY'].includes(e.target.tagName)) {
    Array.from(document.getElementsByClassName('person selected')).forEach((el) => {
      el.classList.remove('selected');
    });
  }
}

var isMouseDown = false;
var hasMoved = false;

function mousedown(e) {
	console.log('mousedown');
  isMouseDown = true;
  hasMoved = false;
  e.preventDefault();
  var person = e.target.closest('div');
  person.classList.add('selected');
  Array.from(document.getElementsByClassName('person selected')).forEach((person) => {
    var rect = person.getBoundingClientRect();
    person.dataset.offsetX = rect.left - e.pageX;
    person.dataset.offsetY = rect.top - e.pageY;
  });
}

function mousemove(e) {
  hasMoved = true;
  if (isMouseDown) {
    e.preventDefault();
    Array.from(document.getElementsByClassName('person selected')).forEach((person) => {
      person.style.top = e.pageY + Number(person.dataset.offsetY) + window.scrollY;
      person.style.left = e.pageX + Number(person.dataset.offsetX) + window.scrollX;
      person.classList.add('placed');
    });
  }
}

function mouseup(e) {
  isMouseDown = false;
  e.preventDefault();
}

function deselectAll() {
	Array.from(document.getElementsByClassName('person selected')).forEach((person) => {
		person.classList.remove('selected');
	});
}

function keydown(e) {
  if (event.key === 'Escape') {
		deselectAll();
  }
}


// Draw

function draw(container) {
  var W = document.documentElement.clientWidth;
  var H = document.documentElement.clientHeight;
  var D = Math.min(W, H);
  var centerX = W / 2;
  var centerY = H / 2;
  var unit = W / 12;
  var halfUnit = unit / 2;
  container.innerHTML = '';

  let rowNum = 1;
  let colNum = 1;
  let paddedUnit = unit * 1.5;

  window._data.forEach(function(person) {
    var placed = true;
    if (person.r === null) {
      placed = false;
      console.log('placing', person.slug);
      polar = cartesian_to_polar({
        x: (colNum * paddedUnit) - centerX,
        y: paddedUnit + (rowNum * paddedUnit)
      }, unit);
      person.r = polar.r;
      person.t = polar.t;
      if (colNum++ > 6) { rowNum++; colNum = 1}
    }
    if (person.bg === '') {
      person.bg = '#AAA';
    }
    var a = document.createElement('div');
    a.classList.add('person');
    a.id = person.slug;
    a.dataset.blob = JSON.stringify(person);
    a.href = `/characters/${person.slug}/`;

    var img = document.createElement('img');
    img.src = "person.svg"
    img.style.height = unit * person.scale;
    img.style.width = unit * person.scale;

    a.style.display = 'block';
    a.style.position = 'absolute';
    a.style.background = person.bg;
    a.style.cursor = 'grab';
    var coords = polar_to_cartesian(person, unit);
    a.style.top = centerY + coords.y - (halfUnit * person.scale);
    a.style.left = centerX + coords.x - (halfUnit * person.scale);
    a.append(img);
    var label = document.createElement('span');
    label.innerHTML = `${person.slug}`;
    label.style = 'color: white; font: bold 12px/12px monospace; text-transform: uppercase; position: absolute; bottom: 2px; left: 4px';
    a.append(label);
    a.addEventListener('mousedown', mousedown);
    a.addEventListener('mouseup', mouseup);
    if (placed) a.classList.add('placed');
    container.append(a);
  });

  button = document.createElement('button');
  button.innerHTML = "Save";
  button.style.position = 'fixed';
  button.style.top = '10px';
  button.style.left= '10px';
  button.onclick = function() {
    var rect = document.getElementById('jesus').getBoundingClientRect();
    X = rect.left + ((rect.right - rect.left) / 2);
    Y = rect.top + ((rect.bottom - rect.top) / 2);
    function relpos(el) {
      var rect = el.getBoundingClientRect();
      x = rect.left + ((rect.right - rect.left) / 2);
      y = rect.top + ((rect.bottom - rect.top) / 2);
      return {x: x - X, y: y - Y};
    }

    let content = 'slug,scale,r,t,bg\n';
    Array.from(document.getElementsByClassName('person')).forEach((el) => {
      var person = JSON.parse(el.dataset.blob);
      var coords = cartesian_to_polar(relpos(el), unit);
      if (coords.r !== person.r || coords.t !== person.t) {
        console.log(person, coords);
      }
      if (el.classList.contains('placed')) {
        content += `"${person.slug}",${person.scale},${coords.r},${coords.t},\n`;
      } else {
        content += `"${person.slug}",1,,,\n`;
      }
    });
    download('synaxis.csv', content);
  }
  container.append(button);
};

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  document.body.style.overflow = 'auto';
  element.click();
  document.body.removeChild(element);
}

window.onload = function() {
  var body = document.getElementsByTagName('body')[0];
  getJSON('synaxis.json', function(data) {
    window._data = data;
    body.addEventListener('mousemove', mousemove);
    document.addEventListener('click', click);
    document.addEventListener('mouseup', mouseup);
    draw(body);
    window.addEventListener('resize', function() { draw(body) });
		document.addEventListener('keydown', keydown);
  });
};

