import assert from 'assert'

function b64_to_utf8(str) {
    return decodeURIComponent(unescape(window.atob(str)));
}

function decodeToken(tk) {
  var [a,b,c] = tk.split('.')

  return b64_to_utf8(b);
}

export default function ($http, $location, store, jwtHelper, auth, commonModals) {

  this.serverUrl = () => process.env.BACKEND_URL;

  this.beeline = function(options) {
    options.url = process.env.BACKEND_URL + options.url

    if (options.url.indexOf('/routes/undefined') !== -1) {
      throw new Error();
    }

    if (auth.idToken) {
      options.headers = options.headers || {};
      options.headers.authorization = 'Bearer ' + auth.idToken;
    }

    return $http(options);
  }

  this.logout = function() {
    auth.signout();
    store.remove('token');
    store.remove('sessionToken');
    store.remove('refreshToken');
    store.remove('profile');
    window.location.reload(); // Needed, otherwise Auth0 won't recognize this as a new page
  }

  this.login = () => auth.showLoginDialog()
  this.signup = () => auth.showLoginDialog()

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
    return _.get(this.session(), 'app_metadata.roles', []).indexOf('superadmin') != -1;
  }

  this.getCompanyId = function() {
    return this.actingCompany || null;
  }
}
