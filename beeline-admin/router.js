
angular.module('beeline-admin')
.config(function ($stateProvider, $urlRouterProvider, authProvider, $locationProvider) {
  $locationProvider.hashPrefix('')


  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
  .state('c', {
    url: '/c/:companyId',
    template: '<ui-view></ui-view>',
    controller(AdminService, $stateParams) {
      AdminService.actingCompany = $stateParams.companyId ?
        parseInt($stateParams.companyId) : null;
    },
    resolve: {
      companyId($stateParams) {
        return $stateParams.companyId ?
          parseInt($stateParams.companyId) : null;
      }
    }
  })

  .state('c.transactions', {
    url: '/transactions?id&ticketId',
    templateUrl: 'templates/transactions.html',
    controller: 'transactions',
    data: {
      requiresLogin: true,
    },
  })

  .state('c.routes', {
    url: '/routes',
    templateUrl: 'templates/routes.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
    }
  })

  .state('c.extendRoutes', {
    url: '/extend_routes',
    templateUrl: 'templates/extend-routes.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
    }
  })

  .state('c.companies', {
    url: '/companies',
    templateUrl: 'templates/companies.html',
    controller: 'companies',
    data: {
      requiresLogin: true,
    }
  })
  .state('assets', {
    url: '/assets',
    templateUrl: 'templates/assets.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
    }
  })
  .state('c.admins', {
    url: '/admins',
    templateUrl: 'templates/admins.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
    }
  })

  .state('c.trips', {
    url: '/trips/{routeId:int}/{action}',
    templateUrl: 'templates/trips.html',
    controller: 'trips',
    data: {
      requiresLogin: true,
    }
  })

  .state('c.summary', {
    url: '/summary',
    templateUrl: 'templates/summary.html',
    controller: 'summary',
    data: {
      requiresLogin: true,
    }
  })

  .state('c.bookings', {
    url: '/bookings?routeId&tripId&userId',
    templateUrl: 'templates/bookings-wrs.html',
    controller: 'bookingsWrs',
    data: {
      requiresLogin: true,
    }
  })

  .state('c.driver', {
    url: '/drivers',
    templateUrl: 'templates/drivers.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
    }
  })

  .state('c.crowdstart-summary', {
    url: '/crowdstart-summary',
    templateUrl: 'templates/crowdstart-summary.html',
    controller: 'CrowdstartSummaryCtrl',
    data: {
      requiresLogin: true,
    }
  })
  .state('c.test', {
    url: '/test',
    templateUrl: 'templates/test.html',
    controller: function ($scope) {
    },
    data: {
      requiresLogin: true,
    }
  })

  .state('c.promotions', {
    url: '/promotions/{promoId}',
    templateUrl: 'templates/promotions.html',
    controller: 'promotionsController',
    data: {
      requiresLogin: true,
    }
  })

  .state('c.promotions-list', {
    url: '/promotions',
    templateUrl: 'templates/promotions-list.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
    }
  })

  .state('c.contact-lists', {
    url: '/contactLists',
    templateUrl: 'templates/contact-lists.html',
    controller: 'contactListsController',
    data: {
      requiresLogin: true,
    }
  })

  .state('c.contact-list', {
    url: '/contactLists/{contactListId}',
    templateUrl: 'templates/contact-list.html',
    controller: 'contactListController',
    data: {
      requiresLogin: true,
    }
  })

  .state('c.notifications', {
    url: '/notifications',
    templateUrl: 'templates/notifications.html',
    controller: 'notifications',
    data: {
      requiresLogin: true,
    }
  })

  .state('c.users', {
    url: '/users/{userId}',
    templateUrl: 'templates/users.html',
    controller: 'usersController',
    data: {
      requiresLogin: true,
    }
  })

  .state('c.route-passes', {
    url: '/route-passes?userId',
    templateUrl: 'templates/route-passes.html',
    controller: 'routePassesController',
    data: {
      requiresLogin: true,
    }
  })

  .state('c.route-timeliness', {
    url: '/route-timeliness',
    templateUrl: 'templates/route-timeliness.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
    }
  })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise(function ($injector, $location) {
    const auth = $injector.get('auth')

    function redirect() {
      window.location.hash = '#/c//bookings'
    }

    // We should not do anything if auth has not been initialized,
    // because the hash has not been parsed
    if (auth.initialized) {
      redirect()
    } else {
      auth.authResultPromise.then(() => {
        if (!auth.redirectRequired) { // No redirect required **by the authenticator**
          redirect()
        }
      })
    }
  });
})
