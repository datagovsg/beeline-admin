export default function () {
  return {
    template: require('./objectView.html'),
    scope: {
      data: '='
    },
    link: function (scope, elem, attr) {
      scope.collapsed = true;
    }
  }
}
