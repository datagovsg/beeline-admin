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
  'angular-storage', 'angular-jwt', 'ngCookies', 'multipleDatePicker',
  'ui.select', 'ngTagEditor'])
.service('auth', require('./auth0').default)
.config(require('./router').default)
.config(configureGoogleMaps)
.config(configureUrlWhitelist)
.directive('adminNav', require('./directives/adminNav/adminNav').default)
.directive('accountView', require('./directives/accountView/accountView').default)
.directive('paymentView', require('./directives/paymentView/paymentView').default)
.directive('ticketView', require('./directives/ticketView/ticketView').default)
.directive('routeSelector', require('./directives/routeSelector/routeSelector').default)
.directive('routeEditor', require('./directives/routeEditor/routeEditor').default)
.directive('pathEditor', require('./directives/pathEditor/pathEditor').default)
.directive('tripsEditor', require('./directives/tripsEditor/tripsEditor').default)
.directive('tripSelectionBroker', require('./directives/tripSelector/tripSelectionBroker').default)
.directive('multiSelectBroker', require('./directives/multiSelectBroker').default)
.directive('companyLogo', require('./directives/companyLogo').default)
.directive('mySort', require('./directives/mySort').default)
.directive('spanSelect', require('./directives/spanSelect').default)
.directive('pingPath', require('./directives/pingPath').default)
/* Selectors */
.directive('tripStatusSelector', require('./directives/selectors/tripStatus').default)
.directive('stopSelector', require('./directives/selectors/stop').default)
.directive('stopSelectorPopup', require('./directives/selectors/stopPopup').default)
.directive('userSelector', require('./directives/selectors/user').default)
.directive('superAdminCompanySelector', require('./directives/selectors/superAdminCompany').default)
.directive('companySelector', require('./directives/selectors/company').default)
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
.service('commonModals', require('./services/commonModals').default)
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
// Handle what happens when the callback is called
// TODO: Use angular dependency injection to invoke the authenticateToken fn
.run(function ($rootScope, auth, store, $cookies, AdminService, jwtHelper) {
  if (auth.authResult) {
    if (auth.authResult.error) {
      return alert(auth.authResult.error_description);
    }
    store.set('sessionToken', auth.authResult.idToken)
    store.set('refreshToken', auth.authResult.refreshToken)
    $cookies.put('sessionToken', auth.authResult.idToken)
    auth.getProfile().then((profile) => {
      store.set('profile', profile);
    })
  }
  authenticateToken(store.get('sessionToken'), store.get('refreshToken'))

  $rootScope.$on('$locationChangeStart', function() {
    authenticateToken(store.get('sessionToken'), store.get('refreshToken'))
  });

  function authenticateToken(token, refreshToken) {
    if (token) {
      if (!jwtHelper.isTokenExpired(token)) {
        if (!auth.isAuthenticated) {
          auth.authenticate(token);
          auth.getProfile().then((profile) => {
            store.set('profile', profile);
          })
        }
        return;
      }

      if (refreshToken) {
        auth.refreshToken(refreshToken)
        .then((delegationResult) => {
          auth.authenticate(delegationResult.idToken);
          auth.getProfile().then((profile) => {
            store.set('profile', profile);
          })
        })
        .catch((err) => {
          AdminService.login();
        })
        return;
      }
    }
    AdminService.login();
  }
})

function configureGoogleMaps(uiGmapGoogleMapApiProvider) {
  uiGmapGoogleMapApiProvider.configure({
    key: 'AIzaSyBkFH42PlbFrsfdAnjw37qMLAxjhkMT-54',
    libraries: 'geometry',
  })
}

function configureUrlWhitelist($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist([
    'self',
    env.BACKEND_URL + '/**'
  ])
}
