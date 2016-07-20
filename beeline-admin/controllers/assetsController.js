
const env = require('../env.json')

export default function($scope, $state, $urlRouter, AdminService, store,
  LoadingSpinner, $uibModal) {

  $scope.assets = null;

  function refreshAssets() {
    var promise = AdminService.beeline({
      method: 'GET',
      url: '/assets'
    })
    .then((response) => {
      $scope.assets = response.data;
    })

    LoadingSpinner.watchPromise(promise);
    return promise;
  }

  $scope.assetUrl = (asset, renderMarkdown) => {
    return `${env.BACKEND_URL}/assets/${asset.id}` +
      (renderMarkdown ? '/renderMarkdown' : '');
  }
  $scope.deleteAsset = (asset) => {
    LoadingSpinner.watchPromise(AdminService.beeline({
      method: 'DELETE',
      url: `/assets/${asset.id}`
    })
    .then(refreshAssets))
  }

  $scope.editAsset = editAsset;

  function editAsset(asset) {
    var inst = $uibModal.open({
      templateUrl: 'asset-editor.html',
      controller: function ($scope, RoutesService, $uibModalInstance) {
        $scope.asset = null;

        if (asset) {
          LoadingSpinner.watchPromise(AdminService.beeline({
            method: 'GET',
            url: `/assets/${asset.id}`,
          })
          .then((response) => {
            $scope.asset = response.data;
          }))
        }
        else {
          $scope.asset = {};
        }

        $scope.save = function() {
          console.log($scope.asset)
          var promise = AdminService.beeline({
            method: 'PUT',
            url: `/assets/${$scope.asset.id}`,
            data: {
              data: $scope.asset.data
            }
          })
          .then(() => {
            $uibModalInstance.close();
            return refreshAssets();
          })
          LoadingSpinner.watchPromise(promise);
        }

        $scope.cancel = function() {
          $uibModalInstance.close();
        }
      }
    })
  }

  refreshAssets();
}
