
export default function() {
  var spinnerElem = document.createElement('DIV')
  var count = 0;
  spinnerElem.id = 'spinner-elem'

  window.document.body.appendChild(spinnerElem)

  function hide() {
    count = Math.max(0, count - 1);
    if (count == 0) {
      spinnerElem.style.display = 'none'
    }
  }
  function show() {
    count = count + 1;
    if (count != 0) {
      spinnerElem.style.display = 'block'
    }
  }

  this.watchPromise = function(p) {
    show()

    p.then(hide, hide);
    
    return p;
  }

  hide()
}
