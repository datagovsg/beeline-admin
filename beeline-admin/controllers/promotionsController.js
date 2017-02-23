const env = require('../env.json')
const _ = require('lodash');

angular.module('beeline-admin')
.controller('promotionsController', function($scope, $state, $stateParams,
  $urlRouter, AdminService, store, LoadingSpinner, commonModals, companyId) {
    $scope.promoCodes = null;
    $scope.promoTypes = ['Promotion'];

    // Fetch the promo codes by company
    LoadingSpinner.watchPromise(AdminService.beeline({
      url: `/companies/${companyId}/promotions/${$stateParams.promoId}`
    })
    .then((response) => {
      $scope.editPromoCode = makeEditable(response.data)
    })
    .catch((promo) => {
      $scope.editPromoCode = makeEditable({})
    }))

    $scope.save = function () {
      console.log(preSaveTransform($scope.editPromoCode))
      LoadingSpinner.watchPromise(AdminService.beeline({
        method: 'PUT',
        url: `/companies/${companyId}/promotions/${$stateParams.promoId}`,
        data: preSaveTransform($scope.editPromoCode)
      })
      .then((response) => {
        $scope.editPromoCode = makeEditable(response.data)
      })
      .catch(err => {
        commonModals.alert(`${err && err.data && err.data.message}`)
      }))
    }

    function preSaveTransform(e) {
      return _.omit({
        ...e,
        code: e.code.toUpperCase()
      }, ['id', 'createdAt', 'updatedAt'])
    }

    function makeEditable(promo) {
      return _.cloneDeep({
        type: 'Promotion',
        code: 'HELLOW',
        description: 'Hello world!',
        ...promo,
        params: {
          ...promo.params,
          refundFunction: promo.params.refundFunction || { type: 'refundDiscountedAmt' },
          qualifyingCriteria: promo.params.qualifyingCriteria || [],
          discountFunction: promo.params.discountFunction || {type: 'simpleRate', rate: 0},
          usageLimit: promo.params.usageLimit || { userLimit: null, globalLimit: null },
        },
      })
    }
});
