import assert from 'assert';

export default ['AdminService', function(AdminService) {
  return {
    scope: {
      tripId: '<',
      trip: '=',
    },
    replace: true,
    link(scope, elem, attr) {
      scope.$watch('tripId', (tripId) => {
        if (!tripId) {
          scope.trip = null;
          return;
        }
        AdminService.beeline({
          url: `/trips/${tripId}`
        })
        .then((response) => {
          scope.trip = response.data;
        })
      })
    }
  }
}]
