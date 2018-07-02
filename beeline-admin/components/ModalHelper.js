import {mapGetters, mapActions, mapState} from 'vuex'

/**
 * 19 Jun 2018: Manually import every modal used everywhere. This is because
 * when testing in PhantomJS the transpilation seems to create problems that results
 * in a stack overflow
 */
import CreateTripsDatePicker from '@/modals/CreateTripsDatePicker.vue'
import CommonModals from '@/modals/CommonModals.vue'
import TripEditor from '@/modals/TripEditor.vue'
import StopsPopup from '@/modals/StopsPopup.vue'
import EditAsset from '@/modals/EditAsset.vue'
import IssueTicket from '@/modals/IssueTicket.vue'

module.exports = {
  components: {
    // All the modals I need...
    CreateTripsDatePicker,
    CommonModals,
    IssueTicket,
    TripEditor,
    StopsPopup,
    EditAsset,
  },
  computed: {
    ...mapState('modals', ['modalStack'])
  },
  render(h) {
    return h(
      'div',
      this.modalStack.map(({options: {component, props}, resolve, reject}, index) => {
        if (!(component in this.$options.components)) {
          throw new Error(`Unknown modal ${component}. Known components are ${Object.keys(this.$options.components).join(', ')}`)
        }
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
