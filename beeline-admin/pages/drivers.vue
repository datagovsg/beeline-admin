<template>
  <div>
    <h1>Drivers</h1>
    <div v-if="!companyId">
      <p>
        You are Superadmin! Pick the company you would like to edit
        from the top right hand corner
      </p>
    </div>
    <button @click="addDriver()" class="btn btn-primary btn-lg">
      Add a new driver
    </button>
    <table class="table table-condensed table-striped table-bordered">
      <thead>
        <tr>
          <th>No.</th>
          <th>Name</th>
          <th>Telephone</th>
          <th>Remarks</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(driver, index) in drivers" :key="index">
          <td>
            {{index + 1}}
          </td>
          <td>
            {{driver.transportCompanies[0].driverCompany.name}}
          </td>
          <td>
            {{driver.telephone}}
          </td>
          <td>
            {{driver.transportCompanies[0].driverCompany.remarks}}
          </td>
          <td>
            <button class="btn btn-primary" @click="updateDriverName(driver)">
              Edit Name and Remarks
            </button>
            <button class="btn btn-danger" @click="deleteDriver(driver.id)">
              Delete Driver
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script>
import assert from 'assert'
import querystring from 'querystring'
import {mapGetters, mapActions, mapState} from 'vuex'
import _ from 'lodash'
import * as resources from '../stores/resources'
import filters from '../filters'
import dateformat from 'dateformat'

export default {
  props: ['companyId'],
  data: () => ({ drivers: [] }),
  computed: {
    ...mapGetters(['axios'])
  },
  watch: {
    companyId: {
      immediate: true,
      handler (h) {
        if (h) {
          return this.query()
        } else {
          this.drivers = []
        }
      }
    }
  },
  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal', 'showErrorModal', 'confirm']),
    async query () {
      if (this.companyId) {
        await this.spinOnPromise(
          this.axios.get(`/companies/${this.companyId}/drivers`)
            .then(response => {
              this.drivers = response.data
            })
        )
      }
    },
    async deleteDriver (did) {
      if (await this.confirm({title: 'Are you sure you want to delete?'})) {
        return this.spinOnPromise(
          this.axios.delete(`/companies/${this.companyId}/drivers/${did}`)
            .catch(this.showErrorModal)
            .then(this.query)
        )
      }
    },
    async updateDriverName (driver) {
      const name = await this.showModal({
        component: 'CommonModals',
        props: {
          type: 'prompt',
          title: 'Driver Name',
          message: 'Please enter the name of the Driver.',
          defaultValue: driver.transportCompanies[0].driverCompany.name
        }
      })

      if (!name) {
        return
      }

      const remarks = await this.showModal({
        component: 'CommonModals',
        props: {
          type: 'prompt',
          title: 'Remarks for Driver',
          message: 'Any remarks?',
          defaultValue: driver.transportCompanies[0].driverCompany.remarks
        }
      })

      await this.spinOnPromise(this.axios
        .put(
          `/companies/${this.companyId}/drivers/${driver.id}`,
          { name, remarks }
        )
        .catch(this.showErrorModal)
        .then(this.query)
      )
    },
    async addDriver (driver) {
      const promptForRequiredValue = async props => {
        let value
        while (!value) {
          value = await this.showModal({
            component: 'CommonModals',
            props
          })
          if (!value) {
            await this.showErrorModal({ message: 'This value is required' })
          }
        }
        return value
      }

      const telephone = await promptForRequiredValue({
        type: 'prompt',
        title: 'Driver Telephone',
        message: 'Please enter the 8-digit Mobile No. starting with the digit 8 or 9.'
      })

      const name = await promptForRequiredValue({
        type: 'prompt',
        title: 'Driver Name',
        message: 'Please enter the name of the Driver.'
      })

      const remarks = await promptForRequiredValue({
        type: 'prompt',
        title: 'Remarks for Driver',
        message: 'Any remarks?'
      })

      await this.spinOnPromise(this.axios
        .post(
          `/companies/${this.companyId}/drivers`,
          { telephone, name, remarks }
        )
        .catch(this.showErrorModal)
        .then(this.query)
      )
    }
  }
}

</script>
