import querystring from 'querystring';
import _ from 'lodash';

export default function($scope, AdminService, RoutesService, LoadingSpinner) {
  $scope.selectedMonth = new Date();
  $scope.routes = [];

  function refresh() {
    if (!AdminService.getCompanyId()) return;

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

    $scope.companyId = options.transportCompanyId = AdminService.getCompanyId();

    // preprocess the routes to track all days...
    var numDays = (options.endDate - options.startDate)
        / (24 * 3600 * 1000)

    $scope.weekDays = _.range(0, numDays).map(day =>
      new Date($scope.selectedMonth.getFullYear(),
               $scope.selectedMonth.getMonth(),
               day + 1).getDay());
    $scope.today = Math.floor((Date.now() - options.startDate) / (24*60*60*1000))

    // We are also interested in the start/end dates. Hence we need to query
    // the report
    let reportPromise = AdminService.beeline({
      method: 'GET',
      url: '/routes/report?' + querystring.stringify(
        _.assign({},
          _.pick(options, 'startDate', 'endDate', 'transportCompanyId'),
          {perPage: 100, page: 1} // FIXME: but how?
        )
      )
    })

    let routesPromise = RoutesService.getRoutes(options);
    let augmentedRoutesPromise = Promise.all([
      routesPromise,
      reportPromise
    ]).then(([routes, report]) => {
      let routeDataById = _.keyBy(report.data.rows, 'id');

      for (let route of routes) {
        route.startDate = routeDataById[route.id].startDate;
        route.endDate = routeDataById[route.id].endDate;
      }
      return routes;
    })

    LoadingSpinner.watchPromise(routesPromise
    .then((routes) => {
      for (let route of routes) {
        route.tripsByDay = new Array(numDays)

        // Prioritize cancelled trips, so that
        // non-cancelled trips will overwrite cancelled trips
        var trips = _.sortBy(route.trips, t => [t.date, !t.isRunning])

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
      $scope.$digest();
    }))
  }

  $scope.$watch('selectedMonth', refresh)
}
