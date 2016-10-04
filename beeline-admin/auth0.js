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

  this.refreshToken = function (refreshToken) {
    return new Promise((resolve, reject) => {
      auth0.refreshToken(refreshToken, (err, delegationResult) => {
        if (err) return reject(err);

        this.authenticate(delegationResult.id_token);
        resolve(delegationResult);
      })
    })
  }

  this.getProfile = function () {
    return new Promise((resolve, reject) => {
      auth0.getProfile(this.idToken, (err, profile) => {
        if (err) return reject(err);
        resolve(profile);
      })
    });
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
