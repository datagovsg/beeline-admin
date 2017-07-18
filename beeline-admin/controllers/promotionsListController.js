const _ = require('lodash');
const leftPad = require('left-pad');

angular.module('beeline-admin')
.controller('promotionsListController', function($scope, $state, $stateParams,
  $urlRouter, AdminService, store, LoadingSpinner, commonModals, companyId) {
    $scope.filter = {
      orderBy: 'code',
      order: 'asc',
      promotionType: 'Promotion',
    }

    $scope.$watchGroup(['filter.order', 'filter.orderBy', 'filter.promotionType', 'promotions'], () => {
      $scope.sortedPromotions = $scope.promotions && _.orderBy(
        $scope.promotions.filter(x => x.type === $scope.filter.promotionType),
        [$scope.filter.orderBy],
        [$scope.filter.order]
      )
    });
    LoadingSpinner.watchPromise(refresh());

    ///////////////////////
    // Function definitions

    function refresh() {
      return AdminService.beeline({
        url: `/companies/${companyId}/promotions`
      })
      .then(response => {
        $scope.promotions = response.data
      })
    }

    $scope.postNew = function () {
      const code = randomString() + randomString() + randomString()

      let promoData

      let now = new Date()
      let startDate = now.toISOString().slice(0,10)
      // 1 month after today
      let endDate = new Date(now.getFullYear(), now.getMonth()+1, now.getDate()).toISOString().slice(0,10)

      if ($scope.filter.promotionType === 'Promotion') {
        promoData = {
          code,
          description: `New Promo Code`,
          type: 'Promotion',
          params: {
            qualifyingCriteria: [{type: 'limitByCompany', params: {companyId}}, {type: 'limitByTripDate', params: {startDate: startDate,endDate: endDate}}],
            discountFunction: { type: 'simpleRate', params: {rate: 0.10}},
            refundFunction: { type: 'refundDiscountedAmt', params: {} },
            usageLimit: {userLimit: 1, globalLimit: 1000000}
          }
        }
      } else {
        // TODO: how to add route price schedule to the route?
        promoData = {
          code: '', //route pass with no promo code entered
          description: `New Route Pass`,
          type: 'RoutePass',
          params: {
            tag: code,
            qualifyingCriteria: [{type: 'limitByCompany', params: {companyId}}, {type: 'limitByPurchaseDate', params: {startDate: startDate,endDate: endDate}}],
            discountFunction: { type: 'tieredFixedByTotalValue', params: {"schedule": [[25, 5], [50, 10]]}},
            refundFunction: { type: 'refundDiscountedAmt', params: {} },
            usageLimit: {userLimit: null, globalLimit: null}
          }
        }
      }

      return LoadingSpinner.watchPromise(AdminService.beeline({
        method: `POST`,
        url: `/companies/${companyId}/promotions`,
        data: promoData
      })
      .then(refresh)
      .then(() => commonModals.flash(`A new dummy promotion ${code} has been created`))
      .catch((err) => commonModals.alert(`${err && err.data && err.data.message}`)))
    }

    $scope.destroy = function (promotion) {
      return commonModals.confirm("Are you sure you want to delete?")
      .then((response) => {
        if (response) return LoadingSpinner.watchPromise(AdminService.beeline({
          method: `DELETE`,
          url: `/companies/${companyId}/promotions/${promotion.id}`,
        })
        .then(response => {
        })
        .then(refresh))
      })
      .catch((err) => commonModals.alert(`${err && err.data && err.data.message}`))
    }
});

function randomString() {
  return leftPad(Math.floor(Math.random() * (1 << 30))
    .toString(35).toUpperCase(), 5, 'Z')
}
