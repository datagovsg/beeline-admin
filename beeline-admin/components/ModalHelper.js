import {mapGetters, mapActions, mapState} from 'vuex'

module.exports = {
  components: {
    // All the modals I need...
    CreateTripsDatePicker: require('../modals/CreateTripsDatePicker.vue').default,
    CommonModals: require('../modals/CommonModals.vue').default,
    TripEditor: require('../modals/TripEditor.vue').default,
    StopsPopup: require('../modals/StopsPopup.vue').default,
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
