import {mapGetters, mapActions, mapState} from 'vuex'

module.exports = {
  components: {
    // All the modals I need...
    CreateTripsDatePicker: require('../modals/CreateTripsDatePicker.vue'),
    CommonModals: require('../modals/CommonModals.vue'),
    TripEditor: require('../modals/TripEditor.vue'),
    StopsPopup: require('../modals/StopsPopup.vue'),
  },
  computed: {
    ...mapState('modals', ['modalStack'])
  },
  render(h) {
    return h(
      'div',
      this.modalStack.map(({options: {component, props}, resolve, reject}, index) => {
        return h(
          component,
          {
            props: {
              ...props,
              name: `modal-${index}`,
              value: true,
            },
            on: {
              resolve: resolve,
              reject: reject
            },
            key: `modal-${index}`
          }
        )
      })
    )
  },
}
