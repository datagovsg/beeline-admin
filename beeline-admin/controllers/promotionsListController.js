const _ = require('lodash');
const leftPad = require('left-pad');

angular.module('beeline-admin')
.controller('promotionsListController', function($scope, companyId) {
    $scope.pageProps = {
      companyId
    }
});
