import _ from 'lodash'

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


}
