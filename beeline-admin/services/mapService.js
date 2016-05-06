

export default function() {

  this.defaultMapOptions = function (options) {
    return _.assign({
      center: {latitude: 1.370244, longitude: 103.823315},
      zoom: 11,
      bounds: { // so that autocomplete will mainly search within Singapore
          northeast: {
              latitude: 1.485152,
              longitude: 104.091837
            },
          southwest: {
              latitude: 1.205764,
              longitude: 103.589899
            }
        },
      control: {},
      options: {
          disableDefaultUI: true,
          styles: [{
              featureType: "poi",
              stylers: [{
                  visibility: "off"
                }]
            }],
          draggable: true
        },
      markers: [],
      lines: [],
    }, options || {});
  }

}
