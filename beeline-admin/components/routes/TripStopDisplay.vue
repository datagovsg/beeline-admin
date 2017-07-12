<template>
  <div v-if="stop">
  {{
    f.date(
      stop.time,
      'HH:MM'
    )
  }}

  <span class="label stop-board" title="Boarding Stop"
      v-if="stop.canBoard">B</span>
  <span class="label stop-alight" title="Alighting Stop"
      v-if="stop.canAlight">A</span>
  </div>
</template>
<script>
const filters = require('../../filters')
export default{
  props: ['stop'],
  computed: {
    f() {return filters}
  }
}
</script>
