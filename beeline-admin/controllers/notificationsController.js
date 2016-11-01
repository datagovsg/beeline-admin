import querystring from 'querystring';
import _ from 'lodash';

export default function ($scope, AdminService, LoadingSpinner, commonModals, companyId) {
  requery();

  ////// Data declarations
  $scope.disp = {
    eventTypes: [
      // ['noPings', 'Driver App not switched on'],
      // ['tripCancelled', 'Trip cancelled by driver'],
      // ['passengersMessaged', 'Message broadcast to passengers'],
      // ['newBooking', 'New booking made'],
      // ['urgentBooking', 'Last minute booking made'],
      // ['lateETA', 'Bus predicted to arrive late'],
      // ['lateArrival', 'Bus arrives late at destination'],
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
      $scope.subscriptions = RouteNotifications.parse($scope.eventSubscriptions);
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

  $scope.routeSubscriptions = {
    add() {
      $scope.subscriptions.push({
        agent: {},
        events: {},
        handler: '',
        options: {},
        ids: []
      })
    },
    saveOne(subscr) {
      var newEntries = RouteNotifications.serialize(subscr);

      // insert the new entries, then delete the old ones
      LoadingSpinner.watchPromise(Promise.all(newEntries.map(ne =>
        AdminService.beeline({
          method: 'POST',
          url: `/companies/${companyId}/eventSubscriptions`,
          data: ne
        })
      ))
      .then((responses) => {
        _.zip(newEntries, responses).forEach(([entry, response]) => {
          entry.id = response.data.id;
        })

        $scope.subscriptions.splice(
          $scope.subscriptions.indexOf(subscr), 1,
          RouteNotifications.parse(responses.map(r => r.data))[0]
        )

        return Promise.all(_.uniqBy(subscr.ids).map(id =>
          AdminService.beeline({
            method: 'DELETE',
            url: `/companies/${companyId}/eventSubscriptions/${id}`
          })))
          .then(() => $scope.$digest())
      }))
    },
    deleteOne(subscr) {
      if (subscr.ids) {
        LoadingSpinner.watchPromise(Promise.all(_.uniqBy(subscr.ids).map(id =>
          AdminService.beeline({
            method: 'DELETE',
            url: `/companies/${companyId}/eventSubscriptions/${id}`
          }))))
        .then(() => {
          $scope.subscriptions.splice($scope.subscriptions.indexOf(subscr), 1)
        })
        .then(() => $scope.$digest())
        .catch(err => commonModals.alert(err.data.message))
      }
      else {
        $scope.subscriptions.splice($scope.subscriptions.indexOf(subscr), 1)
      }
    }
  }

  $scope.subscriptionMethods = {
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

const events = {
  newBooking: {
    event: 'newBooking',
  },
  noPings5: {
    event: 'noPings',
    defaultParams: {
      minsBefore: [5],
    }
  },
  noPings15: {
    event: 'noPings',
    defaultParams: {
      minsBefore: [15],
    }
  },
  noPings25: {
    event: 'noPings',
    defaultParams: {
      minsBefore: [25],
    }
  },
  lateArrival: {
    event: 'lateArrival',
    defaultParams: {
      timeAfter: [10*60000],
    }
  },
  lateETA: {
    event: 'lateETA',
    defaultParams: {
      timeAfter: [10*60000],
    }
  },
  passengersMessaged: {
    event: 'passengersMessaged',
  },
  tripCancelled: {
    event: 'tripCancelled',
  },
}

const RouteNotifications = {
  // Convert from human-unreadable database entries
  // to a human-summarizable entries
  parse(eventSubscriptions) {
    var relevantKeys = _(events).values().map(e => e.event).keyBy().value();

    var groupedByRoutes = _(eventSubscriptions)
      .filter(e => e.event in relevantKeys)
      .groupBy(e => {
        return _.sortBy(e.params.routeIds || []).join(',') + '|' +
          e.params.ignoreIfEmpty + '|' +
          e.handler + '|' +
          JSON.stringify(e.agent) // FIXME: this is not guaranteed to work reliably?
      })
      .mapValues((es, g) => {
        const ev = _(events).keys().map((key) => {
          function satisfiesEvent(e, eventConditions) {
            // Ensure that array keys are superset of the same
            // key in e

            return e.event == eventConditions.event &&
              _.keys(eventConditions.defaultParams)
              .filter(k => eventConditions.defaultParams[k] instanceof Array)
              .every(k => _.intersection(eventConditions.defaultParams[k], e.params[k]).length
                == eventConditions.defaultParams[k].length)
          }

          // Check if this key applies to some of the event subscriptions
          return [key,
            es.find(e => satisfiesEvent(e, events[key]))
          ]
        }).fromPairs().value()

        return {
          options: _(es[0].params)
            .pick(['routeIds', 'ignoreIfEmpty'])
            .filter(v => v !== undefined)
            .value(), /* no undefined route ids */
          handler: es[0].handler,
          agent: es[0].agent,
          events: _.mapValues(ev, e => !!e),
          ids: _(ev).mapValues(e => e && e.id).filter(x => x).value(),
        }
      })
      .values()
      .value();

    return groupedByRoutes
  },

  serialize(subscription) {
    var eventSubscriptions = _.keys(subscription.events)
      .filter(key => subscription.events[key])
      .map(key => ({
        event: events[key].event,
        formatter: '0',
        params: _.defaults(events[key].defaultParams,
            subscription.options),
        agent: subscription.agent,
        handler: subscription.handler,
        id: subscription.ids && subscription.ids[key]
      }))
    var mergedSubscriptions = _(eventSubscriptions)
      .groupBy('event')
       // merge the array-valued params
      .mapValues(vs => {
        return _.reduce(vs, (acc, v) => {
          if (acc == null) {
            return v;
          } else {
            // merge array-valued params
            var params = _.defaults(acc.params, v.params);

            for (let key in acc.params) {
              if (acc.params[key] instanceof Array &&
                    v.params[key] instanceof Array) {
                acc.params[key] = acc.params[key].concat(v.params[key])
              }
            }
            acc.params = params

            return acc;
          }
        }, null);
      })
      .values()
      .value()

      return mergedSubscriptions;
  }
}
