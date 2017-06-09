import assert from 'assert';
import axios from 'axios';

const domainPromise = axios.get(`${process.env.BACKEND_URL}/auth/credentials`)
.then((r) => {
  const {cid, domain} = r.data

  const auth0 = new Auth0({
    clientID: cid,
    domain: domain
  })

  const lock = new Auth0Lock(
    cid,
    domain,
    {
      auth: {
        params: {
          scope: 'openid name email app_metadata user_id offline_access',
          // Save the hash so we can redirect to the page
          // after login. c.f. main.js
          state: window.location.hash
        }
      }
    }
  );

  const authResult = auth0.parseHash();

  return {lock, auth0, authResult}
})

angular.module('beeline-admin')
.service('auth', function(vueStore) {
  this.domainPromise = domainPromise

  this.isAuthenticated = false;

  this.authenticate = function (token) {
    this.idToken = token;
    this.isAuthenticated = true;
  }

  this.showLoginDialog = () =>
    domainPromise.then(({lock}) => {
      lock.show()
    })

  this.refreshToken = (refreshToken) =>
    domainPromise.then(({auth0}) =>
      new Promise((resolve, reject) => {
        auth0.refreshToken(refreshToken, (err, delegationResult) => {
          if (err) return reject(err);

          this.authenticate(delegationResult.id_token);
          resolve(delegationResult);
        })
      }))

  this.getProfile = () => domainPromise
    .then(({auth0}) =>
      new Promise((resolve, reject) => {
        auth0.getProfile(this.idToken, (err, profile) => {
          if (err) return reject(err);
          resolve(profile);
        })
      }))

  this.signout = function () {
    this.isAuthenticated = false;
    this.profile = this.idToken = null;
  }

  this.initialized = false
  this.redirectRequired = false

  this.authResultPromise = domainPromise
    .then(({authResult}) => {
      if (authResult && !authResult.error) {
        this.authenticate(authResult.idToken);

        if (authResult.state) {
          this.redirectRequired = true
        }
      }
      this.authResult = authResult
      this.initialized = true
    })
})
