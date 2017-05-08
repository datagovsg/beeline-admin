
angular.module('beeline-admin')
.directive('routeCreditHistoryViewer', function (AdminService, commonModals, $q) {
  return {
    restrict: 'E',
    scope: {
      userId: '<',
      companyId: '<',
      creditTag: '<',
      finalBalance: '<',
    },
    template: require('./routeCreditHistoryViewer.html'),
    controller($scope) {
      $scope.$watchGroup(['userId', 'companyId', 'creditTag', 'finalBalance'], () => {
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
          const baseUrl = `/companies/${$scope.companyId}/routeCredits/${$scope.creditTag}` +
            `/userHistory/${$scope.userId}`
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
            $scope.agingRecords = _.keyBy(computeAging(concatenated).accounted, 'id')
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
          const nextBalance = lastBalance + parseFloat(item.debit)
          item._balanceAfter = lastBalance
          item._balanceBefore = parseFloat(nextBalance.toFixed(2))

          lastBalance = nextBalance
        }

        return lastChunk.concat(nextChunk)
      }

      function computeAging(items) {
        let aging = {
          unaccounted: parseFloat($scope.finalBalance),
          accounted: []
        }

        for (let item of items) {
          if (aging.unaccounted <= 0) {
            break
          } else {
            if (item.creditF >= 0) {
              aging = {
                unaccounted: aging.unaccounted - item.creditF,
                accounted: aging.accounted.concat([{
                  ...item,
                  _unusedBalance: Math.min(aging.unaccounted, item.creditF)
                }])
              }
            }
          }
        }

        return aging
      }

      $scope.reset()
    }
  }
})
