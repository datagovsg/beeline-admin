const env = require('../env.json')
const _ = require('lodash');

angular.module('beeline-admin')
.controller('promotionsController', function($scope, $state, $stateParams,
  $urlRouter, AdminService, store, LoadingSpinner, commonModals, companyId) {
    $scope.promoCodes = null;
    $scope.promoTypes = ['Promotion'];

    //
    const companyQualifyingCriterion = {
      type: 'limitByCompany',
      params: {companyId}
    }

    // Fetch the promo codes by company
    LoadingSpinner.watchPromise(AdminService.beeline({
      url: `/companies/${companyId}/promotions/${$stateParams.promoId}`
    })
    .then((response) => {
      $scope.editPromoCode = makeEditable(response.data)
    })
    .catch((err) => commonModals.alert(`${_.get(err, 'message') || _.get(err, 'data.message')}`)))

    $scope.save = function () {
      LoadingSpinner.watchPromise(AdminService.beeline({
        method: 'PUT',
        url: `/companies/${companyId}/promotions/${$stateParams.promoId}`,
        data: preSaveTransform($scope.editPromoCode)
      })
      .then((response) => {
        $scope.editPromoCode = makeEditable(response.data)
      })
      .then(err =>
        commonModals.alert(`Promotion saved`)
      )
      .catch(err => {
        commonModals.alert(`${err && err.data && err.data.message}`)
      }))
    }

    function preSaveTransform(e) {
      const myParams = _.omit(e.params, ['companyId'])

      return {
        code: e.code.toUpperCase(),
        params: {
          ...myParams,
          qualifyingCriteria: myParams.qualifyingCriteria.concat([companyQualifyingCriterion])
        },
        description: e.description,
        type: e.type,
      }
    }

    function makeEditable(promo) {

      /* We need to add limitByCompany for all promotions
      created by a company */
      function filterCompanyCriteria(qc) {
        return qc.filter(c => !_.isEqual(c, companyQualifyingCriterion))
      }

      return _.cloneDeep({
        type: 'Promotion',
        code: 'HELLOW',
        description: 'Hello world!',
        ...promo,
        params: {
          ...promo.params,
          refundFunction: _.defaults(promo.params.refundFunction, { type: 'refundDiscountedAmt', params: {} }),
          qualifyingCriteria: filterCompanyCriteria(promo.params.qualifyingCriteria),
          discountFunction: promo.params.discountFunction || {type: 'simpleRate', params: {rate: 0}},
          usageLimit: promo.params.usageLimit || { userLimit: null, globalLimit: null },
        },
      })
    }
});
