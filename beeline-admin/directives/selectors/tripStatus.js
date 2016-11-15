
export default function($http, companiesSvc) {
  return {
    template: `
<select ng-options="status[0] as status[1] for status in statuses" ng-model="selectedStatus">
</select>
    `,
    replace: true,
    link(scope, elem, attr) {
      scope.statuses = [
        [null, 'Normal'],
        ['cancelled', 'Cancelled due to Emergency'],
        ['void', 'Void']
      ];
	  scope.selectedStatus = scope.statuses[0][0];
    },
  }
}
