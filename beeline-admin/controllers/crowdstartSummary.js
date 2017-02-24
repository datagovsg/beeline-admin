import querystring from 'querystring'
import assert from 'assert';
import _ from 'lodash';

angular.module('beeline-admin').controller('CrowdstartSummaryCtrl',
function($scope, AdminService, RoutesService, LoadingSpinner,
  $state, $stateParams, issueTicketModal, commonModals, companyId) {

  $scope.routes = [];

  $scope.filter = {
    order: 'asc',
    orderBy: 'route.id'
  }

  $scope.$watchGroup(['routes', 'filter.order', 'filter.orderBy'], () => {
    $scope.sortedRoutes = _.orderBy(
      $scope.routes,
      [r => _.get(r, $scope.filter.orderBy)],
      [$scope.filter.order]
    )
  })

  AdminService.beeline({
    url:'/custom/lelong/status'
  })
  .then((result) => {
    const transformed = result.data
    .filter(r => r.transportCompanyId == companyId)
    .map(route => ({
      ...route,
      _meta: {
        isConverted: route.tags.find(x => x == 'success' || x == 'failed'),
        tiers: transformTiers(route.bids, route.notes.tier),
        isExpired: new Date(route.notes.lelongExpiry).getTime() < Date.now()
      }
    }))
    $scope.routes = transformed
  })
});

function transformTiers(bids, tiers) {
  // Brute force calculation because the scale should be small
  return tiers.map(tier => {
    const matchingBids = (bids || []).filter(b => b.userOptions.price < tier.price + 0.00001)
    return {
      ...tier,
      numBids: matchingBids.length,
      achieved: matchingBids.length >= tier.pax,
      fraction: matchingBids.length / tier.pax,
    }
  })
}
