import {mapState, mapMutations, mapActions} from 'vuex'
import axios from 'axios'
import auth0 from 'auth0-js'
import jwtDecode from 'jwt-decode'
import Auth0Lock from 'auth0-lock'

/**
 * This needs to be run early on
 */
export const authInitializationPromise =
axios.get(`${process.env.BACKEND_URL}/auth/credentials`)
  .then((r) => {
    const {cid, domain} = r.data

    const webAuth = new auth0.WebAuth({
      domain,
      clientID: cid,
      responseType: 'token id_token',
      scope: 'openid name email app_metadata user_id offline_access'
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
    )

    const authResultPromise = new Promise((resolve, reject) => {
      webAuth.parseHash((err, authResult) => {
        if (!err && authResult) {
          resolve(authResult)
        } else {
          resolve(checkToken())
        }
      })
    })

    function checkToken () {
      const idToken = localStorage.sessionToken
      const isTokenValid = (t) => {
        try {
          const time = jwtDecode(t).exp * 1e3
          return time - Date.now() > 3600e3
        } catch (e) {
          return false
        }
      }

      if (idToken) {
        if (isTokenValid(idToken)) {
          return {idToken}
        } else {
          return refreshToken()
        }
      } else {
        return null
      }
    }

    function refreshToken () {
      return new Promise((resolve, reject) => {
        reject(null)
      // doesn't seem to work?
      //   lock.checkSession({
      //     scope: 'openid name email app_metadata user_id offline_access',
      //   }, (err, delegationResult) => {
      //     console.log('DELEGATION RESULT', delegationResult)
      //     if (err) return reject(err);
      //     localStorage.sessionToken = delegationResult.idToken
      //     resolve(delegationResult);
      //   })
      })
    }

    return authResultPromise.then(authResult => ({lock, authResult}))
      .catch(err => ({lock, authResult: null}))
  })

export default {
  render () { return null },

  computed: {
    ...mapState('auth', ['loginDialogShown', 'isAuthenticated', 'idToken'])
  },

  methods: {
    ...mapMutations('auth', ['authenticate', 'setProfile', 'setIdToken', 'showLoginDialog'])
  },

  watch: {
    loginDialogShown (v) {
      if (v) {
        this.$setupPromise.then(() => {
          this.$lock.show()
          this.showLoginDialog(false)
        })
      }
    },

    idToken () {
      if (this.isAuthenticated) {
        window.localStorage.sessionToken = this.idToken
      }
    }
  },

  created () {
    this.$setupPromise = authInitializationPromise.then(({lock, authResult}) => {
      this.$lock = lock

      lock.on('authenticated', (x) => {
        this.authenticate(x)
      })

      if (authResult && !authResult.error) {
        this.authenticate(authResult)

        if (authResult.state) {
          window.location.hash = authResult.state
        }
      }
    })
  }
}
