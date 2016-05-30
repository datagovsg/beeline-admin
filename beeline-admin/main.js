//require css for webpack
require('../node_modules/bootstrap/dist/css/bootstrap.min.css');
require('../scss/ionic.app.scss');

require('beeline-calendar')
require('angular-storage')
require('angular-jwt')
require('auth0-angular')

const env = require('./env')


// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('beeline-admin', [
  'uiGmapgoogle-maps', 'ui.router', 'ui.bootstrap', 'beeline.calendar',
  'auth0', 'angular-storage', 'angular-jwt'])
.config(require('./router').default)
.config(configureGoogleMaps)
.config(configureLoginPage)
.directive('adminNav', require('./directives/adminNav/adminNav').default)
.directive('accountView', require('./directives/accountView/accountView').default)
.directive('paymentView', require('./directives/paymentView/paymentView').default)
.directive('ticketView', require('./directives/ticketView/ticketView').default)
.directive('routeSelector', require('./directives/routeSelector/routeSelector').default)
.directive('routeEditor', require('./directives/routeEditor/routeEditor').default)
.directive('pathEditor', require('./directives/pathEditor/pathEditor').default)
.directive('tripsEditor', require('./directives/tripsEditor/tripsEditor').default)
.directive('companySelector', require('./directives/companySelector/companySelector').default)
.directive('stopSelector', require('./directives/stopSelector/stopSelector').default)
.directive('superAdminCompanySelector', require('./directives/companySelector/superAdminCompanySelector').default)
.service('AdminService', require('./services/adminService').default)
.service('RoutesService', require('./services/routesService').default)
.service('StopsPopup', require('./services/stopsPopup').default)
.service('mapService', require('./services/mapService').default)
.service('DriverService', require('./services/driverService').default)
.controller('transactions', require('./controllers/transactionsController.js').default)
.controller('routes', require('./controllers/routesController.js').default)
.controller('summary', require('./controllers/summaryController.js').default)
.controller('bookings', require('./controllers/bookingsController.js').default)
.controller('login', require('./controllers/loginController.js').default)
.filter('makeRoutePath', require('./shared/filters.js').makeRoutePath)
.run(function (auth, $rootScope, store, jwtHelper) {
  auth.hookEvents();

  // This events gets triggered on refresh or URL change
  $rootScope.$on('$locationChangeStart', function() {
    var token = store.get('token');
    if (token) {
      if (!jwtHelper.isTokenExpired(token)) {
        if (!auth.isAuthenticated) {
          auth.authenticate(store.get('profile'), token);
        }
      } else {
        // Either show Login page or use the refresh token to get a new idToken
      }
    }
  });
})


function configureGoogleMaps(uiGmapGoogleMapApiProvider) {
  uiGmapGoogleMapApiProvider.configure({
    key: 'AIzaSyBkFH42PlbFrsfdAnjw37qMLAxjhkMT-54'
  })


}

function configureLoginPage(authProvider) {
  authProvider.init({
    domain: env.AUTH0_DOMAIN,
    clientId: env.AUTH0_CID,
    loginState: 'login',
  })

  authProvider.on('authenticated', function($location) {
    console.log('I am authenticated')
  })

  authProvider.on('loginSuccess', function($location, profilePromise, idToken, store, AdminService, auth) {
    console.log("Login Success");
    store.set('token', idToken)
    AdminService.beeline({
      method: 'POST',
      url: '/admins/auth/login',
      data: {
        token: idToken,
      },
    })
    .then((response) => {
      console.log(response)
      store.set('sessionToken', response.data.sessionToken)
    })
    .then(null, (error) => {
      auth.signout()
      store.remove('sessionToken')
      store.remove('profile')
      console.log(error)
      alert(error.data.error + ' ' + error.data.message)
    })

    profilePromise.then((p) =>{
      console.log(p)
      store.set('profile', p)
    })
    $location.path('/');
  })

  authProvider.on('loginFailure', function() {
    console.log("Error logging in");
    $location.path('/login');
  });
}
