<template>
<select @input="navigateToCompany($event.target.value)"
  class="form-control-condensed">
  <option value="null" :selected="!currentCompany">(All)</option>
  <option v-for="company in availableCompanies"
    :key="company.id"
    :value="company.id" :selected="currentCompany === company.id">
    {{company.name}}
  </option>
</select>  
</template>

<script>
import {mapGetters, mapState, mapActions} from 'vuex'

export default {
  created () {
    this.fetch(['companies'])
  },
  computed: {
    ...mapGetters(['axios']),
    ...mapState('shared', ['companies']),
    ...mapState('auth', ['idToken']),
    ...mapGetters('shared', ['companiesById']),

    currentCompany () {
      return Number(this.$route.params.companyId)
    },

    availableCompanies () {
      return this.whoami && this.companies &&
        (this.whoami.role === 'superadmin'
          ? this.companies
          : this.whoami.transportCompanyIds.map(tci => this.companiesById[tci])
        )
    }
  },
  asyncComputed: {
    whoami () {
      if (!this.idToken) {
        return null
      }
      return this.axios.get('/admins/whoami')
      .then(r => r.data)
    },
  },
  methods: {
    ...mapActions('shared', ['fetch']),
    navigateToCompany (id) {
      this.$router.push({
        query: this.$route.query,
        params: {
          ...this.$route.params,
          companyId: id,
        }
      })
    }
  }
}
</script>
