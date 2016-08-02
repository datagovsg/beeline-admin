

export default function($scope, AdminService, RoutesService, LoadingSpinner) {

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

    if (!AdminService.isSuperAdmin()) {
      options.transportCompanyId = AdminService.getCompanyId();
    }

    // preprocess the routes to track all days...
    var numDays = (options.endDate - options.startDate)
        / (24 * 3600 * 1000)

    $scope.weekDays = _.range(0, numDays).map(day =>
      new Date($scope.selectedMonth.getFullYear(),
               $scope.selectedMonth.getMonth(),
               day + 1).getDay());
    $scope.today = Math.floor((Date.now() - options.startDate) / (24*60*60*1000))

    LoadingSpinner.watchPromise(RoutesService.getRoutes(options)
    .then((routes) => {
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
