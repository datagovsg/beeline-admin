import _ from 'lodash'
import querystring from 'querystring'
import assert from 'assert'

export default function (AdminService) {

  var routesCache = null
  var routesById = null;

  this.getRoutes = function() {
    return AdminService.beeline({
      method: 'GET',
      url: `/routes`,
    })
    .then((response) => {
      routesCache = response.data;
      routesById = _.keyBy(routesCache, (r) => r.id)
      return routesCache
    })
  }

  this.getRoute = function(id) {
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
        start_date: options.startDate.toISOString().substr(0,10)
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
  this.createTrips = function(options) {
    var {routeId, dates, tripStops, companyId} = options;

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
    var result = Promise.all(createRequests);

    return result;
  }
  this.updateTrip = function (options) {
    var {trip, tripStops} = options;
    var date = trip.date;

    if (typeof date == 'string')
      date = new Date(date);

    if (Date.prototype.isPrototypeOf(date))
      date = date.getTime()

    // must be round...
    assert(date % (24 * 3600 * 1000) == 0)

    // offset from Singapore time midnight
    var tripStopOffsetTime = date - 8*3600*1000

    var updateData = tripStops.map((tripStop) => {
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

    return AdminService.beeline({
      method: 'PUT',
      url: `/trips/${trip.id}`,
      data: {
        tripStops: updateData,
      },
    })
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

  var stopsPromise = null;
  var stopsById = null;
  this.getStops = function(useCache) {
    if (useCache && stopsCache) {
      return stopsPromise;
    }
    else {
      return stopsPromise = AdminService.beeline({
        method: 'GET',
        url: `/stops`,
      })
      .then((response) => {
        stopsById = _.keyBy(response, x => x.id)
        return response.data
      })
    }
  }

}
