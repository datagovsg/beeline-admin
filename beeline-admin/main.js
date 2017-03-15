
angular.module('beeline-admin', [
  'uiGmapgoogle-maps', 'ui.router', 'ui.bootstrap',
  'angular-storage', 'angular-jwt', 'ngCookies', 'multipleDatePicker',
  'ui.select', 'ngTagEditor'])

global.moment = require('moment')

require('angular-storage')
require('angular-cookies')
require('angular-jwt')
require('multiple-date-picker')
require('ui-select/dist/select')
require('../ngTagEditor/ngTagEditor')
require('./controllers/promotionsController')
require('./controllers/promotionsListController')
require('./controllers/crowdstartSummary')
require('./directives/promoEditor/criterionEditor')
require('./directives/promoEditor/discountEditor')
require('./directives/crowdstartEditor/crowdstartEditor')

const env = require('./env')

angular.module('beeline-admin')
.service('auth', require('./auth0').default)
.config(require('./router').default)
.config(configureGoogleMaps)
.config(configureUrlWhitelist)
.directive('adminNav', require('./directives/adminNav/adminNav').default)
.directive('accountView', require('./directives/accountView/accountView').default)
.directive('paymentView', require('./directives/paymentView/paymentView').default)
.directive('ticketView', require('./directives/ticketView/ticketView').default)
.directive('routeEditor', require('./directives/routeEditor/routeEditor').default)
.directive('pathEditor', require('./directives/pathEditor/pathEditor').default)
.directive('tripsEditor', require('./directives/tripsEditor/tripsEditor').default)
.directive('tripInfoBroker', require('./directives/tripInfoBroker').default)
.directive('companyInfoBroker', require('./directives/companyInfoBroker').default)
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
.directive('eventSubscriptionEditor', require('./directives/eventSubscriptionEditor/eventSubscriptionEditor').default)
.directive('notificationMethodEditor', require('./directives/notificationMethod/notificationMethod').default)
.directive('expandableArea', require('./directives/expandableArea').default)
.directive('phDatePicker', require('./directives/phDatePicker').default)
.service('AdminService', require('./services/adminService').default)
.service('TripsService', require('./services/tripsService').default)
.service('RoutesService', require('./services/routesService').default)
.service('StopsPopup', require('./services/stopsPopup').default)
.service('RoutePopup', require('./services/routePopup').default)
.service('mapService', require('./services/mapService').default)
.service('companiesSvc', require('./services/companiesSvc').default)
.service('DriverService', require('./services/driverService').default)
.service('issueTicketModal', require('./services/issueTicketModal').default)
.service('issueRoutePassModal', require('./services/issueRoutePassModal').default)
.service('LoadingSpinner', require('./services/loadingSpinner').default)
.service('commonModals', require('./services/commonModals').default)
.service('TagsService', require('./services/tagsService').default)
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
.controller('notifications', require('./controllers/notificationsController.js').default)
.filter('makeRoutePath', require('./shared/filters.js').makeRoutePath)
.filter('intervalToTime', require('./shared/filters.js').intervalToTime)
.filter('leftPad', () => require('left-pad'))
// Handle what happens when the callback is called
// TODO: Use angular dependency injection to invoke the authenticateToken fn
.run(function ($rootScope, auth, store, $cookies, AdminService, jwtHelper, $state) {
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

  $rootScope.$on('$stateChangeStart', function($event, newState, newParams, oldState, oldParams) {
    authenticateToken(
      store.get('sessionToken'),
      store.get('refreshToken'),
      $event,
      newState, newParams,
      oldState, oldParams)
  });

  function authenticateToken(token, refreshToken, $event,
      newState, newParams, oldState, oldParams) {
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
        // Stop it from continuing to the page until we have successfully
        // authenticated...
        $event.preventDefault();

        // Refresh the token
        auth.refreshToken(refreshToken)
        .then((delegationResult) => {
          auth.authenticate(delegationResult.id_token);
          store.set('sessionToken', delegationResult.id_token)
          auth.getProfile().then((profile) => {
            store.set('profile', profile);
          })

          // Resume loading the page
          $state.go(newState.name, newParams)
        })
        // Continue
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
