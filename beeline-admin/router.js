
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
    url: '/transactions?transactionId&ticketId',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'TransactionsPage',
    },
  })

  .state('c.routes', {
    url: '/routes',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'RoutesPage',
    }
  })

  .state('c.extendRoutes', {
    url: '/extend_routes',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'ExtendRoutesPage',
    }
  })

  .state('c.companies', {
    url: '/companies',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'CompaniesPage',
    }
  })
  .state('assets', {
    url: '/assets',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'AssetsPage',
    }
  })
  .state('c.admins', {
    url: '/admins',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'AdminsPage',
    }
  })

  .state('c.trips', {
    url: '/trips/{routeId:int}/{action}',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'RoutePage',
    }
  })

  .state('c.summary', {
    url: '/summary',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'SummaryPage',
    }
  })

  .state('c.bookings', {
    url: '/bookings?routeId&tripId&userId',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'BookingsPage',
    }
  })

  .state('c.driver', {
    url: '/drivers',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'DriversPage',
    }
  })

  .state('c.crowdstart-summary', {
    url: '/crowdstart-summary',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'CrowdstartSummaryPage',
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
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'PromotionPage',
    }
  })

  .state('c.promotions-list', {
    url: '/promotions',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'PromotionsPage'
    }
  })

  .state('c.contact-lists', {
    url: '/contactLists',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'ContactListsPage',
    }
  })

  .state('c.contact-list', {
    url: '/contactLists/{contactListId}',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'ContactListPage',
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
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'RoutePassesPage',
    }
  })

  .state('c.route-timeliness', {
    url: '/route-timeliness',
    templateUrl: 'templates/generic-vue-page.html',
    controller: 'genericVuePageController',
    data: {
      requiresLogin: true,
      page: 'RouteTimelinessPage',
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
      return '/c//bookings'
    } else {
      auth.authResultPromise.then(() => {
        if (!auth.redirectRequired) { // No redirect required **by the authenticator**
          redirect()
        }
        /* If redirect is required, it will be handled
            by the code in $rootScope.$on('$stateChangeStart')
            so we're done
        */
      })
    }
  });
})
