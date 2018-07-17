<template>
  <select :value="value" @input="$emit('input', $event.target.value)">
    <option disabled></option>
    <option v-for="company in sortedCompanies" :key="company.id" :value="company.id">
      {{company.name}}
    </option>
  </select>
</template>

<script>
import {mapActions, mapState} from 'vuex'
import _ from 'lodash'

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
