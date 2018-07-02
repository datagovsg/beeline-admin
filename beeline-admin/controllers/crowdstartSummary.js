import querystring from 'querystring'
import assert from 'assert';
import _ from 'lodash';

angular.module('beeline-admin').controller('CrowdstartSummaryCtrl', [
  '$scope', 'AdminService', 'RoutesService', 'LoadingSpinner',
  '$state', '$stateParams', 'issueTicketModal', 'commonModals', 'companyId',
  RoutePopup,
function($scope, AdminService, RoutesService, LoadingSpinner,
  $state, $stateParams, issueTicketModal, commonModals, companyId,
  RoutePopup) {

  $scope.routes = [];

  $scope.filter = {
    order: 'desc',
    orderBy: '_meta.tiers[0].fraction',
    showExpiry: 'active'
  }

  $scope.viewRoute = function (routeId) {
    RoutePopup.show({routeId});
  }

  $scope.$watchGroup(['routes', 'filter.order', 'filter.orderBy', 'filter.showExpiry'], () => {
    $scope.sortedRoutes = _($scope.routes)
      .filter(r =>
        $scope.filter.showExpiry === 'all' ? true :
        $scope.filter.showExpiry === 'active' ? !r._meta.isExpired :
          r._meta.isExpired
      )
      .orderBy(
        [r => _.get(r, $scope.filter.orderBy)],
        [$scope.filter.order]
      )
      .value()
  })

  AdminService.beeline({
    url:'/crowdstart/status'
  })
  .then((result) => {
    const transformed = result.data
    .filter(r => r.transportCompanyId == companyId)
    .map(route => {
      return {
        ...route,
        _meta: {
          isConverted: route.tags.find(x => x == 'success' || x == 'failed'),
          tiers: transformTiers(route.bids, route.notes.tier),
          isExpired: new Date(route.notes.crowdstartExpiry).getTime() < Date.now()
        }
      }
    })
    $scope.routes = transformed
  })
}]);

function transformTiers(bids, tiers) {
  // Brute force calculation because the scale should be small
  return tiers.map(tier => {
    const matchingBids = (bids || []).filter(b => b.priceF < tier.price + 0.00001)
    return {
      ...tier,
      numBids: matchingBids.length,
      achieved: matchingBids.length >= tier.pax,
      fraction: matchingBids.length / tier.pax,
    }
  })
}
