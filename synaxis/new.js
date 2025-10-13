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

/*

doc
  down
  move
  up

item
  down
  up

*/

function toggleSelected(person) {
  if (person.classList.contains('selected')) {
    person.classList.remove('selected');
  } else {
  }
}

var isMouseDown = false;
var hasMoved = false;

function docMouseDown(e) {
  console.log('doc mouse down');
  deselectAll();
}

function docMouseMove(e) {
  console.log('doc mouse move');
  hasMoved = true;
  if (isMouseDown) {
    cls = 'selected';
  } else {
    cls = 'cut';
  }
  Array.from(document.getElementsByClassName(`person ${cls}`)).forEach((person) => {
    person.style.top = e.pageY + Number(person.dataset.offsetY) + window.scrollY;
    person.style.left = e.pageX + Number(person.dataset.offsetX) + window.scrollX;
    person.classList.add('placed');
  });
}

function docMouseUp(e) {
  console.log('doc mouse up');
}


function itemMouseDown(e) {
  console.log('item mouse down');
  e.preventDefault();
  e.stopPropagation();
  isMouseDown = true;
  hasMoved = false;
  var person = e.target.closest('div');
  person.classList.add('selected');
  Array.from(document.getElementsByClassName('person selected')).forEach((person) => {
    var rect = person.getBoundingClientRect();
    person.dataset.offsetX = rect.left - e.pageX;
    person.dataset.offsetY = rect.top - e.pageY;
  });
}

function itemMouseUp(e) {
  console.log('item mouse up');
  e.preventDefault();
  e.stopPropagation();
  isMouseDown = false;
  var selection = Array.from(document.getElementsByClassName('person selected'));
  if (hasMoved && selection.length === 1) {
    selection[0].classList.remove('selected');
  }
}

function deselectAll() {
  Array.from(document.getElementsByClassName('person')).forEach((person) => {
    person.classList.remove('selected');
    person.classList.remove('cut');
  });
}

function docKeyDown(e) {
  if (event.key === 'Escape') {
    deselectAll();
  }
}

function docCut(e) {
  console.log('doc cut');
  Array.from(document.getElementsByClassName('person selected')).forEach((person) => {
    person.classList.remove('selected');
    person.classList.add('cut');
  });
}

function docPaste(e) {
  console.log('doc paste');
  Array.from(document.getElementsByClassName('person cut')).forEach((person) => {
    person.classList.remove('cut');
  });
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
  let topOffset = 0;

  window._data.forEach(function(person) {
    if (person.r === null) {
      return
    }
    var coords = polar_to_cartesian(person, unit);
    topOffset = Math.max(topOffset, coords.y - (halfUnit * person.scale));
  });

  window._data.forEach(function(person) {
    var placed = true;
    if (person.r === null) {
      placed = false;
      polar = cartesian_to_polar({
        x: (colNum * paddedUnit) - centerX,
        y: topOffset + halfUnit + (rowNum * paddedUnit)
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
    a.addEventListener('mousedown', itemMouseDown);
    a.addEventListener('mouseup', itemMouseUp);
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
        content += `"${person.slug}",${person.scale},${coords.r},${coords.t},${person.bg}\n`;
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
    document.addEventListener('mousedown', docMouseDown);
    document.addEventListener('mousemove', docMouseMove);
    document.addEventListener('mouseup', docMouseUp);

    draw(body);
    window.addEventListener('resize', function() { draw(body) });
    document.addEventListener('keydown', docKeyDown);
    document.addEventListener('cut', docCut);
    document.addEventListener('paste', docPaste);
  });
};

