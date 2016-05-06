import assert from 'assert'

function b64_to_utf8(str) {
    return decodeURIComponent(unescape(window.atob(str)));
}

function decodeToken(tk) {
  var [a,b,c] = tk.split('.')

  return b64_to_utf8(b);
}

export default function ($http) {
  /* Superadmin session token */
  this.sessionToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic3VwZXJhZG1pbiIsImlhdCI6MTQ2MjI0MjE0Mn0.lPkEHqr2O_GNPQi_MCxa85IUkn9qx7uXB6HDi1b071I'
  this.session = JSON.parse(decodeToken(this.sessionToken))

  this.beeline = function(options) {
    options.url = 'http://localhost:8080' + options.url

    if (this.sessionToken) {
      options.headers = options.headers || {};
      options.headers.authorization = 'Bearer ' + this.sessionToken;
    }

    return $http(options);
  }

  this.getCompanyId = function() {
    if (this.session.role == 'admin') {
      return this.session.transportCompanyId;
    }
    else if (this.session.role == 'superadmin') {
      return this.actingCompany;
    }
    else {
      assert(false);
    }
  }
}
