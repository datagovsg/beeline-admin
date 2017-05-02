const _ = require('lodash');
const assert = require('assert');
const leftPad = require('left-pad');
const querystring = require('querystring');

angular.module('beeline-admin').directive('crowdstartEditor', function () {
  return {
    template: require('./crowdstartEditor.html'),
    scope: {
      route: '='
    },
    controller($scope, TripsService, AdminService, commonModals) {
      $scope.disp = {};
      $scope.$watch('route', (r) => {
        if (!r || !r.id) return

        const route = _.cloneDeep(r);

        // Prepare the metadata...
        route.notes = route.notes || {};
        route._meta = {
          campaignEndDate: new Date(route.notes.lelongExpiry),
          // firstTripDate: new Date(route.trips[0].date)
        };
        route.notes.tier = route.notes.tier || [{price: 10, pax: 13}]

        $scope.editRoute = route
        $scope.bids = null;

        // Asynchronously find the first trip date
        TripsService.getTrips({
          routeId: route.id,
          startDate: new Date(route._meta.campaignEndDate.getTime() - 180*24*60*60*1000),
          endDate: new Date(route._meta.campaignEndDate.getTime() + 365*24*60*60*1000),
        })
        .then((trips) => {
          route.trips = trips;
          route._meta.firstTripDate = trips[0].date
        })

        // Asynchronously find the bids
        AdminService.beeline({
          url: `/custom/lelong/routes/${route.id}/bids?` + querystring.stringify({
            statuses: JSON.stringify(['bidded', 'void', 'failed']),
          })
        })
        .then((response) => {
          $scope.bids = response.data;
        });

      })
      $scope.removeTier = function (index) {
        $scope.editRoute.notes.tier.splice(index, 1)
      }
      $scope.addTier = function () {
        $scope.editRoute.notes.tier.push({price: 10, pax: 13})
      }

      $scope.save = function () {
        const newRoute = {
          ...$scope.editRoute,
          notes: _.cloneDeep($scope.editRoute.notes)
        }
        newRoute.notes.lelongExpiry = $scope.editRoute._meta.campaignEndDate ?
          $scope.editRoute._meta.campaignEndDate.toISOString() : null;

        function formatDate(d) {
          return leftPad(d.getUTCFullYear(), 4, '0') + '-' +
            leftPad(d.getUTCMonth() + 1, 2, '0') + '-' +
            leftPad(d.getUTCDate(), 2, '0');
        }

        function withTimesUpdated(tripStops) {
          const msDifference = Date.UTC(
            $scope.editRoute._meta.firstTripDate.getUTCFullYear(),
            $scope.editRoute._meta.firstTripDate.getUTCMonth(),
            $scope.editRoute._meta.firstTripDate.getUTCDate()
          ) - $scope.editRoute.trips[0].date.getTime();

          const rv = tripStops.map(ts => ({
            ...ts,
            time: new Date(ts.time.getTime() + msDifference)
          }))

          for (let [old, upd] of _.zip(tripStops, rv)) {
            const day = 24*60*60*1000;
            assert(old.time.getTime() % day === upd.time.getTime() % day)
          }

          return rv;
        }

        // Update route
        const routePromise = AdminService.beeline({
          method: 'PUT',
          url: `/routes/${$scope.editRoute.id}`,
          data: {
            notes: newRoute.notes
          }
        })

        // Update trip
        const tripPromise = AdminService.beeline({
          method: 'PUT',
          url: `/trips/${$scope.editRoute.trips[0].id}`,
          data: {
            ..._.pick($scope.editRoute.trips[0], ['capacity']),
            date: formatDate($scope.editRoute._meta.firstTripDate),
            tripStops: withTimesUpdated($scope.editRoute.trips[0].tripStops),
          }
        })

        Promise.all([routePromise, tripPromise])
        .then(() => window.location.reload())
        .catch((err) => commonModals.alert(`${err && err.data && err.data.message}`))
      }
    }
  }
})
