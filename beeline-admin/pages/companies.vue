<template>
  <div>
    
    

    <div v-if="!companyId">
      <div class="col-sm-12">
        <h4 class="text-danger">
          You are Superadmin! Pick the company you would like to edit from the top right hand corner
        </h4>
      </div>
    </div>
    <div v-else-if="company">
      <div class="col-sm-12">
        <h1>Manage Company Profile</h1>
        <p>
          The following information will be listed in the contact information of the Beeline App.
        </p>
      </div>
      <div class="col-sm-4">
        <form method="POST" :action="companyLogoUrl" enctype="multipart/form-data" >
          <p>
            Curent Logo:
          </p>
          <div>
            <img :src="companyLogoUrl" class="logo">
          </div>
          <div class="form-group">
            <input type="file" name="logo">
            <input type="hidden" name="sessionToken" :value="idToken">
            <button type="submit" class="btn btn-primary btn-lg">Submit</button>
          </div>
        </form>
      </div>

      <br clear="both" />
      <hr/>

      <div class="form-horizontal" name="updateCompany">
        <div class="form-group">
          <label class="col-sm-2 control-label">Name</label>
          <div class="col-sm-8">
          <input type="text" v-model="company.name" class="form-control" disabled />
          </div>
        </div>
        <div class="form-group">
          <label class="col-sm-2 control-label">Email</label>
          <div class="col-sm-8">
            <input type="text" v-model="company.email" class="form-control" />
          </div>
        </div>
        <div class="form-group">
          <label class="col-sm-2 control-label">Contact No.</label>
          <div class="col-sm-8">
            <input type="text" v-model="company.contactNo" class="form-control" />
          </div>
        </div>
        <div class="form-group">
          <label class="col-sm-2 control-label">SMS Operator Code</label>
          <div class="col-sm-8">
            <input type="text" v-model="company.smsOpCode" class="form-control" />
            <!-- TODO: ng-pattern="'[a-zA-Z0-9]{0,11}'" -->
          </div>
        </div>
        <div class="form-group">
          <label class="col-sm-2 control-label">Terms and Conditions</label>
          <div class="col-sm-8">
            <textarea v-model="company.terms" class="form-control"></textarea>
          </div>
        </div>
        <div class="form-group">
          <label class="col-sm-2 control-label">Features</label>
          <div class="col-sm-8">
            <textarea v-model="company.features" class="form-control"></textarea>
          </div>
        </div>
        <div class="col-sm-8">
          <button @click="updateCompanyInfo()" class="btn btn-primary btn-lg">Save</button>
        </div>
      </div>

      <br clear="both" />
      <hr/>

      <div class="col-sm-8">
        <h3>Connect Stripe Account</h3>

        <div v-if="company.hasClientId">
          <h4 class="text-success">
            Your Stripe Live Account is connected!
          </h4>
        </div>

        <div v-else>
          <h4 class="text-danger">
            Your Stripe Live Account is not connected!
          </h4>
          <p>
            Please set up and login to your Stripe account in another browser tab before you click on the button below.
          </p>
          <button v-if="!isSuperAdmin" @click="stripeConnect" class="btn btn-primary btn-lg">
            Connect Stripe account
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.logo {
  max-width: 300px;
  max-height: 300px;
}
</style>
<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import * as resources from '../stores/resources'
import _ from 'lodash'
const filters = require('../filters')

export default {
  props: ['companyId'],
  data () {
    return {
      company: null
    }
  },
  computed: {
    ...mapState('auth', ['idToken']),
    ...mapState('shared', ['companies']),
    ...mapGetters(['axios', 'isSuperAdmin']),
    ...mapGetters('shared', ['companiesById']),

    f: () => filters,

    companyLogoUrl () {
      return `${process.env.BACKEND_URL}/companies/${this.companyId}/logo`
    },
  },
  watch: {
    companyId: {
      immediate: true,
      handler (h) {
        const promise = this.$fetchPromise =
          this.fetch('companies')
          .then(() => {
            if (promise !== this.$fetchPromise) return // superseded
            const matchingCompany = this.companies.find(c => c.id === Number(this.companyId))

            if (!matchingCompany) {
              this.alert({
                title: `The company with id of ${this.companyId} was not found`
              })
            } else {
              this.company = matchingCompany && {...matchingCompany}
            }
          })
      }
    }
  },
  methods: {
    ...mapActions('shared', ['fetch']),
    ...mapActions('modals', ['showModal', 'showErrorModal', 'alert']),
    ...mapActions('resources', ['getRoute', 'saveRoute', 'createTripForDate']),
    ...mapActions('spinner', ['spinOnPromise']),

    updateCompanyInfo () {
      const updatePromise = this.axios.put(
        `/companies/${this.companyId}`,
        _.pick(this.company, ['terms', 'features', 'email', 'contactNo', 'smsOpCode'])
      )
      .then((response) => {
        this.company = response.data
      })

      this.spinOnPromise(updatePromise)
      .catch(this.showErrorModal);
    },

    stripeConnect () {
      // Get the redirect URL from server
      this.axios.post(
        `/companies/${this.companyId}/stripeConnect`,
        { redirect: window.location.href }
      )
      .then((response) => {
        window.location.href = response.data
      })
      .catch(this.showErrorModal)
    }
  }
}
</script>
