import _ from 'lodash'
import querystring from 'querystring'
import assert from 'assert'

export default function (AdminService, DriverService) {

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
      var query = makeRouteQuery(options);

      if (AdminService.session().role == 'admin') {
        query.transportCompanyId = AdminService.session().transportCompanyId
      }

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

  /**
    @param options
      @prop routeId
      @prop startDate
    **/
  this.getTrips = function(options) {
    return AdminService.beeline({
      method: 'GET',
      url: `/routes/${options.routeId}?`+ querystring.stringify({
        include_trips: true,
        start_date: options.startDate.toISOString().substr(0,10),
        end_date: options.endDate.toISOString().substr(0,10),
        include_availability: options.includeAvailability ? true : false,
      })
    })
    .then((response) => {
      return response.data.trips;
    })
  }
  this.deleteTrip = function(trip) {
    return AdminService.beeline({
      method: 'DELETE',
      url: `/trips/${trip}`,
    })
  }
  this.createTrips = async function(options) {
    // get the driver id from his telephone
    await DriverService.fetchDriverIds([options]);

    // Get the create options
    var {routeId, dates, tripStops, companyId, driverId} = options;

    var createOptions = dates.map((date) => {
      if (typeof date == 'string')
        date = new Date(date);

      if (Date.prototype.isPrototypeOf(date))
        date = date.getTime()

      // must be round...
      assert(date % (24 * 3600 * 1000) == 0)

      // offset from Singapore time midnight
      var tripStopOffsetTime = date - 8*3600*1000

      return {
        method: 'POST',
        url: '/trips',
        data: {
          date: date,
          routeId: routeId,
          transportCompanyId: companyId,
          driverId: driverId,
          tripStops: tripStops.map(ts => {
            // adjust the time to match...
            var tsTimeMidnight = new Date(
              ts.time.getFullYear(),
              ts.time.getMonth(),
              ts.time.getDate()
            ).getTime()

            return {
              stopId: ts.stopId,
              canBoard: ts.canBoard,
              canAlight: ts.canAlight,
              time: new Date(tripStopOffsetTime // offset from trip date
                            + ts.time.getTime()
                            - tsTimeMidnight
                          ),
            }
          }),
        }
      }
    });

    // FIXME this will be bloody slow
    var createRequests = createOptions.map((opts) => AdminService.beeline(opts))
    var result = await Promise.all(createRequests);

    return result;
  }

  this.updateTrips = function (options) {
    var {trips, tripStops, driverId, capacity} = options;

    return Promise.all(trips.map((trip) => {
      var date = trip.date;
      if (typeof date == 'string')
        date = new Date(date);

      if (Date.prototype.isPrototypeOf(date))
        date = date.getTime()

      // must be round...
      assert(date % (24 * 3600 * 1000) == 0)

      // offset from Singapore time midnight
      var tripStopOffsetTime = date - 8*3600*1000

      var updateData = tripStops.map((tripStopReference) => {
        // Set the trip stop ID correctly
        // FIXME: Bug -- cannot have the same stop appear twice in the trip
        var tripStop = _.assign({}, tripStopReference)
        var modifyingTripStop = trip.tripStops.find(ts => ts.stopId == tripStopReference.stopId)
        tripStop.id = modifyingTripStop ? modifyingTripStop.id : null;

        // set time
        var tsTimeMidnight = new Date(
          tripStop.time.getFullYear(),
          tripStop.time.getMonth(),
          tripStop.time.getDate()
        ).getTime()
        return {
          id: tripStop.id,
          stopId: tripStop.stopId,
          canBoard: tripStop.canBoard,
          canAlight: tripStop.canAlight,
          time: new Date(tripStopOffsetTime // offset from trip date
                        + tripStop.time.getTime()
                        - tsTimeMidnight
                      ),
        }
      });

      var updatePayload = {
        capacity: capacity,
        driverId: driverId,
        tripStops: updateData,
      };
      if (options.transportCompanyId) {
        updatePayload.transportCompanyId = options.transportCompanyId;
      }

      return AdminService.beeline({
        method: 'PUT',
        url: `/trips/${trip.id}`,
        data: updatePayload,
      })
    }))
  };

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
