

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

    if (!AdminService.isSuperAdmin() || AdminService.getCompanyId()) {
      options.transportCompanyId = AdminService.getCompanyId();
      $scope.companyId = options.transportCompanyId;
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

        // Prioritize cancelled trips, so that
        // non-cancelled trips will overwrite cancelled trips
        var trips = _.sortBy(route.trips, t => [t.date, t.status !== 'cancelled'])

        for (let trip of trips) {
          trip.date = new Date(trip.date)
          route.tripsByDay[trip.date.getUTCDate() - 1] = trip
        }

        let lastPrice, lastCapacity;
        route.priceSummary = _.reduce(
          route.tripsByDay,
          (acc, value, index, coll) => {
            if (acc.length == 0 ||
                (value !== undefined &&
                  ( acc[acc.length - 1].price !== value.price ||
                    acc[acc.length - 1].capacity !== value.capacity))) {

              acc.push({
                price: value.price,
                capacity: value.capacity,
                count: 1
              })
            }
            else {
              acc[acc.length - 1].count++;
            }
            return acc;
          },
          [{price: undefined, capacity: undefined, count: 0}])
          .filter(s => s.count)
      }

      $scope.routes = routes;
    }))
  }

  $scope.$watch(() => AdminService.getCompanyId(), refresh)
  $scope.$watch('selectedMonth', refresh)
}
