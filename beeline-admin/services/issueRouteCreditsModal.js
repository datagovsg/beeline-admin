const issueRouteCreditsTemplate = require('../templates/issueRouteCreditsModal.html');
import leftPad from 'left-pad';

export default function ($rootScope, $uibModal, TagsService, commonModals) {
  this.open = async function (params) {
    var modalScope = $rootScope.$new();
    modalScope.data = {
      user: params.user,
      price: params.boardStop.trip.priceF,
      route: params.boardStop.trip.route,
      ticket: params, 
      numPasses: 1,
      creditAmt: params.boardStop.trip.priceF,
      tags: null,
      tag: null,
      refundTicket: false,
    }
    modalScope.data.tags = TagsService.getCreditTags(modalScope.data.route.tags)
    modalScope.data.tag = modalScope.data.tags[0] || ''

    if(!modalScope.data.tag){
      await commonModals.alert({
        title: 'Error',
        message: 
        `The route for the selected ticket does not have suitable credit tags.`
      })
      return 
    }

    var modalOptions = {
      controller: IssueRouteCreditsController,
      template: issueRouteCreditsTemplate,
      scope: modalScope,
      // windowClass: 'full-width',
      backdrop: 'static',
      keyboard: false,
    };

    var modal = $uibModal.open(modalOptions);
    return modal.result
  }
}

function IssueRouteCreditsController($scope) {
  $scope.$watch('data.numPasses', () => {
    $scope.data.creditAmt = Math.round($scope.data.numPasses * $scope.data.price * 100)/100
  })
}
