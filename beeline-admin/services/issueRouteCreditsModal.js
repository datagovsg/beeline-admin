const issueRouteCreditsTemplate = require('../templates/issueRouteCreditsModal.html');
import leftPad from 'left-pad';

angular.module('beeline-admin')
.service('issueRouteCreditsModal',
function ($rootScope, $uibModal, AdminService, TagsService,
          commonModals, LoadingSpinner, uibModalPromise) {
  this.issueOn = function (context) {
    return uibModalPromise.openModal({
      data: {
        user: context.user,
        price: context.price,
        creditAmt: context.price,
        tag: context.tag,
        numPasses: 1,
        ticket: context.ticket,
        refundTicket: false,
      },
      controller: IssueRouteCreditsController,
      template: issueRouteCreditsTemplate,
      backdrop: 'static',
      keyboard: false,
    })
  }

  // data properties
  // - numPasses: number of passes to issue
  // - ticket:
  // - price: price of a ticket for that route
  // - user: user info
  // - tag: tag to issue to
  // - description: text describing reason for issuing credits
  // - refundTicket: does user want to void the ticket
  this.processModalResult = async function (data) {
    // cancel
    if(!data) return false

    let numPassesToRefund = data.numPasses

    try {
      if(data.refundTicket){
        await LoadingSpinner.watchPromise(
          AdminService.beeline({
            method: 'POST',
            url: `/transactions/tickets/${data.ticket.id}/refund/route_pass`,
            data: {
              targetAmt: data.price,
              creditTag: data.tag
            }
          })
        )

        numPassesToRefund--
      }

      if(numPassesToRefund > 0){
        await LoadingSpinner.watchPromise(
          AdminService.beeline({
            method: 'POST',
            url: '/transactions/route_passes/issue_free',
            data: {
              userId: data.user.id,
              quantity: numPassesToRefund,
              tag: data.tag,
              description: data.description,
            }
          })
        )
      }

      return true;

    } catch (err) {
      console.log(err)
      await commonModals.alert({
        title: 'Failed',
        message: `${err && err.data && err.data.message}`
      })

      return false
    }
  }
})

function IssueRouteCreditsController($scope) {
  $scope.$watch('data.numPasses', () => {
    $scope.data.creditAmt = Math.round($scope.data.numPasses * $scope.data.price * 100) / 100
  })
}
