import leftPad from 'left-pad';

export default function (uiGmapGoogleMapApi, $q, TripsService) {
  return {
    template: require('./pathEditor.html'),
    scope: {
      path: '=',
      routeId: '='
    },
    link (scope, elem, attr) {
      scope.newPath = '';
      scope.trip = null;

      scope.$watch('routeId', (id) => {
        if (!id) return

        // get all trips
        TripsService.getTrips({
          routeId: id,
          startDate: new Date(Date.now() - 180*24*60*60*1000),
          endDate: new Date(Date.now() + 365*24*60*60*1000),
        })
        .then((trips) => {
          scope.trips = trips;

          if (scope.trip === null) {
            scope.trip = trips[0]
          }
        })
      })

      uiGmapGoogleMapApi.then((googleMaps) => {
        const SINGAPORE = new googleMaps.LatLng(1.352083, 103.819836)
        const map = new googleMaps.Map(document.querySelector('.map-container'), {
          zoom: 11,
          center: SINGAPORE
        })

        const mapPath = new googleMaps.Polyline({
          strokeColor: '#FF0000',
          strokeWeight: 3,
          zIndex: 10
        })

        scope.$on('mapLoaded', () => {
          googleMaps.event.trigger(map, 'resize');
        })

        // one-way binding path --> mapPath
        scope.$watch('path', (path) => {
          if (!path) {
            if (mapPath) {
              mapPath.setMap(null);
            }
            return;
          }

          if (typeof path === 'string') {
            mapPath.setPath(googleMaps.geometry.encoding.decodePath(path))
          } else {
            mapPath.setPath(path)
          }
          mapPath.setMap(map)
        })

        // one-way binding tripStops --> tripStops
        let markers = []

        scope.$watch('trip.tripStops', (tripStops) => {
          map.setCenter(SINGAPORE)
          map.setZoom(11)
          dirRenderers.forEach((renderer) => { renderer.setMap(null) })
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
                url: `img/stop${canBoard ? 'Board' : 'Alight'}${leftPad(i + 1, 3, '0')}.png`
              },
              map: map
            })
          }) : []
        })

        const dirService = new googleMaps.DirectionsService()
        let dirRenderers = []
        let legs = []
        let updateQueue = Promise.resolve()

        function updateDirections (renderer, origin, destination, waypoints) {
          const update = () => {
            const request = {
              origin, destination, waypoints,
              travelMode: googleMaps.TravelMode.DRIVING,
              avoidHighways: false,
              avoidTolls: false
            }

            return new Promise((resolve, reject) => {
              dirService.route(request, (result, status) => {
                if (status === googleMaps.DirectionsStatus.OK) {
                  renderer.setDirections(result)
                  setTimeout(resolve, 300)
                } else {
                  console.log(status, result)
                  reject()
                }
              })
            })
          }

          updateQueue = updateQueue.then(update)
        }

        scope.googlePath = async (tripStops) => {
          if (!tripStops) return
          const stopsLatLng = tripStops.map((tripStop) => {
            const [lng, lat] = tripStop.stop.coordinates.coordinates;
            return new googleMaps.LatLng(lat, lng)
          })

          dirRenderers.forEach((renderer) => { renderer.setMap(null) })
          dirRenderers = []
          legs = []

          for (let i = 0; i < stopsLatLng.length - 1; i++) {
            const renderer = new googleMaps.DirectionsRenderer({
              map: map,
              draggable: true,
              markerOptions: {icon: 'https://maps.gstatic.com/mapfiles/dd-via.png'},
              polylineOptions: {
                strokeWeight: 2,
                strokeColor: '#4b3863',
                zIndex: 20
              },
              preserveViewport: true
            })

            let lastOrigin = stopsLatLng[i]
            let lastDestination = stopsLatLng[i + 1]

            renderer.addListener('directions_changed', () => {
              const directions = renderer.getDirections()
              legs[i] = directions.routes[0].overview_path
              const {origin: currentOrigin, destination: currentDestination} = directions.request
              if (i > 0 && currentOrigin !== lastOrigin) {
                lastOrigin = currentOrigin
                const directions = dirRenderers[i - 1].getDirections()
                const {origin, waypoints} = directions.request
                updateDirections(dirRenderers[i - 1], origin, currentOrigin, waypoints)
              } else if (i < stopsLatLng.length - 1 && currentDestination !== lastDestination) {
                lastDestination = currentDestination
                const directions = dirRenderers[i + 1].getDirections()
                const {destination, waypoints} = directions.request
                updateDirections(dirRenderers[i + 1], currentDestination, destination, waypoints)
              } else {
                let points = legs.reduce((all, leg) => all.concat(leg))
                scope.newPath = google.maps.geometry.encoding.encodePath(points)
              }
            })

            await updateDirections(renderer, lastOrigin, lastDestination)

            dirRenderers.push(renderer)
            legs.push([stopsLatLng[i], stopsLatLng[i + 1]])
          }
        }

        scope.updatePath = () => {
          if (!scope.newPath) return
          scope.path = scope.newPath
          scope.newPath = ''
          dirRenderers.forEach((renderer) => { renderer.setMap(null) })
        }

        scope.clearPath = () => {
          scope.path = ''
          scope.newPath = ''
          mapPath.setMap(null)
          dirRenderers.forEach((renderer) => { renderer.setMap(null) })
        }
      })
    }
  }
}
