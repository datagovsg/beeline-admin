
export default function() {
  var spinnerElem = document.createElement('DIV')
  spinnerElem.id = 'spinner-elem'

  window.document.body.appendChild(spinnerElem)

  function hide() {
    spinnerElem.style.display = 'none'
  }
  function show() {
    spinnerElem.style.display = 'block'
  }

  this.watchPromise = function(p) {
    show()

    p.then(hide, hide)
  }

  hide()
}
