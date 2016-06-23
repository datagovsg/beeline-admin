export default function ($rootScope, $location, uiGmapGoogleMapApi, $q) {
  return {
    template: require('./pathEditor.html'),
    scope: {
      path: '=',
      tripStops: '='
    },
    link (scope, elem, attr) {
      scope.newPath = ''
      uiGmapGoogleMapApi.then((googleMaps) => {
        const singapore = new googleMaps.LatLng(1.352083, 103.819836)
        const map = new googleMaps.Map(document.querySelector('.map-ctn'), {
          zoom: 12,
          center: singapore
        })

        const mapPath = new googleMaps.Polyline({
          strokeColor: '#FF0000',
          strokeWeight: 3
        })

        scope.$watch('path', (path) => {
          if (!path) return
          mapPath.setMap(map)
          if (typeof path === 'string') {
            mapPath.setPath(googleMaps.geometry.encoding.decodePath(path))
          } else {
            mapPath.setPath(path)
          }
        })

        const dirService = new googleMaps.DirectionsService()
        const dirDisplay = new googleMaps.DirectionsRenderer({
          draggable: true,
          polylineOptions: {strokeWeight: 3, strokeColor: '#4b3863'},
          markerOptions: {icon: 'https://maps.gstatic.com/mapfiles/dd-via.png'}
        })

        dirDisplay.directions_changed = () => {
          const directions = dirDisplay.getDirections()
          console.log(directions)
          const {overview_polyline} = directions.routes[0]
          scope.newPath = overview_polyline
        }

        scope.googlePath = (tripStops) => {
          if (!tripStops) return
          const inputLatLng = tripStops.map((tripStop) => {
            const {stop: {coordinates: {coordinates}}} = tripStop
            return new googleMaps.LatLng(coordinates[1], coordinates[0])
          })
          const request = {
            origin: inputLatLng[0],
            destination: inputLatLng[inputLatLng.length - 1],
            waypoints: inputLatLng.slice(1, -1).map((latlng) => ({location: latlng})),
            travelMode: googleMaps.TravelMode.DRIVING
          }

          dirService.route(request, (result, status) => {
            if (status === googleMaps.DirectionsStatus.OK) {
              dirDisplay.setMap(map)
              dirDisplay.setDirections(result)
            } else {
              console.log('Google path failed', result)
            }
          })
        }

        scope.updatePath = () => {
          if (!scope.newPath) return
          scope.path = scope.newPath
          scope.newPath = ''
          dirDisplay.setMap(null)
        }

        scope.clearPath = () => {
          scope.path = ''
          scope.newPath = ''
          mapPath.setMap(null)
          dirDisplay.setMap(null)
        }
      })
    }
  }
}
