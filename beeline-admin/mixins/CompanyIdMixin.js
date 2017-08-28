import {mapActions} from 'vuex'

/**
This mixin watches the companyId property on a page, and updates the
`companyShared` store with it.
**/
export default {
  props: ['companyId'],

  watch: {
    companyId: {
      immediate: true,
      handler (cid) {
        this.updateCompanyId(cid)
      }
    }
  },

  methods: {
    ...mapActions('companyShared', ['updateCompanyId'])
  }
}
