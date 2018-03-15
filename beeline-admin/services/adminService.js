import assert from 'assert'
import {sortBy} from 'lodash'

export default function ($http, $rootScope, $location, store, jwtHelper, auth, commonModals) {
  ////////////////////// Public fields
  this.session = null

  ////////////////////// Private fields
  let lastSessionToken = null
  let lastSessionPromise = null
  let companiesCache, allCompaniesPromise;


  ////////////////////// Public methods
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

  /**
   * @return {Promise<array<TransportCompany>>} - A list of transport companies the current
   * admin belongs to
   */
  this.fetchAdminCompanies = function(options) {
    return this.fetchSession().then(s => s.transportCompanies)
  }

  /**
   * @param {*} refreshCache - Whether to force a reload
   * @return {Promise<array<TransportCompany>>} - A list of *all* transport companies in the system
   */
  this.fetchAllCompanies = function (refreshCache) {
    if (!refreshCache && allCompaniesPromise) {
      return allCompaniesPromise
    } else {
      return allCompaniesPromise = this.beeline({url: '/companies'})
        .then((result) => {
          console.log(result)
          return sortBy(result.data, 'name')
        })
    }
  }

  /**
   * @return {Promise<{email, role, transportCompanyIds, transportCompanies}>} - Returns
   *  the current admin's session data -- his email, role, companies
   */
  this.fetchSession = () => {
    const currentToken = store.get('sessionToken')

    if (lastSessionToken === currentToken && lastSessionPromise) {
      return lastSessionPromise
    }
    else {
      lastSessionToken = currentToken
      return lastSessionPromise = this.beeline({
        url: '/admins/whoami'
      })
      .then(async (whoAmI) => {
        const { scope: role, adminId, email, transportCompanyIds } = whoAmI.data

        const transportCompanies = !adminId && role === 'superadmin'
          ? (await this.fetchAllCompanies())
          : (await this.beeline({url: `/admins/${adminId}`})).data.transportCompanies

        return { email, role, transportCompanyIds, transportCompanies }
      })
      .catch(console.error)
    }
  }

  /**
   * Ensure that whenever the session token is updated, we re-fetch admin
   * information. And then we save session data in `this.session`
   */
  $rootScope.$watch(() => store.get('sessionToken'), () => {
    this.fetchSession().then((sessionData) => {
      this.session = sessionData
      // If there is only one company available, automatically select it
      if (_.get(this.session, 'transportCompanyIds.length') === 1) {
        this.actingCompany = this.session.transportCompanyIds[0]
      }
    })
  })

  this.isSuperAdmin = function () {
    return _.get(this.session, 'role') === 'superadmin';
  }

  this.getCompanyId = function() {
    return this.actingCompany || null;
  }
}
