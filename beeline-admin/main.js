//require css for webpack
// require('../node_modules/bootstrap/dist/css/bootstrap.min.css');
// require('../scss/ionic.app.scss');
global.moment = require('moment')

require('beeline-calendar')
require('angular-storage')
require('angular-cookies')
require('angular-jwt')
require('auth0-angular')
require('multiple-date-picker')
require('ui-select/dist/select')

const env = require('./env')


// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('beeline-admin', [
  'uiGmapgoogle-maps', 'ui.router', 'ui.bootstrap', 'beeline.calendar',
  'auth0', 'angular-storage', 'angular-jwt', 'ngCookies', 'multipleDatePicker',
  'ui.select'])
.config(require('./router').default)
.config(configureGoogleMaps)
.config(configureLoginPage)
.config(configureUrlWhitelist)
.directive('adminNav', require('./directives/adminNav/adminNav').default)
.directive('accountView', require('./directives/accountView/accountView').default)
.directive('paymentView', require('./directives/paymentView/paymentView').default)
.directive('ticketView', require('./directives/ticketView/ticketView').default)
.directive('routeSelector', require('./directives/routeSelector/routeSelector').default)
.directive('routeEditor', require('./directives/routeEditor/routeEditor').default)
.directive('pathEditor', require('./directives/pathEditor/pathEditor').default)
.directive('tripsEditor', require('./directives/tripsEditor/tripsEditor').default)
.directive('companySelector', require('./directives/companySelector/companySelector').default)
.directive('tripSelector', require('./directives/tripSelector/tripSelector').default)
.directive('stopSelector', require('./directives/stopSelector/stopSelector').default)
.directive('superAdminCompanySelector', require('./directives/companySelector/superAdminCompanySelector').default)
.directive('mySort', require('./directives/mySort').default)
.directive('spanSelect', require('./directives/spanSelect').default)
.directive('userSelector', require('./directives/userSelector/userSelector').default)
.service('AdminService', require('./services/adminService').default)
.service('TripsService', require('./services/tripsService').default)
.service('RoutesService', require('./services/routesService').default)
.service('StopsPopup', require('./services/stopsPopup').default)
.service('RoutePopup', require('./services/routePopup').default)
.service('mapService', require('./services/mapService').default)
.service('DriverService', require('./services/driverService').default)
.service('issueTicketModal', require('./services/issueTicketModal').default)
.service('LoadingSpinner', require('./services/loadingSpinner').default)
.controller('transactions', require('./controllers/transactionsController.js').default)
.controller('trips', require('./controllers/tripsController.js').default)
.controller('routes', require('./controllers/routesController.js').default)
.controller('summary', require('./controllers/summaryController.js').default)
.controller('bookings', require('./controllers/bookingsController.js').default)
.controller('bookingsWrs', require('./controllers/bookingsControllerWrs.js').default)
.controller('drivers', require('./controllers/driversController.js').default)
.controller('login', require('./controllers/loginController.js').default)
.controller('companies', require('./controllers/companiesController.js').default)
.controller('assets', require('./controllers/assetsController.js').default)
.filter('makeRoutePath', require('./shared/filters.js').makeRoutePath)
.filter('intervalToTime', require('./shared/filters.js').intervalToTime)
.run(function (auth, $rootScope, store, jwtHelper, $window, AdminService) {
  auth.hookEvents();

  // This events gets triggered on refresh or URL change
  $rootScope.$on('$locationChangeStart', function() {
    var token = store.get('sessionToken');
    if (token) {
      if (!jwtHelper.isTokenExpired(token)) {
        if (!auth.isAuthenticated) {
          auth.authenticate(store.get('profile'), token);
        }
      } else {
        AdminService.login();
        // Either show Login page or use the refresh token to get a new idToken
      }
    }
  });

  // Unfortunately the auth0 library does not handle redirect errors!
  // WTF!
  // For redirect mode
  var notifiedLoginError = false;
  $rootScope.$on('$locationChangeStart', function() {
    if (notifiedLoginError) return;

    // decode and try to trap authentication errors
    try {
      var hash = $window.location.hash.substr(1);
      if (hash.startsWith('/')) {
        hash = hash.substr(1);
      }
      if (!hash)
        return;

      var bits = hash.split('&').map(b => b.split('='))
      bits = _.keyBy(bits, b => b[0])
      bits = _.mapValues(bits, v => decodeURIComponent(v[1]))

      if (bits.error) {
        auth.signout()
        alert(
      `${bits.error}

${bits.error_description}`
        );
      }

      // Because we only need this handler when there's
      // a failure after redirect, after checking at the start
      // of page load, we don't need this handler any more.
      notifiedLoginError = true;
    } catch (error) {
    }
  });
})


function configureGoogleMaps(uiGmapGoogleMapApiProvider) {
  uiGmapGoogleMapApiProvider.configure({
    key: 'AIzaSyBkFH42PlbFrsfdAnjw37qMLAxjhkMT-54'
  })
}

function configureLoginPage(authProvider) {
  authProvider.on('loginFailure', function(error) {
    alert(
`${error.error}

${error.error_description}`
    );
    console.log(error)
    // $location.path('/login');
  });

  authProvider.on('authenticated', function($location, idToken, profilePromise,
    jwtHelper, $cookies) {
    console.log('I am authenticated')
    console.log(jwtHelper.decodeToken(idToken))
    $cookies.put('sessionToken', idToken)
  })

  authProvider.on('loginSuccess', function($location, profilePromise,
    jwtHelper, idToken, store, AdminService, auth, $cookies) {
    console.log("Login Success");
    console.log(jwtHelper.decodeToken(idToken))
    store.set('sessionToken', idToken)
    $cookies.put('sessionToken', idToken)

    profilePromise.then((p) =>{
      console.log(p)
      store.set('profile', p)
    })
  })
}

function configureUrlWhitelist($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist([
    'self',
    env.BACKEND_URL + '/**'
  ])
}
