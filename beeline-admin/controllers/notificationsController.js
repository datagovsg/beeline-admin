import querystring from 'querystring';
import _ from 'lodash';

export default function ($scope, AdminService, LoadingSpinner, commonModals) {
  var companyId;

  $scope.$watch(() => AdminService.getCompanyId(), (cid) => {
    $scope.companyId = companyId = cid;
    requery();
  })

  requery();

  ////// Data declarations
  $scope.disp = {
    eventTypes: [
      ['noPings', 'Driver App not switched on'],
      ['tripCancelled', 'Trip cancelled by driver'],
      ['passengersMessaged', 'Message broadcast to passengers'],
      ['newBooking', 'New booking made'],
      ['urgentBooking', 'Last minute booking made'],
    ].concat( AdminService.isSuperAdmin() ? [
      ['lifecycle', 'Server started'],
      ['transactionFailure', 'Payment problems']
    ] : [])
  }
  $scope.eventSubscriptions = [];

  ////// Function declarations
  async function requery() {
    if (!companyId) return;

    LoadingSpinner.watchPromise(AdminService.beeline({
      url: `/companies/${companyId}/eventSubscriptions`
    }))
    .then((response) => {
      $scope.eventSubscriptions = _.sortBy(response.data, r => r.agent && r.agent.name);
    })
  }

  function defaultEventSubscription() {
    return {
      formatter: '0'
    }
  }

  var updatableSubscriptionFields = [
    'params', 'event', 'handler', 'formatter', 'agent'
  ]

  $scope.subscriptions = {
    add() {
      $scope.eventSubscriptions.push(defaultEventSubscription())
    },
    saveOne(subscr) {
      var promise;
      if (subscr.id) {
        promise = AdminService.beeline({
          method: 'PUT',
          url: `/companies/${companyId}/eventSubscriptions/${subscr.id}`,
          data: _.pick(subscr, updatableSubscriptionFields)
        })
      }
      else {
        promise = AdminService.beeline({
          method: 'POST',
          url: `/companies/${companyId}/eventSubscriptions`,
          data: _.pick(subscr, updatableSubscriptionFields)
        })
      }
      LoadingSpinner.watchPromise(promise);

      promise.then((response) => {
        _.assign(subscr, _.omit(response.data, ['createdAt', 'updatedAt']));

        // setPristine(true);
      })
      .catch((error) => {
        commonModals.alert(error.data.message)
      })
    },
    deleteOne(subscr) {
      if (subscr.id) {
        LoadingSpinner.watchPromise(AdminService.beeline({
          method: 'DELETE',
          url: `/companies/${companyId}/eventSubscriptions/${subscr.id}`
        }))
        .then(() => {
          $scope.eventSubscriptions.splice($scope.eventSubscriptions.indexOf(subscr), 1)
        })
        .catch(err => commonModals.alert(err.data.message))
      }
      else {
        $scope.eventSubscriptions.splice($scope.eventSubscriptions.indexOf(subscr), 1)
      }
    }
  }
}
