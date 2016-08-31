import _ from 'lodash'
import querystring from 'querystring'
import assert from 'assert'

export default function (AdminService, DriverService, $q) {
  var companiesCache;

  /**
    @param options -- options to pass in query string to /routes
      @prop startDate : string | int
      @prop endDate : string | int
      @prop includeAvailability : boolean
      @prop includeTrips : boolean
  **/
  this.getCompanies = function(options) {
    if (!options && companiesCache) return companiesCache;

    var session = AdminService.session();

    if (session.app_metadata.roles.indexOf('superadmin') !== -1) {
      return companiesCache = AdminService.beeline({
        url: `/companies`
      })
      .then((result) => {
        return result.data;
      })
    }
    else {
      var adminId = session.app_metadata.adminId;

      return companiesCache = AdminService.beeline({
        url: `/admins/${adminId}`
      })
      .then((result) => {
        return result.data.transportCompanies;
      })
    }
  }
}
