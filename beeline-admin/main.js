
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
require('./controllers/bookingsControllerWrs.js')
require('./controllers/genericVuePageController.js')
require('./controllers/usersController.js')
require('./controllers/routePassesController.js')
require('./controllers/promotionsController')
require('./controllers/contactListController')
require('./controllers/crowdstartSummary')
require('./services/uibModalPromise')
require('./services/issueRouteCreditsModal')
require('./services/expireRouteCreditsModal')
require('./stores/vueStore')
require('./directives/vue-page')
require('./directives/percentInput')
require('./directives/selectors/contactList')
require('./directives/selectors/route2')
require('./directives/routePassHistoryViewer/routePassHistoryViewer')
require('./auth0')
require('./router')

const configureGoogleMaps = ['uiGmapGoogleMapApiProvider', function (uiGmapGoogleMapApiProvider) {
  uiGmapGoogleMapApiProvider.configure({
    key: 'AIzaSyBkFH42PlbFrsfdAnjw37qMLAxjhkMT-54',
    libraries: 'geometry',
  })
}]

const configureUrlWhitelist = ['$sceDelegateProvider', function ($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist([
    'self',
    process.env.BACKEND_URL + '/**'
  ])
}]

angular.module('beeline-admin')
.config(configureGoogleMaps)
.config(configureUrlWhitelist)
.directive('adminNav', require('./directives/adminNav/adminNav').default)
.directive('accountView', require('./directives/accountView/accountView').default)
.directive('paymentView', require('./directives/paymentView/paymentView').default)
.directive('ticketView', require('./directives/ticketView/ticketView').default)
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
.service('DriverService', require('./services/driverService').default)
.service('issueTicketModal', require('./services/issueTicketModal').default)
.service('LoadingSpinner', require('./services/loadingSpinner').default)
.service('commonModals', require('./services/commonModals').default)
.service('TagsService', require('./services/tagsService').default)
.controller('transactions', require('./controllers/transactionsController.js').default)
.controller('trips', require('./controllers/tripsController.js').default)
.controller('companies', require('./controllers/companiesController.js').default)
.controller('notifications', require('./controllers/notificationsController.js').default)
.filter('makeRoutePath', require('./shared/filters.js').makeRoutePath)
.filter('intervalToTime', require('./shared/filters.js').intervalToTime)
.filter('leftPad', () => require('left-pad'))
.run([
  '$rootScope', 'auth', 'store', '$cookies', 'AdminService', 'jwtHelper', '$state', 'commonModals',
  function ($rootScope, auth, store, $cookies, AdminService, jwtHelper, $state, commonModals) {
  let initialized = false

  $rootScope.$on('$stateChangeStart', [
    '$event', 'newState', 'newParams', 'oldState', 'oldParams',
    function($event, newState, newParams, oldState, oldParams) {
    // We pause the state change when
    // 1. Auth is not yet initialized. Initialization comprises two steps:
    //    a) Fetching the domain & CID
    //    b) Parsing the hash for the login token
    //
    //    .run() functions are run immediately on page load. We
    //    need to pause any state change until (a) is complete, so that
    //    we can decide whether the user is visitng the page for the first time,
    //    or if the user has just been redirected back.
    //
    // 2. Refresh token needs to be used.
    pauseStateChange($event, newState, newParams,
      initialized
        ? checkStorageToken()
        : handleRedirect().then(checkStorageToken)
    )
  }]);

  Promise.resolve(checkStorageToken()).catch(() => {})
  handleRedirect()

  function storeSessionToken({ idToken }) {
    store.set('sessionToken', idToken)
    auth.getProfile().then((profile) => {
      store.set('profile', profile);
    })
  }

  // If promise is a Promise, pause the state change until it's resolved
  // else change the state immediately
  function pauseStateChange($event, newState, newParams, promise) {
    if (promise) {
      $event.preventDefault();

      promise.then(() => {
        $state.go(newState.name, newParams)
      })
      .catch((preventLogin) => {
        if (!preventLogin) {
          auth.showLoginDialog()
            .then(storeSessionToken)
            .finally(() => window.location.reload())
        }
      })
    } else {
      return Promise.resolve(null)
    }
  }

  // Handle when the user is redirected back to the page
  function handleRedirect () {
    return auth.domainPromise.then(({authResult}) => {
      // Check if user was redirected from the login screen
      // If redirected, authResult is set to the login result
      // Else it will be null
      initialized = true;

      if (authResult) {
        if (authResult.error) {
          return commonModals.alert(authResult.errorDescription)
        } else {
          store.set('sessionToken', authResult.idToken)
          $cookies.put('sessionToken', authResult.idToken)
          auth.getProfile().then((profile) => {
            store.set('profile', profile);
          })
        }

        if (authResult.state) {
          window.location.hash = authResult.state
          return Promise.reject(true) // true to preventLogin
        }
      }
    })
  }

  /**
   * Check the storage token, refreshes the token if necessary
   *
   * The output of this is passed to pauseStateChange.
   * Therefore if no pausing is required (i.e. auth looks ok) then
   * return a falsy value.
   *
   * If pausing is required, return a Promise that resolves when auth is complete.
   */
  function checkStorageToken() {
    const idToken = store.get('sessionToken')

    if (idToken) {
      if (!jwtHelper.isTokenExpired(idToken)) {
        if (!auth.isAuthenticated) {
          auth.authenticate({ idToken });
          auth.getProfile().then((profile) => {
            store.set('profile', profile);
          })
        }
        return null
      } else {
        return auth.refreshToken()
          .then(storeSessionToken)
      }
    } else {
      return Promise.reject(null)
    }
  }
}])
