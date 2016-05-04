export default function () {
  return {
    template: require('./paymentView.html'),
    scope: {
      pvData: '=',
      pvTitle: '=',
      collapse: '='
    },
    link: function (scope, elem, attr) {
      scope.collapsed = true;
      scope.isObject = (o) => typeof(o) == 'object'
    }
  }
}
