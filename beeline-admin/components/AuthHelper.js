import {mapState, mapMutations, mapActions, mapGetters} from 'vuex'
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
      .catch(err => ({lock, authResult: null})) // eslint-disable-line
  })

export default {
  render () { return null },

  computed: {
    ...mapState('auth', ['loginDialogShown', 'isAuthenticated', 'idToken']),
    ...mapGetters(['axios'])
  },

  methods: {
    ...mapMutations(
      'auth',
      ['authenticate', 'setProfile', 'setIdToken', 'showLoginDialog', 'setAvailableCompanies']
    ),
    ...mapActions('shared', ['fetch'])
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
      // save in session token
      if (this.isAuthenticated) {
        window.localStorage.sessionToken = this.idToken
      }

      // update the store with list of available companies
      if (!this.idToken) {
        this.setAvailableCompanies(null)
      } else {
        const promise = this.$whoamiPromise = this.axios.get('/admins/whoami')
          .then(({data: whoami}) => {
            if (promise !== this.$whoamiPromise) return false

            const companyIdsPromise = (whoami.role === 'superadmin')
              ? this.fetch('companies')
                .then(() => this.companies.map(c => c.id))
              : Promise.resolve(whoami.transportCompanyIds)

            companyIdsPromise.then((companyIds) => {
              this.setAvailableCompanies(companyIds)

              if (companyIds && companyIds.length === 1) {
                this.$router.push({
                  query: this.$route.query,
                  params: {
                    ...this.$route.params,
                    companyId: companyIds[0]
                  }
                })
              }
            })
          })
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
