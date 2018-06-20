<template>
<div>
  <table class="routeInfo">
    <tr>
      <td class="text-left">
          No. {{index + 1}}
      </td>
    </tr>

    <tr>
      <th class="purpleID" width="10%">
        Route ID
      </th>
      <th width="10%">
        Route Label
      </th>
      <th width="50%">
        Route Name
      </th>
      <th width="15%">
        Start Date
      </th>
      <th width="15%">
        End Date
      </th>
    </tr>
    <tr>
      <td class="purpleID">
        <h2>{{route.id}}</h2>
      </td>
      <td>
        {{route.label}}
      </td>
      <td>
        {{ f.date(route.trips[0].tripStops[0].time, 'HH:MM TT') }} - {{route.from}}
        <br>
        {{ f.date(route.trips[0].tripStops[route.trips[0].tripStops.length-1].time, 'HH:MM TT') }} - {{route.to}}
      </td>
      <td>
        {{ route.startDate ? f.date(route.startDate, 'dd mmm yyyy') : '...'}}
      </td>
      <td>
        {{ route.endDate ? f.date(route.endDate, 'dd mmm yyyy') : '...'}}
      </td>
    </tr>
  </table>
  <table class="routeSummary">
    <tr> <!-- 1/4 row of span -->
      <th rowspan="4" width="3%">{{ f.date(route.trips[0].date, 'mmm', true) }}</th>

      <th v-for="pricing in route.priceSummary" :colspan="pricing.count" class="price-summary">
        <span v-if="pricing.price !== undefined">
          <i class="glyphicon glyphicon-menu-left pull-left"></i>
          <span class="priceSummaryInfo">Price: ${{ f.number(pricing.price, '#,###.00')}}</span>
          <span class="priceSummaryInfo">
            Capacity: {{pricing.capacity}}
            <i class="glyphicon glyphicon-user"></i>
          </span>
          <i class="glyphicon glyphicon-menu-right pull-right"></i>
        </span>
      </th>
    </tr>

    <template v-if="route.tripsByDay">
      <tr> <!-- 2/4 row of span -->
        <th v-for='(trip, tripIndex) in route.tripsByDay'
          :class="{
            'has-trip': trip,
            today: trip && trip.date.getTime() === today,
            cancelled: trip && trip.status === 'cancelled',
            void: trip && trip.status === 'void'
          }" class="summary-day day">
          {{tripIndex + 1}}
        </th>
      </tr>
      <tr> <!-- 3/4 row of span -->
        <th v-for='trip in route.tripsByDay'
          :class="{
            'has-trip': trip,
            today: trip && trip.date.getTime() === today,
            cancelled: trip && trip.status === 'cancelled',
            void: trip && trip.status === 'void'
          }" class="weekday day">
          {{ trip ? weekdays[trip.date.getUTCDay()] : '' }}
        </th>
      </tr>
      <tr> <!-- 4/4 row of span -->
        <td v-for='trip in route.tripsByDay'
          :class="{
            'has-trip': trip,
            today: trip && trip.date.getTime() === today,
            cancelled: trip && trip.status === 'cancelled',
            void: trip && trip.status === 'void'
          }" class="passenger-count day">
          <a ui-sref="^.bookings({tripId: trip.id})">
          {{trip ? (trip.availability.seatsBooked || '0') : ''}}
          </a>
        </td>
      </tr>
    </template>
    <template v-else>
      <tr>
        <td>Loading...</td>
      </tr>
    </template>
  </table>
</div>
</template>

<script>
import filters from '@/filters'

export default {
  props: ['route', 'index'],

  computed: {
    f: () => filters,

    today: () => {
      const d = new Date()
      return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
    },

    weekdays: () => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  },
}
</script>