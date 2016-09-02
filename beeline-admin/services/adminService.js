import assert from 'assert'
const env = require('../env.json')

function b64_to_utf8(str) {
    return decodeURIComponent(unescape(window.atob(str)));
}

function decodeToken(tk) {
  var [a,b,c] = tk.split('.')

  return b64_to_utf8(b);
}

export default function ($http, $location, store, jwtHelper, auth, commonModals) {

  this.serverUrl = () => env.BACKEND_URL;

  this.beeline = function(options) {
    options.url = env.BACKEND_URL + options.url

    if (store.get('sessionToken')) {
      options.headers = options.headers || {};
      options.headers.authorization = 'Bearer ' + store.get('sessionToken');
    }

    return $http(options);
  }

  this.logout = function() {
    auth.signout();
    store.remove('token');
    store.remove('sessionToken');
    store.remove('profile');
    window.location.reload(); // Needed, otherwise Auth0 won't recognize this as a new page
  }

  this.login = function() {
    auth.lock.show()
  }

  this.signup = function() {
    auth.lock.show()
  }

  var lastSessionToken = null;
  var lastSession;

  this.session = function() {
    if (lastSessionToken == store.get('sessionToken')) {
      return lastSession;
    }
    else {
      lastSession = jwtHelper.decodeToken(store.get('sessionToken'))
      // Shortcut so that the components know user's role. FIXME?
      lastSession.role = lastSession.app_metadata.roles.indexOf('superadmin') != -1 ? 'superadmin' :
            lastSession.app_metadata.roles.indexOf('admin') != -1 ? 'admin'
            : null;
      lastSession.transportCompanyId = lastSession.app_metadata.transportCompanyId;

      return lastSession;
    }
  }

  this.isSuperAdmin = function () {
    if (!auth.isAuthenticated) return false;

    var profile = store.get('profile')

    if (!profile) return false;

    return (profile.app_metadata.roles.indexOf('superadmin') != -1);
  }

  this.getCompanyId = function() {
    return this.actingCompany || null;
  }
}
