export default function ($rootScope, $location, uiGmapGoogleMapApi) {
  return {
    template: require('./pathEditor.html'),
    scope: {
      path: '=',
      tripStops: '='
    },
    link (scope, elem, attr) {
      scope.editPath = true

      scope.events = {
        tilesloaded (map) {
          scope.map = map
        }
      }

      uiGmapGoogleMapApi.then((googleMaps) => {
        const dirService = new googleMaps.DirectionsService()
        const dirDisplay = new googleMaps.DirectionsRenderer({
          draggable: true,
          polylineOptions: {strokeWeight: 3, strokeColor: '#4b3863'}
        })
        dirDisplay.directions_changed = () => {
          const directions = dirDisplay.getDirections()
          console.log(directions)
          const {overview_path, overview_polyline} = directions.routes[0]
          scope.path = overview_path.map((point) => [point.lat(), point.lng()])
          scope.polyline = overview_polyline
        }

        scope.$watch('map', () => {
          dirDisplay.setMap(scope.map)
        })

        scope.$watch('tripStops', () => {
          if (!scope.tripStops) return
          const inputLatLng = scope.tripStops.map((tripStop) => {
            const {stop: {coordinates: {coordinates}}} = tripStop
            return new googleMaps.LatLng(coordinates[1], coordinates[0])
          })
          const request = {
            origin: inputLatLng[0],
            destination: inputLatLng[inputLatLng.length - 1],
            waypoints: inputLatLng.slice(1, -1).map((latlng) => ({location: latlng})),
            travelMode: googleMaps.TravelMode.DRIVING,
            avoidHighways: false,
            avoidTolls: false
          }

          dirService.route(request, (result, status) => {
            if (status === googleMaps.DirectionsStatus.OK) {
              dirDisplay.setDirections(result)
            } else {
              console.log(result)
            }
          })
        })
      })

      // scope.events = {
      //   click(map, eventName, args) {
      //     scope.$apply(() => {``
      //       if (scope.addToWhere == 'end') {
      //         scope.path = scope.path || []
      //         scope.path.push({
      //           lat: args[0].latLng.lat(),
      //           lng: args[0].latLng.lng(),
      //         })
      //       }
      //       else if (scope.addToWhere == 'start') {
      //         scope.path = scope.path || []
      //         scope.path.splice(0,0,{
      //           lat: args[0].latLng.lat(),
      //           lng: args[0].latLng.lng(),
      //         })
      //       }
      //     })
      //   }
      // }
      // scope.addToWhere = 'end'
      // For display purposes

      scope.pathX = []
      scope.$watch('path', () => {
        scope.pathX = scope.path
        ? scope.path.map(({lat: latitude, lng: longitude}) => ({latitude, longitude}))
        : []
      }, true)

      scope.mapControl = {}
      scope.$watch(() => $location.url(), () => {
        if (window.google && google.maps && scope.mapControl.getGMap) {
          setTimeout(() => google.maps.event.trigger(scope.mapControl.getGMap(), 'resize'), 0)
        }
      })
    }
  }
}
