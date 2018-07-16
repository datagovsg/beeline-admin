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
        {{ startDate ? f.date(startDate, 'dd mmm yyyy') : '...'}}
      </td>
      <td>
        {{ endDate ? f.date(endDate, 'dd mmm yyyy') : '...'}}
      </td>
    </tr>
  </table>
  <table class="routeSummary">
    <tr> <!-- 1/4 row of span -->
      <th rowspan="4" width="3%">{{ f.date(route.trips[0].date, 'mmm', true) }}</th>

      <th v-for="(pricing, index) in route.priceSummary" :key="index" :colspan="pricing.count" class="price-summary">
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
        <th v-for="(trip, tripIndex) in route.tripsByDay"
          :key="tripIndex"
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
        <th v-for='(trip, tripIndex) in route.tripsByDay'
          :key="tripIndex"
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
        <td v-for='(trip, tripIndex) in route.tripsByDay'
          :key="tripIndex"
          :class="{
            'has-trip': trip,
            today: trip && trip.date.getTime() === today,
            cancelled: trip && trip.status === 'cancelled',
            void: trip && trip.status === 'void'
          }" class="passenger-count day">
          <template v-if="trip">
            <a :href="`#/c/${route.transportCompanyId}/bookings?tripId=${trip.id}`">
              {{trip.availability.seatsBooked || '0'}}
            </a>
          </template>
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
import {mapGetters} from 'vuex'
import filters from '@/filters'

export default {
  props: ['route', 'index'],

  computed: {
    ...mapGetters(['axios']),
    f: () => filters,

    today: () => {
      const d = new Date()
      return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
    },

    weekdays: () => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],

    startDate () {
      return this.dates && new Date(this.dates.firstDate)
    },
    endDate () {
      return this.dates && new Date(this.dates.lastDate)
    }
  },

  asyncComputed: {
    dates () {
      if (!this.route) return null

      return this.axios.get(`/routes/${this.route.id}?includeDates=true`)
        .then(response => {
          return response.data.dates
        })
    }
  }
}
</script>
