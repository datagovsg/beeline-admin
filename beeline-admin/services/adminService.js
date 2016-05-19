import assert from 'assert'
const env = require('../env.json')

function b64_to_utf8(str) {
    return decodeURIComponent(unescape(window.atob(str)));
}

function decodeToken(tk) {
  var [a,b,c] = tk.split('.')

  return b64_to_utf8(b);
}

export default function ($http, $location, store, jwtHelper, auth) {
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
    store.remove('sessionToken');
    store.remove('profile');
    $location.path('/login');
  }

  var lastSessionToken = null;
  var lastSession;
  this.session = function() {
    if (lastSessionToken == store.get('sessionToken')) {
      return lastSession;
    }
    else {
      lastSession = jwtHelper.decodeToken(store.get('sessionToken'))
      return lastSession;
    }
  }

  this.getCompanyId = function() {
    var profile = store.get('profile')

    if (profile.indexOf('admin') != -1) {
      return profile.transportCompanyId;
    }
    else if (profile.role == 'superadmin') {
      return this.actingCompany;
    }
    else {
      assert(false);
    }
  }
}
