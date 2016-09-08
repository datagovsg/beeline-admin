import stopsPopupTemplate from '../templates/stopsPopup.html'

export default function (RoutesService, $uibModal, mapService) {
  /* Create the modal */

  this.show = function (options) {
    return new Promise((resolve, reject) => {

      var inst = $uibModal.open({
        windowClass: 'stops-popup',
        template: stopsPopupTemplate,
        controller: function ($scope, RoutesService, $uibModalInstance) {
          $scope.newStop = {}
          $scope.map = mapService.defaultMapOptions({
            options: {
              draggableCursor: 'crosshair',
            },
            events: {
              click(map, event, args) {
                $scope.$apply(() => {
                  $scope.selectedStop = $scope.newStop
                  $scope.selectedStop.$latlng = {
                    latitude: args[0].latLng.lat(),
                    longitude: args[0].latLng.lng(),
                  }
                  $scope.selectedStop.coordinates = {
                    type: 'POINT',
                    coordinates: [
                      args[0].latLng.lng(),
                      args[0].latLng.lat(),
                    ]
                  }
                })
              }
            },
            newStopOptions: {
              label: '+',
            },
            markersControl: {},
          })
          $scope.selectedStop = null;
          $scope.allStops = [];
          $scope.control = {};
          $scope.title = options.title;

          $scope.stopClicked = function (x) {
            $scope.selectedStop = x.model;
          }

          $scope.done = function() {
            $uibModalInstance.close();
            resolve($scope.selectedStop);
          }
          $scope.cancel = function() {
            $uibModalInstance.dismiss();
          }

          $scope.saveStop = function(selectedStop) {
            var promise;
            if (selectedStop.id) {
              promise = RoutesService.updateStop(selectedStop)
            }
            else {
              promise = RoutesService.createStop(selectedStop)
            }

            var stopId;
            promise.then((ss) => {
              stopId = ss.id;

              $scope.selectedStop = null;
              $scope.newStop = {};
              return refreshStops(true)
            })
            .then(() => {
              $scope.selectedStop = $scope.allStops.find(s => s.id == stopId)
            })
          }
          $scope.deleteStop = function(selectedStop) {
            if (selectedStop.id) {
              RoutesService.deleteStop(selectedStop.id)
              .then(() => {
                refreshStops(true)
              })
            }
          }

          function refreshStops(refresh) {
            return RoutesService.getStops(refresh).then((stops) => {
              for (let stop of stops) {
                stop.$latlng = {
                  latitude: stop.coordinates.coordinates[1],
                  longitude: stop.coordinates.coordinates[0]
                }
              }
              if ($scope.map.markersControl.newModels) {
                $scope.map.markersControl.newModels(stops)
              }
              $scope.allStops = stops;
            })
          }
          setTimeout(() => {
            google.maps.event.trigger($scope.map.control.getGMap(), 'resize')
            $scope.map.center = {latitude: 1.38, longitude: 103.8}
            $scope.map.zoom = 10;
          }, 1000)

          refreshStops()
        }
      })
    })
  }
}
