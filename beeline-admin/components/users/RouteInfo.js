import {mapGetters} from 'vuex'
import querystring from 'querystring'

export default {
  props: ['routeId'],

  render (h) {
    return this.$scopedSlots.default(this.route)
  },

  computed: {
    ...mapGetters(['axios']),
  },

  asyncComputed: {
    route () {
      if (!this.routeId) return null

      return this.axios.get(`/routes/${this.routeId}?` + querystring.stringify({
        includeIndicative: true,
        includeDates: true,
        includeTrips: false,
      }))
      .then(async (response) => {
        const tripId = response.data.indicativeTrip.nextTripId ||
          response.data.indicativeTrip.lastTripId

        const trip = (await this.axios.get(`/trips/${tripId}`)
          .then((response) => response.data))
        
        return {
          ...response.data,
          dates: {
            ...response.data.dates,
            firstDate: new Date(response.data.dates.firstDate),
            lastDate: new Date(response.data.dates.lastDate),
          },
          trips: [trip],
        }
      })
    }
  }
}
