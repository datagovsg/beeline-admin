//require css for webpack
// require('../node_modules/bootstrap/dist/css/bootstrap.min.css');
// require('../scss/ionic.app.scss');
global.moment = require('moment')

require('beeline-calendar')
require('angular-storage')
require('angular-cookies')
require('angular-jwt')
require('multiple-date-picker')
require('ui-select/dist/select')
require('../ngTagEditor/ngTagEditor')

const env = require('./env')


// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('beeline-admin', [
  'uiGmapgoogle-maps', 'ui.router', 'ui.bootstrap', 'beeline.calendar',
  'auth0', 'angular-storage', 'angular-jwt', 'ngCookies', 'multipleDatePicker',
  'ui.select', 'ngTagEditor'])
.config(require('./router').default)
.config(configureGoogleMaps)
.config(configureUrlWhitelist)
.config(configureAuth0)
.directive('adminNav', require('./directives/adminNav/adminNav').default)
.directive('accountView', require('./directives/accountView/accountView').default)
.directive('paymentView', require('./directives/paymentView/paymentView').default)
.directive('ticketView', require('./directives/ticketView/ticketView').default)
.directive('routeSelector', require('./directives/routeSelector/routeSelector').default)
.directive('routeEditor', require('./directives/routeEditor/routeEditor').default)
.directive('pathEditor', require('./directives/pathEditor/pathEditor').default)
.directive('tripStatusSelector', require('./directives/tripsEditor/tripStatusSelector').default)
.directive('tripsEditor', require('./directives/tripsEditor/tripsEditor').default)
.directive('companySelector', require('./directives/companySelector/companySelector').default)
.directive('tripSelector', require('./directives/tripSelector/tripSelector').default)
.directive('stopSelector', require('./directives/stopSelector/stopSelector').default)
.directive('superAdminCompanySelector', require('./directives/companySelector/superAdminCompanySelector').default)
.directive('mySort', require('./directives/mySort').default)
.directive('spanSelect', require('./directives/spanSelect').default)
.directive('userSelector', require('./directives/userSelector/userSelector').default)
.directive('pingPath', require('./directives/pingPath').default)
.service('AdminService', require('./services/adminService').default)
.service('TripsService', require('./services/tripsService').default)
.service('RoutesService', require('./services/routesService').default)
.service('StopsPopup', require('./services/stopsPopup').default)
.service('RoutePopup', require('./services/routePopup').default)
.service('mapService', require('./services/mapService').default)
.service('companiesSvc', require('./services/companiesSvc').default)
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
.controller('admins', require('./controllers/adminsController.js').default)
.filter('makeRoutePath', require('./shared/filters.js').makeRoutePath)
.filter('intervalToTime', require('./shared/filters.js').intervalToTime)
.run(function (auth, $rootScope, store, jwtHelper, $window, AdminService) {
  auth.hookEvents();

  // Handle the case when Auth0 login fails
  if (window.location.hash.startsWith('#/')) {
    try {
      let parts = _(window.location.hash.substr(2).split('&'))
        .map(keyvalue => keyvalue.split('='))
        .keyBy(keyvalue => keyvalue[0])
        .mapValues(keyvalue => decodeURIComponent(keyvalue[1]))
        .value()

      if (parts.error) {
        alert(`${parts.error} - ${parts.error_description}`)
      }
    }
    catch (err) {
      console.log(err)
    }
  }


  $rootScope.$on('$locationChangeStart', function() {
    var token = store.get('sessionToken');
    if (token) {
      if (!jwtHelper.isTokenExpired(token)) {
        if (!auth.isAuthenticated) {
          //Re-authenticate user if token is valid
          auth.authenticate(store.get('profile'), token);
        }
      } else {
        // Either show the login page or use the refresh token to get a new idToken
        AdminService.login();
      }
    }
  });
})


function configureGoogleMaps(uiGmapGoogleMapApiProvider) {
  uiGmapGoogleMapApiProvider.configure({
    key: 'AIzaSyBkFH42PlbFrsfdAnjw37qMLAxjhkMT-54',
    libraries: 'geometry',
  })
}

function configureAuth0(authProvider) {
  authProvider.init({
    domain: env.AUTH0_DOMAIN,
    clientID: env.AUTH0_CID,
    loginUrl: '/login'
  })

  authProvider.on('authenticated', function ($location, idToken, profilePromise,
    jwtHelper, $cookies) {


      console.log('authenticated!')
  })

  authProvider.on('loginFailure', function ($location, error) {
    alert(error);
  })

  authProvider.on('loginSuccess', function($location, profilePromise,
    jwtHelper, idToken, store, AdminService, auth, $cookies) {
    console.log("Login Success");
    console.log(jwtHelper.decodeToken(idToken))
    store.set('sessionToken', idToken)
    $cookies.put('sessionToken', idToken)

    profilePromise.then((p) =>{
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
