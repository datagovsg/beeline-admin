const expireRouteCreditsTemplate = require('../templates/expireRouteCreditsModal.html');
import leftPad from 'left-pad';

angular.module('beeline-admin')
.service('expireRouteCreditsModal',
function ($rootScope, $uibModal, AdminService, TagsService,
          commonModals, LoadingSpinner, uibModalPromise) {
  this.showExpireModal = function (context) {
    const tags = TagsService.getCreditTags(context.route.tags)
    const tag = tags[0]

    if(!tag){
      return commonModals.alert({
        title: 'Error',
        message:
        `The route for the selected ticket does not have suitable credit tags.`
      })
    }

    return uibModalPromise.openModal({
      data: {
        user: context.user,
        route: context.route,
        debitAmt: context.price,
        tag: tags[0] || '',
        tags: tags,
      },
      template: expireRouteCreditsTemplate,
      backdrop: 'static',
      keyboard: false,
    })
  }

  this.processModalResult = function (expireResult) {
    if (expireResult) {
      const {debitAmt, tag, user} = expireResult

      return AdminService.beeline({
        method: 'POST',
        url: `/companies/${AdminService.getCompanyId()}/route_credits/${tag}/users/${user.id}/expire`,
        data: {
          amount: debitAmt
        }
      })
    }
  }
})
