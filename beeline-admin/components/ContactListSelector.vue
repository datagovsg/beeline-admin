<template>
  <select @input="$emit('input', parseInt($event.target.value))">
    <option disabled :selected="!value"></option>
    <option v-for="clist in sortedContactLists"
        :key="clist.id"
        :value="clist.id"
        :selected="clist.id == value">
      {{clist.description}}
    </option>
  </select>
</template>

<script>
import {mapActions, mapState} from 'vuex'
import _ from 'lodash'
import CompanyIdMixin from '../mixins/CompanyIdMixin'

export default {
  props: ['value', 'companyId'],
  mixins: [CompanyIdMixin],
  computed: {
    ...mapState('companyShared', ['contactLists']),
    sortedContactLists () {
      return this.contactLists ? _.sortBy(this.contactLists, 'name') : []
    }
  },
  created () {
    this.fetch('contactLists')
  },
  methods: {
    ...mapActions('companyShared', ['fetch'])
  }
}
</script>
