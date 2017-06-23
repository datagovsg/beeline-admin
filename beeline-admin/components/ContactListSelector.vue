<template>
  <select :value="value" @input="$emit('input', $event.target.value)">
    <option disabled></option>
    <option v-for="clist in sortedContactLists" :value="clist.id">
      {{clist.description}}
    </option>
  </select>
</template>

<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import * as resources from '../shared/resources'
import _ from 'lodash'
const filters = require('../filters')

export default {
  props: ['value', 'companyId'],
  data() {
    return {
      contactLists: []
    }
  },
  computed: {
    ...mapGetters(['axios']),
    promise () {
      return this.axios.get(`/companies/${this.companyId}/contactLists`)
    },
    sortedContactLists () {
      return _.sortBy(this.contactLists, 'name')
    }
  },
  watch: {
    promise: {
      immediate: true,
      handler(p) {
        if (p) {
          p.then((r) => this.contactLists = r.data)
        }
      }
    }
  },
  methods: {
    ...mapActions('shared', ['fetch'])
  }
}
</script>
