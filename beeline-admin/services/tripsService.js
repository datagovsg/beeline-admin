import _ from 'lodash'
import querystring from 'querystring'
import assert from 'assert'

export default function (AdminService, DriverService, $q) {
  /**
    @param options
      @prop routeId
      @prop startDate
    **/
  var tripCache = [];
  this.getTrips = function(options) {
    return AdminService.beeline({
      method: 'GET',
      url: `/routes/${options.routeId}?`+ querystring.stringify({
        include_trips: true,
        start_date: options.startDate.getTime(),
        end_date: options.endDate.getTime(),
        include_availability: options.includeAvailability ? true : false,
      })
    })
    .then((response) => {
      // Cache the last 100 trips
      tripCache = tripCache.concat(response.data.trips);
      tripCache = tripCache.slice(Math.max(0, tripCache.length - 100))

      return response.data.trips;
    })
    .then((trips) => {
      // convert the trip dates and tripstop times into Date objects
      for (let trip of trips) {
        trip.price = parseFloat(trip.price);
        trip.date = new Date(trip.date);
        for (let tripStop of trip.tripStops) {
          tripStop.time = new Date(tripStop.time);
        }
      }
      return trips;
    })
  }
  this.getTrip = function(tripId) {
    var trip;
    if (trip = tripCache.find(t => t.id == tripId)) {
      return $q((resolve) => resolve(trip));
    }
    return AdminService.beeline({
      method: 'GET',
      url: `/trips/${tripId}`,
    })
    .then((response) => {
      tripCache = tripCache.concat([response.data]);
      tripCache.slice(Math.max(0, tripCache.length - 100));
      return response.data;
    })
  }

  this.deleteTrip = function(trip) {
    return AdminService.beeline({
      method: 'DELETE',
      url: `/trips/${trip}`,
    })
  }

  this.getPings = function (options) {
    _.defaults(options, {
      limit: 100000,
    })
    return AdminService.beeline({
      method: 'GET',
      url: `/trips/${options.tripId}/pings?`
        + querystring.stringify(_.pick(options, [
          'startTime', 'endTime', 'byTripId', 'limit'
        ])),
    })
    .then((response) => {
      for (let ping of response.data) {
        ping.time = new Date(ping.time);
        ping.createdAt = new Date(ping.createdAt);
        ping.updatedAt = new Date(ping.updatedAt);
      }
      return response.data;
    })
  }

  var updatableFields = [
    'driverId', 'capacity', 'companyId', 'price', 'transportCompanyId',
    'bookingInfo', 'status'
  ];
  var updatableTripStopFields = [
    'canBoard', 'canAlight', 'time', 'stopId'
  ]
  var creatableFields = updatableFields.concat([
    'routeId'
  ])
  var creatableTripStopFields = updatableTripStopFields.concat([])

  function validateDate(date) {
    // convert the dates...
    if (typeof(date) == 'string' || typeof(date) == 'number')
      date = new Date(date);
    else
      assert(date instanceof Date);
    return date
  }

  /**
    Return a Date object, using the date from
    utcDate and time from time
    **/
  function dateTime(utcDate, time) {
    utcDate = validateDate(utcDate);
    time = validateDate(time);

    //
    return new Date(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth(),
      utcDate.getUTCDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds()
    )
  }

  this.createTrips = async function(dates, options) {
    var createOptions = dates.map((date) => {
      date = new Date(Date.UTC(
        date.year(),
        date.month(),
        date.date()
      ));

      // must be round...
      assert.equal(date.getTime() % (24 * 3600 * 1000), 0)

      return {
        method: 'POST',
        url: '/trips',
        data: _.assign(_.pick(options, creatableFields), {
          date: date.getTime(),
          tripStops: options.tripStops.map(ts => ({
            stopId: ts.stopId,
            canBoard: ts.canBoard,
            canAlight: ts.canAlight,
            time: dateTime(date, ts.time).getTime(),
          }))
        })
      }
    });

    // FIXME this will be bloody slow. Create a bulk-create function!
    var createRequests = createOptions.map((opts) => AdminService.beeline(opts))
    var result = await Promise.all(createRequests);

    return result;
  }

  this.updateTrips = function (trips, options) {
    console.log(trips);
    console.log(options);
    try {
      var tripRequests = trips.map((trip) => {
        var {date, id: tripId} = trip;

        date = validateDate(date);

        // must be round...
        assert.equal(date.getTime() % (24 * 3600 * 1000), 0)

        // // check for a tripStop with matching stop
        var assignTripStopIds = (original, reference) => {
          //
          var referenceStops = _(reference)
            // clone the tripStops because we'll be mutating them with an id
            .map(ts => {
              var update = _.pick(ts, updatableTripStopFields);
              update.time = dateTime(date, ts.time).getTime();
              return update;
            })
            .groupBy('stopId')
            .value();

          //
          var originalStops = _(original)
            .groupBy('stopId')
            .value();

          // Give the reference stops an id
          // For now, match old and new by order of appearance
          // TODO: more intelligent matching
          _.each(referenceStops, (tss, stopId) => {
            _.each(tss, (ts, index) => {
              if (originalStops[stopId] && originalStops[stopId][index]) {
                ts.id = originalStops[stopId][index].id;
              }
              else {
                ts.id = null
              }
            })
          })

          return _.flatten(_.values(referenceStops));
        };

        var request = {
          method: 'PUT',
          url: `/trips/${tripId}`,
          data: _.assign(
            _.pick(options, updatableFields),
            {
              tripStops: assignTripStopIds(trip.tripStops, options.tripStops)
            }),
        };

        return request;
      })

      return Promise.all(tripRequests.map(request => AdminService.beeline(request)));
    } catch (err) {
      console.error(err);
    }
  };
}
