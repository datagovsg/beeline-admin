const expireRouteCreditsTemplate = require('../templates/expireRouteCreditsModal.html');
import leftPad from 'left-pad';

angular.module('beeline-admin')
.service('expireRouteCreditsModal',
[
  '$rootScope', '$uibModal', 'AdminService', 'TagsService',
  'commonModals', 'LoadingSpinner', 'uibModalPromise',
  function ($rootScope, $uibModal, AdminService, TagsService,
          commonModals, LoadingSpinner, uibModalPromise) {
  this.showExpireModal = function (context) {
    const tags = TagsService.getTags(context.route.tags)
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
        quantity: context.quantity,
        tag: context.tag
      },
      template: expireRouteCreditsTemplate,
      backdrop: 'static',
      keyboard: false,
    })
  }

  this.processModalResult = function (expireResult) {
    if (expireResult) {
      const {quantity, tag, user} = expireResult

      return AdminService.beeline({
        method: 'POST',
        url: `/companies/${AdminService.getCompanyId()}/route_passes/${tag}/users/${user.id}/expire`,
        data: {
          quantity
        }
      })
    }
  }
}])
