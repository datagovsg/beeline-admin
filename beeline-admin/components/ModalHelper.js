
module.exports = {
  data() {
    return {
      modalComponent: null,
      modalProps: null
    }
  },
  components: {
    // All the modals I need...
    CreateTripsDatePicker: require('../modals/CreateTripsDatePicker.vue'),
    CommonModals: require('../modals/CommonModals.vue'),
  },
  render(h) {
    if (this.modalComponent) {
      return h(
        this.modalComponent,
        {
          props: this.modalProps,
          ref: 'theModal'
        }
      )
    } else {
      return ''
    }
  },
  methods: {
    show(comp, props) {
      this.modalComponent = comp
      this.modalProps = props

      return new Promise((resolve, reject) => {
        this.$nextTick(() => {
          this.$refs.theModal.show()
          .then(resolve, reject)
        })
      })
    }
  }
}
