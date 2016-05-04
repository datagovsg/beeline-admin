export default function () {
  return {
    template: require('./ticketView.html'),
    scope: {
      data: '=',
      collapse: '='
    },
    link: function (scope, elem, attr) {
      scope.collapsed = true;
      scope.isObject = (o) => typeof(o) == 'object'
    }
  }
}
