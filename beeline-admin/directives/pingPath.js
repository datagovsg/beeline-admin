export default ['uiGmapGoogleMapApi', function (uiGmapGoogleMapApi) {
  return {
    template: `
<!-- Route ping -->
<ui-gmap-polyline ng-if="path"
                  path="path"
                  idkey="idkey"
                  stroke="stroke"
></ui-gmap-polyline>

<ui-gmap-markers
  ng-if="pingSamples"
  models="pingSamples"
  coords="'coordinates'"
  idKey="'_idkey'"
  options="'_options'"
  events="events"
  modelsbyref="true"
  >
</ui-gmap-markers>`,
    scope: {
      icons: '=?',
      stroke: '=?',
      polylineOptions: '=?',

      idkey: '=?',
      pings: '=?',
    },
    link(scope, elem, attr) {
      var routePointOptions = {
        icon: {
          url: './img/routePtMarker.png',
        }
      };

      scope.events = {
        mouseover(marker, event, model) {
          scope.$emit('pingPath.pingSelected', model);
        },
      };

      scope.$watch('pings', (pings) => {
        if (!pings) {
          scope.path = null;
          scope.pingSamples = null;
          return;
        }
        scope.path = pings.map(ping => ({
          latitude: ping.coordinates.coordinates[1],
          longitude: ping.coordinates.coordinates[0],
        }));
        scope.pingSamples = _.filter(pings,
            (value, index) => index % 3 == 0);

        for (let ping of pings) {
          ping._options = routePointOptions;
          ping._idkey = scope.idkey + '--' + ping.id;
        }
      })

      scope.$watch('stroke', (stroke) => {
        console.log(scope.idkey);
        console.log(stroke);
      })

      uiGmapGoogleMapApi.then((googleMaps) => {
        _.assign(routePointOptions.icon, {
          scaledSize: new googleMaps.Size(15, 15),
          anchor: new googleMaps.Point(8, 8),
          zIndex: googleMaps.MAX_ZINDEX+5,
        })
      })
    }
  }
}]
