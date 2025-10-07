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

function draw() {
  var W = document.documentElement.clientWidth;
  var H = document.documentElement.clientHeight;
  var D = Math.min(W, H);
  var centerX = W / 2;
  var centerY = H / 2;
  var unit = W / 10;
  var halfUnit = unit / 2;
  var body = document.getElementsByTagName('body')[0];
  body.innerHTML = '';
  window._data.forEach(function(person) {
    var a = document.createElement('a');
    a.href = `/characters/${person.slug}/`;
    var img = document.createElement('img');
    img.src = "person.svg"
    img.style.position = "absolute";
    img.style.background = person.bg;
    img.style.height = unit;
    img.style.width = unit;
    var coords = polar_to_cartesian(person, unit);
    img.style.top = centerY + coords.y - halfUnit;
    img.style.left = centerX + coords.x - halfUnit;
    a.append(img);
    body.append(a);
  });
};


window.onload = function() {
  getJSON('synaxis.json', function(data) {
    window._data = data;
    draw();
  });
};

window.addEventListener('resize', draw);
