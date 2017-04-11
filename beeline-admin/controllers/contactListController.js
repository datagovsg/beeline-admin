const env = require('../env.json')
const _ = require('lodash');

angular.module('beeline-admin')
.controller('contactListController', function($scope, $state, $stateParams,
  $urlRouter, AdminService, store, LoadingSpinner, commonModals, companyId) {
    // Fetch the promo codes by company

    if (!companyId) return

    function reload() {
      LoadingSpinner.watchPromise(AdminService.beeline({
        url: `/companies/${companyId}/contactLists/${$stateParams.contactListId}`
      })
      .then((response) => {
        $scope.editContactList = makeEditable(response.data)
      })
      .catch((promo) => {
        $scope.editContactList = makeEditable({})
      }))
    }

    reload()

    $scope.save = function () {
      LoadingSpinner.watchPromise(AdminService.beeline({
        method: 'PUT',
        url: `/companies/${companyId}/contactLists/${$stateParams.contactListId}`,
        data: preSaveTransform($scope.editContactList)
      })
      .then((response) => {
        $scope.editContactList = makeEditable(response.data)
        return reload()
      })
      .catch(err => {
        commonModals.alert(`${err && err.data && err.data.message}`)
      }))
    }

    function preSaveTransform(e) {
      return {
        description: e.description,
        telephones: e.telephones.split('\n')
          .map(s => s.trim())
          .filter(s => s),
        emails: e.emails.split('\n')
          .map(s => s.trim())
          .filter(s => s),
      }
    }

    function makeEditable(contactList) {
      return {
        description: contactList.description,
        telephones: contactList.telephones.join('\n'),
        emails: contactList.emails.join('\n')
      }
    }
});
