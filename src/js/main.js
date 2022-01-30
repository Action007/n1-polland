var i = 5;
var list = document.querySelector("ul");
var add = document.querySelector('button');
add.addEventListener('click', function() {
  var itemsByTagName = document.getElementsByTagName("li");
  list.innerHTML += '<li>' + i++ + '</li>';
});