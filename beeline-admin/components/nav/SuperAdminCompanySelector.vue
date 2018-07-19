<template>
<select @input="navigateToCompany($event.target.value)"
  class="form-control-condensed">
  <option value="null" :selected="!currentCompany">(All)</option>
  <option v-for="companyId in availableCompanies"
    :key="companyId"
    :value="companyId" :selected="currentCompany === companyId">
    {{companiesById[companyId].name}}
  </option>
</select>
</template>

<script>
import {mapGetters, mapState, mapActions, mapMutations} from 'vuex'

export default {
  created () {
    this.fetch(['companies'])
  },
  computed: {
    ...mapGetters(['axios']),
    ...mapState('shared', ['companies']),
    ...mapState('auth', ['idToken', 'availableCompanies']),
    ...mapGetters('shared', ['companiesById']),

    currentCompany () {
      return Number(this.$route.params.companyId)
    }
  },
  methods: {
    ...mapMutations('auth', ['setAvailableCompanies']),
    ...mapActions('shared', ['fetch']),

    navigateToCompany (id) {
      this.$router.push({
        query: this.$route.query,
        params: {
          ...this.$route.params,
          companyId: id
        }
      })
    }
  }
}
</script>
