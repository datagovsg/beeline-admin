const issueRouteCreditsTemplate = require('../templates/issueRouteCreditsModal.html');
import leftPad from 'left-pad';

export default function ($rootScope, $uibModal, AdminService,
  TagsService, commonModals, LoadingSpinner) {
  
  this.issueOn = async function (context) {
    return await openModal(context).then(processRequest)
  }

  function openModal (context) {
    // format contextual data
    var modalScope = $rootScope.$new();
    modalScope.data = {
      user: context.user,
      route: context.route,
      price: context.price,
      creditAmt: context.price,
      tag: null,
      tags: null,
      numPasses: 1,
      ticket: context.ticket, 
      refundTicket: false,
    }
    modalScope.data.tags = TagsService.getCreditTags(modalScope.data.route.tags)
    modalScope.data.tag = modalScope.data.tags[0] || ''

    // check context
    if(!modalScope.data.tag){
      return commonModals.alert({
        title: 'Error',
        message: 
        `The route for the selected ticket does not have suitable credit tags.`
      })
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

  // data properties
  // - numPasses: number of passes to issue
  // - ticket: 
  // - price: price of a ticket for that route
  // - user: user info
  // - tag: tag to issue to
  // - description: text describing reason for issuing credits
  // - refundTicket: does user want to void the ticket
  async function processRequest (data) {
    // cancel
    if(!data) return false

    let numPassesToRefund = data.numPasses

    try {
      if(data.refundTicket){
        await LoadingSpinner.watchPromise(
          AdminService.beeline({
            method: 'POST',
            url: '/transactions/refund/routePass',
            data: {
              ticketId: data.ticket.id,
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
            url: '/transactions/issueFreeRoutePass',
            data: {
              userId: data.user.id,
              amount: numPassesToRefund * data.price,
              routeId: data.route.id,
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
        message: err
      })

      return false
    }

  }

}

function IssueRouteCreditsController($scope) {
  $scope.$watch('data.numPasses', () => {
    $scope.data.creditAmt = Math.round($scope.data.numPasses * $scope.data.price * 100)/100
  })
}
