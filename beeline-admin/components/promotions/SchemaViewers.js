import dateformat from 'dateformat'
import {mapActions, mapState, mapGetters} from 'vuex'

export const DateFormatViewer = {
  props: {
    value: {},
    format: {},
    utc: {default: false},
  },
  render (h) {
    // FIXME: why doesn't Vue expose the text node constructor?
    return this._v(this.value ? dateformat(this.value, this.format, this.utc) : '')
  }
}

export const ContactListViewer = { // Stub
  props: ['value'],
  render (h) {
    const matchingContactList = (this.contactLists && this.contactLists.find(c => c.id === this.value))
    return h(
      'a',
      {domProps: {href: `#/c/${this.companyId}/contactLists/${this.value}`}},
      [
        matchingContactList ? matchingContactList.description : this.value
      ]
    )
  },
  created () {
    this.fetch(['contactLists'])
  },
  computed: {
    ...mapState('companyShared', ['contactLists', 'companyId'])
  },
  methods: {
    ...mapActions('companyShared', ['fetch'])
  }
}

export const CompanyIdViewer = { // Stub
  props: ['value'],
  render (h) {
    return h(
      'a',
      {domProps: {href: `#/c/${this.value}/companies`}},
      [(this.companiesById && this.companiesById[this.value])
        ? this.companiesById[this.value].name
        : `#${this.value}`]
    )
  },
  created () {
    this.fetch(['companies'])
  },
  computed: {
    ...mapGetters('shared', ['companiesById']),
    ...mapState('companyShared', ['companyId']),
  },
  methods: {
    ...mapActions('shared', ['fetch'])
  }
}

export const RouteIdsViewer = {
  props: ['value'],
  render (h) {
    const contents = []

    for (let v of this.value) {
      const route = this.allRoutesById[v]
      if (contents.length !== 0) {
        contents.push(', ')
      }
      contents.push(h(
        'a',
        {domProps: {href: `#/c/${route && route.transportCompanyId}/trips/${v}/route`}},
        [(route && route.label) || `#${v}`]
      ))
    }

    return h(
      'span',
      contents
    )
  },
  created () {
    this.fetch(['allRoutes'])
  },
  computed: {
    ...mapGetters('shared', ['allRoutesById'])
  },
  methods: {
    ...mapActions('shared', ['fetch'])
  }
}
