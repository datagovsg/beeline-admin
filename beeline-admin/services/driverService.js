import _ from 'lodash'
import qs from 'querystring'

export default function (AdminService) {
  this.fetchDriverInfo = function (trips) {
    var tripsWithDrivers = _(trips)
      .uniqBy(tr => tr.driverId)
      .filter(tr => tr.driverId)
      .value()

    var driverInfoPromise = Promise.all(
      tripsWithDrivers.map(trip => AdminService.beeline({
          url: `/companies/${trip.transportCompanyId}/drivers/${trip.driverId}`,
          method: 'GET',
        })
        .then((resp) => {
          console.log(resp.data);
          return resp.data
        })
        .catch(() => ({id: trip.driverId, telephone: '??'}))
      )
    )
    .then((response) => {
      var driversById = _.keyBy(response, d => d.id)

      for (let trip of trips) {
        if (!trip.driverId) continue;
        trip.driver = driversById[trip.driverId]
        trip.driverTelephone = trip.driver ?
          driversById[trip.driverId].telephone.substr(3) : null // exclude the +65
        trip.driverName = trip.driver ?
          driversById[trip.driverId].name : null
      }
      return trips
    });

    return driverInfoPromise
  }

  this.fetchDriverIds = function (trips) {
    var driverTelephones = _.uniq(trips
      .filter(tr => tr.driverTelephone != '')
      .map(tr => '+65' + tr.driverTelephone))
      .filter(tr => tr != null)

    var driverInfoPromise = AdminService.beeline({
      url: '/drivers?' + qs.stringify({
        telephones: JSON.stringify(driverTelephones)
      }),
      method: 'GET',
    })
    .then((response) => {
      var driversByTelephone = _.keyBy(response.data, d => d.telephone.substr(3))

      for (let trip of trips) {
        if (!trip.driverTelephone) continue;
        let driver = driversByTelephone[trip.driverTelephone]
        trip.driverId = driver ? driver.id : null;
      }
      return trips
    });
    return driverInfoPromise
  }

  this.createDriver = function(driver) {
    return AdminService.beeline({
      url: '/drivers/ad-hoc',
      method: 'POST',
      data: driver
    })
    .then((response) => {
      return response.data
    })
  }
}
