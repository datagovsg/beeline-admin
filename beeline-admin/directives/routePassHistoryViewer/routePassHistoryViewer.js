
angular.module('beeline-admin')
.directive('routePassHistoryViewer', [
  'AdminService', 'commonModals', '$q',
  function (AdminService, commonModals, $q) {
  return {
    restrict: 'E',
    scope: {
      userId: '<',
      companyId: '<',
      tag: '<',
      finalBalance: '<',
    },
    template: require('./routePassHistoryViewer.html'),
    controller: ['$scope', function ($scope) {
      $scope.$watchGroup(['userId', 'companyId', 'tag', 'finalBalance'], () => {
        $scope.reset()
      })

      $scope.reset = function () {
        $scope.moreToLoad = true;
        $scope.routeCreditHistory = []
        $scope.loadHistoryPromise = $q.resolve([])
        $scope.loadMoreHistory()
      }

      $scope.loadMoreHistory = function () {
        $scope.loadHistoryPromise = $scope.loadHistoryPromise
        .then((historySoFar) => {
          const baseUrl = `/companies/${$scope.companyId}/route_passes/${$scope.tag}` +
            `/users/${$scope.userId}/history`
          const loadUrl = historySoFar.length === 0 ?
            baseUrl : `${baseUrl}?lastId=${historySoFar[historySoFar.length - 1].id}`

          return AdminService.beeline({
            url: loadUrl
          })
          .then((historyResponse) => {
            const concatenated = decorateWithBalance(historySoFar, historyResponse.data)

            if (historyResponse.data.length < 20) {
              $scope.moreToLoad = false
            }
            $scope.routeCreditHistory = concatenated.slice().reverse();
            return concatenated
          })
          .catch((err) => {
            return commonModals.alert({
              title: 'Error loading data',
              message: _.get(err, 'data.message')
            })
            .then(() => historySoFar)
          })
        })
      }

      function decorateWithBalance(lastChunk, nextChunk) {
        let lastBalance = lastChunk.length === 0 ?
          parseFloat($scope.finalBalance) : lastChunk[lastChunk.length - 1]._balanceBefore

        for (let item of nextChunk) {
          const nextBalance = lastBalance + (item.debit < 0 ? -1 : 1)
          item._balanceAfter = lastBalance
          item._balanceBefore = parseFloat(nextBalance.toFixed(2))

          lastBalance = nextBalance
        }

        return lastChunk.concat(nextChunk)
      }

      $scope.reset()
    }]
  }
}])
