const _ = require('lodash');
const leftPad = require('left-pad');
const moment = require('moment');

angular.module('beeline-admin')
.controller('telephoneListsController', function($scope, $state, $stateParams,
  $urlRouter, AdminService, store, LoadingSpinner, commonModals, companyId) {
    $scope.filter = {
      orderBy: 'description',
      order: 'asc',
    }

    $scope.companyId = companyId

    $scope.$watchGroup(['filter.order', 'filter.orderBy', 'telephoneLists'], () => {
      $scope.sortedtelephoneLists = _.orderBy(
        $scope.telephoneLists,
        [$scope.filter.orderBy],
        [$scope.filter.order]
      )
    });
    LoadingSpinner.watchPromise(refresh());

    ///////////////////////
    // Function definitions

    function refresh() {
      return AdminService.beeline({
        url: `/companies/${companyId}/telephoneLists`
      })
      .then(response => {
        $scope.telephoneLists = response.data
      })
    }

    $scope.postNew = function () {
      return LoadingSpinner.watchPromise(AdminService.beeline({
        method: `POST`,
        url: `/companies/${companyId}/telephoneLists`,
        data: {
          description: `New Telephone List ${moment().format('DD MMM YYYY')}`,
          numbers: []
        }
      })
      .then(refresh)
      .catch((err) => commonModals.alert(`${err && err.data && err.data.message}`)))
    }

    $scope.destroy = function (telephoneList) {
      return commonModals.confirm("Are you sure you want to delete?")
      .then((response) => {
        if (response) return LoadingSpinner.watchPromise(AdminService.beeline({
          method: `DELETE`,
          url: `/companies/${companyId}/telephoneLists/${telephoneList.id}`,
        })
        .then(response => {
        })
        .then(refresh))
      })
      .catch((err) => commonModals.alert(`${err && err.data && err.data.message}`))
    }
});
