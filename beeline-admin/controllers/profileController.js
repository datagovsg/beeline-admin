import querystring from 'querystring';
import _ from 'lodash';

export default function ($scope, AdminService, LoadingSpinner, commonModals) {
  var adminId;

  whoami();
  requery();

  ////// Data declarations
  $scope.disp = {
    notificationMethods: [
      'telegram', 'email', 'sms'
    ],
    eventTypes: [
      'lifecycle', 'transactionFailure', 'newBooking', 'urgentBooking', 'noPings'
    ]
  }
  $scope.eventSubscriptions = [];

  ////// Function declarations
  async function requery() {
    await LoadingSpinner.watchPromise(AdminService.whoami())
    .then((profile) => {
      adminId = profile.adminId;
    })
    if (adminId) {
      LoadingSpinner.watchPromise(AdminService.beeline({
        url: `/admins/${adminId}`
      }))
      .then((response) => {
        $scope.data = response.data;
      });

      LoadingSpinner.watchPromise(AdminService.beeline({
        url: `/admins/${adminId}/eventSubscriptions`
      }))
      .then((response) => {
        $scope.eventSubscriptions = response.data;
      })
    }
  }
  function whoami() {
    LoadingSpinner.watchPromise(AdminService.beeline({
      url: `/admins/whoami`
    }))
    .then((response) => {
      adminId = response.data.adminId;
    });
  }
  function defaultEventSubscription() {
    return {
      formatter: '0'
    }
  }

  var updatableFields = [
    'name', 'email', 'telephone', 'notes'
  ]
  var updatableSubscriptionFields = [
    'params', 'event', 'handler', 'formatter'
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
          url: `/admins/${adminId}/eventSubscriptions/${subscr.id}`,
          data: _.pick(subscr, updatableSubscriptionFields)
        })
      }
      else {
        promise = AdminService.beeline({
          method: 'POST',
          url: `/admins/${adminId}/eventSubscriptions`,
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
          url: `/admins/${adminId}/eventSubscriptions/${subscr.id}`
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

  $scope.saveProfile = function () {
    if (adminId) {
      LoadingSpinner.watchPromise(AdminService.beeline({
        method: 'PUT',
        url: `/admins/${adminId}`,
        data: _.pick($scope.data, updatableFields)
      }))
      .then(requery)
      .catch((err) => {
        commonModals.alert(err.data.message);
      });
    }
    else {
      LoadingSpinner.watchPromise(AdminService.beeline({
        method: 'POST',
        url: `/admins`,
        data: _.pick($scope.data, updatableFields)
      }))
      .then((response) => {
        adminId = response.data.id;
        requery();
      })
      .catch((err) => {
        commonModals.alert(err.data.message);
      });
    }
  }
}
