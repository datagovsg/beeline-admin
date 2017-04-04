const env = require('../env.json')
const _ = require('lodash');

angular.module('beeline-admin')
.controller('telephoneListController', function($scope, $state, $stateParams,
  $urlRouter, AdminService, store, LoadingSpinner, commonModals, companyId) {
    // Fetch the promo codes by company

    if (!companyId) return

    function reload() {
      LoadingSpinner.watchPromise(AdminService.beeline({
        url: `/companies/${companyId}/telephoneLists/${$stateParams.telephoneListId}`
      })
      .then((response) => {
        $scope.editTelephoneList = makeEditable(response.data)
      })
      .catch((promo) => {
        $scope.editTelephoneList = makeEditable({})
      }))
    }

    reload()

    $scope.save = function () {
      LoadingSpinner.watchPromise(AdminService.beeline({
        method: 'PUT',
        url: `/companies/${companyId}/telephoneLists/${$stateParams.telephoneListId}`,
        data: preSaveTransform($scope.editTelephoneList)
      })
      .then((response) => {
        $scope.editTelephoneList = makeEditable(response.data)
        return reload()
      })
      .catch(err => {
        commonModals.alert(`${err && err.data && err.data.message}`)
      }))
    }

    function preSaveTransform(e) {
      return {
        description: e.description,
        numbers: e.numbers.split('\n')
          .map(s => s.trim())
          .filter(s => s),
      }
    }

    function makeEditable(telephoneList) {
      return {
        description: telephoneList.description,
        numbers: telephoneList.numbers.join('\n')
      }
    }
});
