import assert from 'assert';
import env from './env';

var lock;

// Parse the hash if it exists
var auth0 = new Auth0({
  clientID: env.AUTH0_CID,
  domain: env.AUTH0_DOMAIN
})

lock = new Auth0Lock(
  env.AUTH0_CID,
  env.AUTH0_DOMAIN,
  {
    auth: {
      params: {
        scope: 'openid name email app_metadata user_id offline_access'
      }
    }
  });

var authResult = auth0.parseHash();

export default function() {
  this.lock = lock;
  this.credentials = {};

  this.isAuthenticated = false;

  this.authenticate = function (token) {
    this.idToken = token;
    this.isAuthenticated = true;
  }

  this.refreshToken = function () {
    this.lock.refreshToken()
  }

  this.signout = function () {
    this.isAuthenticated = false;
    this.profile = this.idToken = null;
  }

  this.authResult = authResult;

  if (authResult && !authResult.error) {
    this.authenticate(authResult.idToken);
  }
}
