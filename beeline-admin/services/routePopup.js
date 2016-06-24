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
            events: {
            },
            newStopOptions: {
              label: '+',
            },
            markersControl: {},
            pingPathOptions: {
              icons: [{
                icon: {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: 1,
                  scale: 4
                },
                offset: '0',
                repeat: '5px'
              }],
              stroke: {
                opacity: 0,
              },
            },
            pingSampleOptions: {
              icon: {
                url: './img/routePtMarker.png',
              }
            },
            pingEvents: {
              mouseover(marker, event, model) {
                console.log(model);
                $scope.selectedPing = model;
              },
            }
          });
          $scope.computed = {
            path: [],
            pingPath: [],
            stops: []
          }

          uiGmapGoogleMapApi.then((googleMaps) => {
            _.assign($scope.map.pingSampleOptions.icon, {
              scaledSize: new googleMaps.Size(15, 15),
              anchor: new googleMaps.Point(8, 8)
            })

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

            // get all trips
            TripsService.getTrips({
              routeId: $scope.route.id,
              startDate: new Date(2015,1,1),
              endDate: new Date(2060,1,1),
            })
            .then((trips) => {
              $scope.trips = trips;
            })
          });

          $scope.stopClicked = (marker, event, model) => {
            $scope.selectedStop = model;
          }

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

            var periodStart = new Date(
              trip.date.getFullYear(),
              trip.date.getMonth(),
              trip.date.getDate()
            ).getTime();
            var periodEnd = periodStart + 24*60*60*1000;

            TripsService.getPings({
              tripId: trip.id,
              startTime: periodStart,
              endTime: periodEnd,
            })
            .then((pings) => {
              $scope.pings = _.sortBy(pings, ping => ping.time);
              $scope.computed.pingPath = pings.map(ping => ({
                latitude: ping.coordinates.coordinates[1],
                longitude: ping.coordinates.coordinates[0],
              }))

              $scope.computed.pingSamples = _.filter(pings, (value, index) => index % 3 == 0)

              for (let ping of $scope.computed.pingSamples) {
                ping._options = $scope.map.pingSampleOptions;
              }

              console.log($scope.computed.pingSamples);
            })
          })

          setTimeout(() => {
            google.maps.event.trigger($scope.map.control.getGMap(), 'resize')
            $scope.map.center = {latitude: 1.38, longitude: 103.8}
            $scope.map.zoom = 10;
          }, 1000)
        }
      })
    })
  }
}
