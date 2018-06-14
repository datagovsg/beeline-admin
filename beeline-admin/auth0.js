import assert from 'assert';
import axios from 'axios';
import auth0 from 'auth0-js'
import Auth0Lock from 'auth0-lock'

const domainPromise = axios.get(`${process.env.BACKEND_URL}/auth/credentials`)
.then((r) => {
  const {cid, domain} = r.data

  const webAuth = new auth0.WebAuth({
    domain,
    clientID: cid,
    responseType: 'token id_token',
    scope: 'openid name email app_metadata user_id offline_access',
  })

  const lock = new Auth0Lock(
    cid,
    domain,
    {
      auth: {
        responseType: 'token id_token',
        params: {
          scope: 'openid name email app_metadata user_id offline_access',
          // Save the hash so we can redirect to the page
          // after login. c.f. main.js
          state: window.location.hash
        }
      }
    }
  );

  const authResultPromise = new Promise((resolve, reject) => {
    webAuth.parseHash((err, authResult) => {
      if (err) {
        console.warn(`Unable to parse embedded hash, returning empty object: `, err)
        resolve()
      } else {
        resolve(authResult)
      }
    })
  })

  return authResultPromise.then(authResult => ({lock, authResult}))
})

angular.module('beeline-admin')
.service('auth', function(vueStore) {
  this.domainPromise = domainPromise

  this.isAuthenticated = false;

  this.authenticate = function ({ idToken }) {
    this.idToken = idToken
    this.isAuthenticated = true;

    vueStore.commit('setIdToken', idToken)
  }

  this.showLoginDialog = () =>
    domainPromise.then(({ lock }) => new Promise((resolve, reject) => {
      lock.show()
      lock.on('authenticated', () => {
        this.refreshToken().then(resolve)
        lock.hide()
      })
    }))


  this.refreshToken = () =>
    domainPromise.then(({ lock }) =>
      new Promise((resolve, reject) => {
        lock.checkSession({
          scope: 'openid name email app_metadata user_id offline_access',
        }, (err, delegationResult) => {
          if (err) return reject(err);

          this.authenticate(delegationResult)
          resolve(delegationResult);
        })
      }))

  const profilePromise = Promise.all([domainPromise, this.refreshToken()])
    .then(([{ lock }, { accessToken }]) =>
      new Promise((resolve, reject) => {
        lock.getUserInfo(accessToken, (err, profile) => {
          if (err) return reject(err);
          resolve(profile);
        })
      }))

  this.getProfile = () => profilePromise

  this.signout = function () {
    this.isAuthenticated = false;
    this.profile = this.idToken = null;
  }

  this.initialized = false
  this.redirectRequired = false

  this.authResultPromise = domainPromise
    .then(({authResult}) => {
      if (authResult && !authResult.error) {
        this.authenticate(authResult);

        if (authResult.state) {
          this.redirectRequired = true
        }
      }
      this.authResult = authResult
      this.initialized = true
    })
})
