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
var UNIT = 0;
var LEFT = 0;

function docMouseDown(e) {
  console.log('doc mouse down');
  deselectAll();
  var selector = document.createElement('div');
  selector.classList.add('selector');
  selector.style = 'position: absolute; border: 1px solid #777; background: #CCC; opacity: 0.3; width: 0; height: 0;';
  selector.style.top = e.pageY;
  selector.style.left = e.pageX;
  selector.dataset.rootY = e.pageY;
  selector.dataset.rootX = e.pageX;
  document.body.append(selector);
}

function docMouseMove(e) {
  hasMoved = true;
  var selector = document.getElementsByClassName('selector')[0];
  if (selector) {
    console.log('selecting');

    let rootY = Number(selector.dataset.rootY);
    let rootX = Number(selector.dataset.rootX);

    let rect = selector.getBoundingClientRect();
    let selectorTop = rect.top + window.scrollY;
    let selectorLeft = rect.left + window.scrollX;
    let selectorHeight = rect.height;
    let selectorWidth = rect.width;
    let selectorBottom = selectorTop + selectorHeight;
    let selectorRight = selectorLeft + selectorWidth;

    if (e.pageY > rootY) {
      selectorTop = rootY;
      selectorHeight = e.pageY - rootY;
    } else if (e.pageY < rootY) {
      selectorTop = e.pageY;
      selectorHeight = rootY - e.pageY;
    } else {
      selectorTop = rootY;
      selectorHeight = 0;
    }

    if (e.pageX > rootX) {
      selectorLeft = rootX;
      selectorWidth = e.pageX - rootX;
    } else if (e.pageX < rootX) {
      selectorLeft = e.pageX;
      selectorWidth = rootX - e.pageX;
    } else {
      selectorLeft = rootX;
      selectorWidth = 0;
    }

    selectorBottom = selectorTop + selectorHeight;
    selectorRight = selectorLeft + selectorWidth;

    selector.style.top = selectorTop;
    selector.style.left = selectorLeft;
    selector.style.height = selectorHeight;
    selector.style.width = selectorWidth;


    Array.from(document.getElementsByClassName('person')).forEach((person) => {
      var personBox = person.getBoundingClientRect();
      var personTop = window.scrollY + personBox.top;
      var personLeft = window.scrollX + personBox.left;
      var personBottom = personTop + personBox.height;
      var personRight = personLeft + personBox.width;
      if (  personBottom > selectorTop
         && personTop < selectorBottom
         && personLeft < selectorRight
         && personRight > selectorLeft
        ) {
        person.classList.add('selected');
        person.dataset.offsetY = e.clientY - personBox.top;
        person.dataset.offsetX = e.clientX - personBox.left;
      } else {
        person.classList.remove('selected');
      }
    });
  } else {
    console.log('doc mouse move');
    if (isMouseDown) {
      cls = 'selected';
    } else {
      cls = 'cut';
    }
    Array.from(document.getElementsByClassName(`person ${cls}`)).forEach((person) => {
      step = UNIT / 7;
      person.style.top = step * Math.round((e.pageY - Number(person.dataset.offsetY)) / step);
      person.style.left = LEFT + (step * Math.round((e.pageX - Number(person.dataset.offsetX)) / step));
      person.classList.add('placed');
    });
  }
}

function stopSelecting() {
  Array.from(document.getElementsByClassName('selector')).forEach((selector) => {
    selector.remove();
  });
}

function docMouseUp(e) {
  console.log('doc mouse up');
  stopSelecting();
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
    person.dataset.offsetX = e.clientX - rect.left;
    person.dataset.offsetY = e.clientY - rect.top;
  });
  Array.from(document.getElementsByClassName('person cut')).forEach((person) => {
    person.classList.remove('cut');
    person.classList.add('selected');
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
  stopSelecting();
}

function deselectAll() {
  Array.from(document.getElementsByClassName('person')).forEach((person) => {
    person.classList.remove('selected');
    person.classList.remove('cut');
  });
}

function docKeyDown(e) {
  if (event.key === 'Escape') {
    Array.from(document.getElementsByClassName('person selected')).forEach((person) => {
      person.classList.remove('selected');
    });
    Array.from(document.getElementsByClassName('person cut')).forEach((person) => {
      person.classList.remove('cut');
      person.classList.add ('selected');
    });
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
    person.classList.add('selected');
  });
}


// Draw

function draw(container) {
  var W = document.documentElement.clientWidth;
  var H = document.documentElement.clientHeight;
  var D = Math.min(W, H);
  UNIT = Math.floor(W / 18);
  LEFT = Math.floor((W - (UNIT * 18)) / 2);
  container.innerHTML = '';

  let rowNum = 0;
  let colNum = 0;

  window._data.forEach(function(person) {
    if (person.x === null) {
      return
    }
    rowNum = Math.max(rowNum, (person.y + person.scale + 1));
  });

  window._data.forEach(function(person) {
    var placed = true;
    if (person.x === null) {
      placed = false;
      person.x = colNum;
      person.y = rowNum;
      colNum += 2;
      if (colNum > 17) { rowNum += 2; colNum = 0}
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
    img.style.height = UNIT * person.scale;
    img.style.width = UNIT * person.scale;

    a.style.display = 'block';
    a.style.position = 'absolute';
    a.style.background = person.bg;
    a.style.cursor = 'grab';
    a.style.top = person.y * UNIT;
    a.style.left = LEFT + (person.x * UNIT);
    a.append(img);
    var label = document.createElement('span');
    label.innerHTML = `${person.slug}`;
    label.style = 'color: white; font: bold 10px/10px monospace; text-transform: uppercase; position: absolute; bottom: 2px; left: 4px';
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
  button.onmousedown = function(e) {
    e.stopPropagation(); // otherwise doc.mousedown swallows the click
  }
  button.onclick = function() {
    let content = 'slug,scale,x,y,bg\n';
    Array.from(document.getElementsByClassName('person')).forEach((el) => {
      var person = JSON.parse(el.dataset.blob);
      if (el.classList.contains('placed')) {
        content += `"${person.slug}",${person.scale},${person.x},${person.y},${person.bg}\n`;
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

