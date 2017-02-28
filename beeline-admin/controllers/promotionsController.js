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
      return {
        code: e.code.toUpperCase(),
        params: _.omit(e.params, ['companyId']),
        description: e.description,
        type: e.type,
      }
    }

    function makeEditable(promo) {

      /* We need to add limitByCompany for all promotions
      created by a company */
      function addCompanyCriteria(qc) {
        const criterion = {
          type: 'limitByCompany',
          params: {companyId}
        }
        if (_.some(qc, criterion)) {
          return qc;
        } else {
          return [criterion].concat(qc)
        }
      }

      return _.cloneDeep({
        type: 'Promotion',
        code: 'HELLOW',
        description: 'Hello world!',
        ...promo,
        params: {
          ...promo.params,
          refundFunction: _.defaults(promo.params.refundFunction, { type: 'refundDiscountedAmt', params: {} }),
          qualifyingCriteria: addCompanyCriteria(promo.params.qualifyingCriteria),
          discountFunction: promo.params.discountFunction || {type: 'simpleRate', params: {rate: 0}},
          usageLimit: promo.params.usageLimit || { userLimit: null, globalLimit: null },
        },
      })
    }
});
