export default function (RoutesService, $uibModal) {
  /* Create the modal */

  this.show = function (options) {
    return new Promise((resolve, reject) => {

      var inst = $uibModal.open({
        template: `
    <div class="stops-popup">
      <div class="modal-header">
        <h3>{{title}}</h3>
      </div>

      <div class="modal-body">
        <ui-gmap-google-map
          center="center"
          zoom="zoom"
          control="control"
        >
          <ui-gmap-markers
            models="allStops"
            coords="'$latlng'"
            idKey="'id'"
            doCluster="true"
            click="stopClicked"
            >
          </ui-gmap-markers>
        </ui-gmap-google-map>
      </div>
      <div class="modal-footer">
      <div><b>Selected stop:</b> {{selectedStop.description}}</div>
        <span class="btn-group">
          <button class="btn btn-primary"
            ng-click="done()">
            OK
          </button>
          <button class="btn btn-default"
            ng-click="cancel()">
            Cancel
          </button>
        </span>
      </div>
    </div>

        `,
        controller: function ($scope, RoutesService, $uibModalInstance) {
          $scope.selectedStop = null;
          $scope.allStops = [];
          $scope.center = {latitude: 1.38, longitude: 103.8}
          $scope.zoom = 10;
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

          RoutesService.getStops().then((stops) => {
            console.log(stops)

            for (let stop of stops) {
              stop.$latlng = {
                latitude: stop.coordinates.coordinates[1],
                longitude: stop.coordinates.coordinates[0]
              }
            }

            $scope.allStops = stops;
          })
          setTimeout(() => {
            google.maps.event.trigger($scope.control.getGMap(), 'resize')
            $scope.center = {latitude: 1.38, longitude: 103.8}
            $scope.zoom = 10;
          }, 1000)
        }
      })
    })
  }
}
