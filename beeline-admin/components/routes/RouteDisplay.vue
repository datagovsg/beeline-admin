<script>
export default {
  props: ['route']
}
</script>

<template>
  <div class="route-display" v-if="route">
    <div class="route-label">
      {{route.label}}
    </div>
    <div class="running-dates">
      {{f.date(route.dates.firstDate, 'dd mmm yyyy')}}
      &mdash;
      {{f.date(route.dates.lastDate, 'dd mmm yyyy')}}
    </div>
    <table class="borderless">
      <tr>
        <th>
          From
        </th>
        <td>
          {{route.from}}
        </td>
      </tr>
      <tr>
        <th>
          To
        </th>
        <td>
          {{route.to}}
        </td>
      </tr>
      <tr>
        <th>
          Route ID to ping:
        </th>
        <td>
          {{route.id}}
        </td>
      </tr>
    </table>
  </div>
</template>
<script>
const filters = require('../../filters')

export default {
  props: ['route'],
  computed: {
    f() { return filters },
  }
}
</script>
