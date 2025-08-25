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

window.onload = function() {
  getJSON('synaxis.json', function(data) {
    var W = document.documentElement.clientWidth;
    var H = document.documentElement.clientHeight;
    var D = Math.min(W, H);
    var centerX = W / 2;
    var centerY = H / 2;
    data.forEach(function(person) {
      var a = document.createElement('a');
      a.href = `/characters/${person.slug}/`;
      var img = document.createElement('img');
      img.src = "person.svg"
      img.style.top = centerY + person.y;
      img.style.left = centerX + person.x;
      a.append(img);
      document.getElementsByTagName('body')[0].append(a);
    });
  });
};
