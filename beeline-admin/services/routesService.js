import _ from 'lodash'
import querystring from 'querystring'
import assert from 'assert'

export default function (AdminService, DriverService, $q) {

  var routesPromise = null;
  var routesById = null;
  var routesCache;

  function makeRouteQuery(options) {
    var query = {};

    if (options) {
      if (options.startDate)
        query.start_date = options.startDate;
      if (options.endDate)
        query.end_date = options.endDate;
      if (options.includeTrips)
        query.include_trips = options.includeTrips;
      if (options.includeAvailability)
        query.include_availability = options.includeAvailability;
    }
    query = querystring.stringify(query)
    return query
  }

  /**
    @param options -- options to pass in query string to /routes
      @prop startDate : string | int
      @prop endDate : string | int
      @prop includeAvailability : boolean
      @prop includeTrips : boolean
  **/
  this.getRoutes = function(options) {
    if (!options && routesPromise) {
      return routesPromise;
    }
    else {
      if (AdminService.session().role == 'admin') {
        options = options || {}
        options.transportCompanyId = AdminService.session().transportCompanyId
      }
      var query = makeRouteQuery(options);

      var promise = AdminService.beeline({
        method: 'GET',
        url: `/routes?${query}`,
      })
      .then((response) => {
        routesCache = response.data;
        return routesCache
      })

      // Cache -- only if we use default options
      if (!options) {
        routesPromise = promise;
        routesPromise.then(() => {
          routesById = _.keyBy(routesCache, (r) => r.id)
        })
      }

      return promise;
    }
  }

  this.getRoute = function(id, options) {
    if (options) {
      var query = makeRouteQuery(options);

      return AdminService.beeline({
        method: 'GET',
        url: `/routes/${id}?${query}`,
      })
      .then((response) => {
        for (let trip of response.data.trips) {
          trip.date = new Date(trip.date)
        }
        return response.data;
      })
    }
    return this.getRoutes()
    .then((response) => {
      return routesById[id]
    })
  }
  this.deleteRoute = function (id) {
    return AdminService.beeline({
     method: 'DELETE',
     url: `/routes/${id}`,
   })
   .then(() => {
     var index = routesCache.findIndex((route) => route.id == id)
     delete routesById[id]
     routesCache.splice(index, 1)
   });
  }

  this.saveRoute = function (route) {
    if (route.id) {
      return AdminService.beeline({
       method: 'PUT',
       url: `/routes/${route.id}`,
       data: route,
      })
      .then((response) => {
        var index = routesCache.findIndex((r) => r.id == route.id)
        routesCache.splice(index, 1, response.data)
        routesById[route.id] = response.data
        return response.data
      });
    }
    else {
      return AdminService.beeline({
       method: 'POST',
       url: `/routes`,
       data: route
      })
      .then((response) => {
        routesCache.push(response.data)
        routesById[response.data.id] = response.data
        return response.data
      });
    }
  }

  this.stopsById = null;
  this.stopsPromise = null;
  this.getStops = (refresh) => {
    if (!refresh && this.stopsPromise) {
      return this.stopsPromise;
    }
    else {
      return this.stopsPromise = AdminService.beeline({
        method: 'GET',
        url: `/stops`,
      })
      .then((response) => {
        this.stopsById = _.keyBy(response.data, x => x.id)
        return response.data
      })
    }
  }
  this.createStop = function(stop) {
    return AdminService.beeline({
      method: 'POST',
      url: `/stops`,
      data: stop
    })
    .then((response) => {
      return response.data
    })
  }
  this.updateStop = function(stop) {
    return AdminService.beeline({
      method: 'PUT',
      url: `/stops/${stop.id}`,
      data: stop,
    })
    .then((response) => {
      return response.data
    })
  }
  this.deleteStop = function(stopId) {
    return AdminService.beeline({
      method: 'DELETE',
      url: `/stops/${stopId}`,
    })
  }

}
