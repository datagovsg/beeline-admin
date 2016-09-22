

export default function (StopsPopup) {

  return {
    template: `
    <button ng-click="showPopup()">
      <ng-transclude></ng-transclude>
    </button>
    `,
    scope: {
      ngModel: '='
    },
    transclude: true,
    replace: true,
    link(scope, elem, attr) {
      scope.showPopup = function () {
        StopsPopup.show({
          title: 'Pin the stop location on the map'
        })
        .then((x) => {
          scope.ngModel = x.id;
        })
      }
    }
  }

}
