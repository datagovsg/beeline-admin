import _ from 'lodash'
import querystring from 'querystring'
import assert from 'assert'

export default function (AdminService, DriverService, $q, LoadingSpinner) {

  var routesPromiseCache = null, currentRoutesPromiseCache = null;
  var routesById = null;
  var routesCache;

  function makeRouteQuery(options) {
    var query = options || {}
    return querystring.stringify(query)
  }

  function postProcessRoute(route) {
    route.notes = route.notes || {};
    if (route.trips) {
      for (let trip of route.trips) {
        trip.date = new Date(trip.date)

        if (trip.tripStops) {
          for (let tripStop of trip.tripStops) {
            tripStop.time = new Date(tripStop.time);
          }
        }
      }
    }
    return route;
  }

  this.getCurrentRoutes = function (options) {
    if (!options && currentRoutesPromiseCache) {
      return currentRoutesPromiseCache;
    }
    else {
      var promise = this.getRoutes(_.defaults({
        includeTrips: false,
        includeIndicative: true,
        startDate: Date.now()
      }, options))

      if (!options) {
        currentRoutesPromiseCache = promise;
      }
      return promise;
    }
  }

  /**
    @param options -- options to pass in query string to /routes
      @prop startDate : string | int
      @prop endDate : string | int
      @prop includeTrips : boolean
  **/
  this.getRoutes = function(options) {
    if (!options && routesPromiseCache) {
      return routesPromiseCache;
    }
    else {
      const _options = options || {}
      var query = makeRouteQuery(_options);

      var companiesPromise = AdminService.fetchAdminCompanies()
        .then((companies => _.keyBy(companies, 'id')))

      var routesPromise = AdminService.beeline({
        method: 'GET',
        url: `/routes?${query}`,
      })

      var promise = Promise.all([companiesPromise, routesPromise])
      .then(([companiesById, response]) => {
        routesCache = response.data.filter(r => !r.transportCompanyId ||
              r.transportCompanyId in companiesById);

        for (let route of response.data) {
          postProcessRoute(route);
        }

        return routesCache
      })

      // Cache -- only if we use default options
      if (!options) {
        routesPromiseCache = promise;
        routesPromiseCache.then(() => {
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
        return postProcessRoute(response.data);
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
    // sensible defaults
    route.companyTags = route.companyTags || [];
    route.tags = route.tags || [];

    if (route.id) {
      return LoadingSpinner.watchPromise(AdminService.beeline({
       method: 'PUT',
       url: `/routes/${route.id}`,
       data: route,
      })
      .then((response) => {
        if (routesCache) {
          var index = routesCache.findIndex((r) => r.id == route.id)
          routesCache.splice(index, 1, response.data)
        }
        if (routesById) routesById[route.id] = response.data
        return response.data
      }));
    }
    else {
      return LoadingSpinner.watchPromise(AdminService.beeline({
       method: 'POST',
       url: `/routes`,
       data: route
      })
      .then((response) => {
        if (routesCache) routesCache.push(response.data)
        if (routesById) routesById[response.data.id] = response.data
        return response.data
      }));
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
        return _.sortBy(response.data, 'description')
      })
    }
  }
  this.getStopById = (id) => {
    return this.getStops().then(() => this.stopsById[id])
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

  this.fetchRoutePasses = function(userId, companyId){
    return AdminService.beeline({
      method: 'GET',
      url: `/companies/${companyId}/route_passes/all/users/${userId}`
    }).then((response) => {
      return response.data
    }).catch(err => {
      console.log(err)
    })
  }

}
