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

    companiesCache = AdminService.beeline({
      method: 'GET',
      url: `/companies`,
    })
    .then((response) => {
      return response.data;
    })

    return companiesCache;
  }
}
