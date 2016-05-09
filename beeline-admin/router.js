
export default function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
  .state('transactions', {
    url: '/transactions',
    templateUrl: 'templates/transactions.html',
    controller: 'transactions',
  })

  // setup an abstract state for the tabs directive
  .state('routes', {
    url: '/routes',
    templateUrl: 'templates/routes.html',
    controller: 'routes',
  })

  .state('summary', {
    url: '/summary',
    templateUrl: 'templates/summary.html',
    controller: 'summary',
  })

  .state('bookings', {
    url: '/bookings',
    templateUrl: 'templates/bookings.html',
    controller: 'bookings',
  })
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/transactions');

}
