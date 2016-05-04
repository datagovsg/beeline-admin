

export default function ($http) {
  /* Superadmin session token */
  this.sessionToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic3VwZXJhZG1pbiIsImlhdCI6MTQ2MjI0MjE0Mn0.lPkEHqr2O_GNPQi_MCxa85IUkn9qx7uXB6HDi1b071I'

  this.beeline = function(options) {
    options.url = 'http://localhost:8080' + options.url

    if (this.sessionToken) {
      options.headers = options.headers || {};
      options.headers.authorization = 'Bearer ' + this.sessionToken;
    }

    return $http(options);
  }
}
