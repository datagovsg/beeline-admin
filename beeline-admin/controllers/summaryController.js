

export default function($scope, RoutesService, LoadingSpinner) {

  $scope.selectedMonth = new Date();
  $scope.routes = [];

  function refresh() {
    var options = {
      includeAvailability: true,
      includeTrips: true,
      startDate: new Date(
        $scope.selectedMonth.getFullYear(),
        $scope.selectedMonth.getMonth(),
        1
      ).getTime(),
      endDate: new Date(
        $scope.selectedMonth.getFullYear(),
        $scope.selectedMonth.getMonth() + 1,
        1
      ).getTime(),
    }

    LoadingSpinner.watchPromise(RoutesService.getRoutes(options)
    .then((routes) => {

      // preprocess the routes to track all days...
      var numDays = (options.endDate - options.startDate)
          / (24 * 3600 * 1000)

      console.log(routes)

      for (let route of routes) {
        route.tripsByDay = new Array(numDays)

        for (let trip of route.trips) {
          trip.date = new Date(trip.date)
          route.tripsByDay[trip.date.getUTCDate() - 1] = trip
        }
      }

      $scope.routes = routes;
    }))
  }

  $scope.$watch('selectedMonth', refresh)
}
