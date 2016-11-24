import stopsPopupTemplate from '../templates/routePopup.html'

export default function (RoutesService, $uibModal, mapService, TripsService) {
  /* Create the modal */

  this.show = function (options) {
    return new Promise((resolve, reject) => {
      var inst = $uibModal.open({
        keyboard: false,
        template: stopsPopupTemplate,
        controller: function ($scope, RoutesService, $uibModalInstance,
          uiGmapGoogleMapApi) {
          $scope.newStop = {}
          $scope.map = mapService.defaultMapOptions({
            newStopOptions: {
              label: '+',
            },
            markersControl: {},
            routePathOptions: {
              stroke: {
                opacity: 0.5,
                color: '#99CCFF',
              }
            },
            pingPathOptions: {
              icons: [],
              stroke: {
                opacity: 1.0,
                color: '#0000FF',
              },
              polylineOptions: {
                zIndex: 10,
              }
            },
            otherPingPathOptions: {
              icons: [],
              stroke: {
                opacity: 0.5,
                color: '#0000FF',
              },
              polylineOptions: {
                zIndex: 10,
              }
            },
          });
          $scope.computed = {
            path: [],
            pingPath: [],
            stops: []
          }

          uiGmapGoogleMapApi.then((googleMaps) => {
            $scope.map.pingPathOptions.polylineOptions.zIndex = googleMaps.MAX_ZINDEX + 4;
            $scope.map.otherPingPathOptions.polylineOptions.zIndex = googleMaps.MAX_ZINDEX;

            $scope.$watch('route.path', (path) => {
              if (!path) {
                $scope.computed.path = []
                return
              }

              $scope.computed.path = typeof path === 'string'
              ? googleMaps.geometry.encoding.decodePath(path)
              : path.map(({lat: latitude, lng: longitude}) => ({latitude, longitude}))
            })
          })

          /* Query the route */
          RoutesService.getRoute(options.routeId/* Don't load cache at all? */)
          .then((route) => {
            $scope.route = route;
          });

          $scope.$on('modal.closing', (event) => {
            if (!$scope.closing) {
              event.preventDefault();
            }
          })
          $scope.$watch('closing', (closing) => {
            if (closing) {
              $scope.$close();
            }
          })

          /* Query the trip */
          $scope.$watchGroup(['route'], (route) => {
            if (!$scope.route) return;

            // We only need trips till today
            var today = new Date();

            // get all trips
            TripsService.getTrips({
              routeId: $scope.route.id,
              startDate: new Date(Date.UTC(2015,1,1)),
              endDate: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
            })
            .then((trips) => {
              $scope.trips = trips;
            })
          });

          $scope.stopClicked = (marker, event, model) => {
            $scope.selectedStop = model;
          }

          $scope.$on('pingPath.pingSelected', (event, ping) => {
            $scope.selectedPing = ping;
          })

          $scope.$watch('trip', (trip) => {
            if (!trip) return;

            trip.tripStops = _.sortBy(trip.tripStops, ts => ts.time)

            for (let i=0; i<trip.tripStops.length; i++) {
              let ts = trip.tripStops[i];

              ts._options = {
                icon: {
                  url: './img/stop' + (ts.canBoard ? 'Board' : 'Alight') + (i+1) + '.png',
                  scaledSize: new google.maps.Size(48,48),
                  anchor: new google.maps.Point(24,24),
                }
              }
            }

            var periodStart = _.minBy(trip.tripStops, 'time').time.getTime() - 60*60*1000
            var periodEnd = _.maxBy(trip.tripStops, 'time').time.getTime() + 60*60*1000

            TripsService.getPings({
              tripId: trip.id,
              startTime: periodStart,
              endTime: periodEnd,
            })
            .then((pings) => {
              $scope.pings = pings;
            })

            TripsService.getPings({
              tripId: trip.id,
              byTripId: true,
              startTime: periodStart,
              endTime: periodEnd,
            })
            .then((pings) => {
              $scope.otherPings = _.groupBy(pings, 'driverId')
            })
          })

          setTimeout(() => {
            google.maps.event.trigger($scope.map.control.getGMap(), 'resize')
            $scope.map.center = {latitude: 1.38, longitude: 103.8}
            $scope.map.zoom = 10;
          }, 1000)
        } /* Controller */
      })
    })
  }
}
