<template>
  <GmapMarker
    :position="f.pointToLatLng(tripStop.stop.coordinates)"
    :icon="tripStopIcon"
    @click="$emit('click', tripStop)"
    />
</template>

<script>
import filters from '../filters'
import leftPad from 'left-pad'

export default {
  props: ['tripStop', 'index'],
  computed: {
    f: () => filters,
    tripStopIcon () {
      const type = this.tripStop.canBoard ? 'Board' : 'Alight'
      const index = leftPad(this.index + 1, 3, '0')

      return {
        url: `./img/stop${type}${index}.png`,
        anchor: new google.maps.Point(15, 15),
        scaledSize: new google.maps.Size(30, 30)
      }
    }
  }
}
</script>
