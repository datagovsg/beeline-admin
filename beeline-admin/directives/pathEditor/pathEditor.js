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
        const SINGAPORE = new googleMaps.LatLng(1.352083, 103.819836)
        const map = new googleMaps.Map(document.querySelector('.map-container'), {
          zoom: 11,
          center: SINGAPORE
        })

        const mapPath = new googleMaps.Polyline({
          strokeColor: '#FF0000',
          strokeWeight: 3
        })

        scope.$on('mapLoaded', () => {
          googleMaps.event.trigger(map, 'resize');
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

        let markers = []

        scope.$watch('tripStops', (tripStops) => {
          map.setCenter(SINGAPORE)
          map.setZoom(11)
          dirRenderer.setMap(null)
          markers.forEach((marker) => marker.setMap(null))
          markers = tripStops ? tripStops.map((tripStop, i) => {
            const {stop: {coordinates: {coordinates}, description}, canBoard} = tripStop
            const latlng = new googleMaps.LatLng(coordinates[1], coordinates[0])
            return new googleMaps.Marker({
              position: latlng,
              title: description,
              icon: {
                scaledSize: new googleMaps.Size(30, 30),
                anchor: new googleMaps.Point(15, 15),
                url: `img/stop${canBoard ? 'Board' : 'Alight'}${i + 1}.png`
              },
              map: map
            })
          }) : []
        })

        const dirService = new googleMaps.DirectionsService()
        const dirRenderer = new googleMaps.DirectionsRenderer({
          draggable: true,
          polylineOptions: {strokeWeight: 3, strokeColor: '#4b3863'},
          markerOptions: {icon: 'https://maps.gstatic.com/mapfiles/dd-via.png'}
        })

        dirRenderer.directions_changed = () => {
          const directions = dirRenderer.getDirections()
          console.log(directions)
          const {overview_polyline} = directions.routes[0]
          scope.newPath = overview_polyline
        }

        scope.googlePath = (tripStops) => {
          if (!tripStops) return
          const stopsLatLng = tripStops.map((tripStop) => {
            const {stop: {coordinates: {coordinates}}} = tripStop
            return new googleMaps.LatLng(coordinates[1], coordinates[0])
          })

          const request = {
            origin: stopsLatLng[0],
            destination: stopsLatLng[stopsLatLng.length - 1],
            waypoints: stopsLatLng.slice(1, -1).map((latlng) => ({location: latlng})),
            travelMode: googleMaps.TravelMode.DRIVING
          }

          if (request.waypoints.length > 6) {
            const length = request.waypoints.length
            const start = Math.floor((length - 6) / 2)
            const end = start + 6
            request.waypoints = request.waypoints.slice(start, end)
          }

          dirService.route(request, (result, status) => {
            if (status === googleMaps.DirectionsStatus.OK) {
              dirRenderer.setMap(map)
              dirRenderer.setDirections(result)
            } else {
              console.log('Google path failed', result)
            }
          })
        }

        scope.updatePath = () => {
          if (!scope.newPath) return
          scope.path = scope.newPath
          scope.newPath = ''
          dirRenderer.setMap(null)
        }

        scope.clearPath = () => {
          scope.path = ''
          scope.newPath = ''
          mapPath.setMap(null)
          dirRenderer.setMap(null)
        }
      })
    }
  }
}
