<template>
  <select :value="value" @input="$emit('input', $event.target.value)">
    <option disabled></option>
    <option v-for="company in sortedCompanies" :value="company.id">
      {{company.name}}
    </option>
  </select>
</template>

<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import * as resources from '../stores/resources'
import _ from 'lodash'
const filters = require('../filters')

export default {
  props: ['value'],
  created () {
    this.fetch('companies')
  },
  computed: {
    ...mapState('shared', ['companies']),
    sortedCompanies () {
      return _.sortBy(this.companies, 'name')
    }
  },
  methods: {
    ...mapActions('shared', ['fetch'])
  }
}
</script>
