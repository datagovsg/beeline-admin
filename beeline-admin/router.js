
export default function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('default', {
    url: '/',
    template: '',
    data: {
      requiresLogin: false,
    }
  })

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    data: {
      requiresLogin: false,
    },
    controller: 'login',
  })

  .state('transactions', {
    url: '/transactions',
    templateUrl: 'templates/transactions.html',
    controller: 'transactions',
    data: {
      requiresLogin: true,
    }
  })

  .state('routes', {
    url: '/routes/{routeId:int}/{action}',
    templateUrl: 'templates/routes.html',
    controller: 'routes',
    data: {
      requiresLogin: true,
    }
  })

  .state('summary', {
    url: '/summary',
    templateUrl: 'templates/summary.html',
    controller: 'summary',
    data: {
      requiresLogin: true,
    }
  })

  .state('bookings', {
    url: '/bookings',
    templateUrl: 'templates/bookings-wrs.html',
    controller: 'bookingsWrs',
    data: {
      requiresLogin: true,
    }
  })


  .state('test', {
    url: '/test',
    templateUrl: 'templates/test.html',
    controller: function ($scope) {
    },
    data: {
      requiresLogin: true,
    }
  })
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/');

}