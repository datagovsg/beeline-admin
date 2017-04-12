const _ = require('lodash');
const leftPad = require('left-pad');
const moment = require('moment');

angular.module('beeline-admin')
.controller('contactListsController', function($scope, $state, $stateParams,
  $urlRouter, AdminService, store, LoadingSpinner, commonModals, companyId) {
    $scope.filter = {
      orderBy: 'description',
      order: 'asc',
    }

    $scope.companyId = companyId

    $scope.$watchGroup(['filter.order', 'filter.orderBy', 'contactLists'], () => {
      $scope.sortedcontactLists = _.orderBy(
        $scope.contactLists,
        [$scope.filter.orderBy],
        [$scope.filter.order]
      )
    });
    LoadingSpinner.watchPromise(refresh());

    ///////////////////////
    // Function definitions

    function refresh() {
      return AdminService.beeline({
        url: `/companies/${companyId}/contactLists`
      })
      .then(response => {
        $scope.contactLists = response.data
      })
    }

    $scope.postNew = function () {
      return LoadingSpinner.watchPromise(AdminService.beeline({
        method: `POST`,
        url: `/companies/${companyId}/contactLists`,
        data: {
          description: `New Telephone List ${moment().format('DD MMM YYYY')}`,
          telephones: [],
          emails: []
        }
      })
      .then(refresh)
      .catch((err) => commonModals.alert(`${err && err.data && err.data.message}`)))
    }

    $scope.destroy = function (contactList) {
      return commonModals.confirm("Are you sure you want to delete?")
      .then((response) => {
        if (response) return LoadingSpinner.watchPromise(AdminService.beeline({
          method: `DELETE`,
          url: `/companies/${companyId}/contactLists/${contactList.id}`,
        })
        .then(refresh))
      })
      .catch((err) => commonModals.alert(`${err && err.data && err.data.message}`))
    }
});
