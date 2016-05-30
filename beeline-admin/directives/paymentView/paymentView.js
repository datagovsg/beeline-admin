export default function () {
  return {
    template: require('./paymentView.html'),
    scope: {
      pvData: '=',
      pvTitle: '=',
      collapsed: '<?'
    },
    link: function (scope, elem, attr) {
      if (scope.collapsed == undefined)
        scope.collapsed = true;
      scope.isObject = (o) => typeof(o) == 'object'
    }
  }
}
