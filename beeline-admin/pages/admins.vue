<template>
  <div class="container withnav drivers">

    <div class="row">
      <div class="col-lg-12">
        <h1>Manage Admins Users</h1>
        <button @click="addAdmin()" class="btn btn-primary btn-lg add-admin">
          Add a new Admin
        </button>
        <table class="table table-condensed table-striped table-bordered admin-table">
          <thead>
            <tr>
              <th rowspan="2">No.</th>
              <th rowspan="2">Email<br> Name</th>
              <th colspan="6" class="permissions">Permissions</th>
              <th rowspan="2">Actions</th>
            </tr>
            <tr>
              <th class="permission-type">
                Basic permissions
                <div class="permission-details">
                  View drivers, transactions
                </div>
              </th>
              <th class="permission-type">Issue refunds</th>
              <th class="permission-type">Issue tickets</th>
              <th class="permission-type">
                Manage operations
                <div class="permission-details">
                  Edit routes, manage drivers, update trip status, SMS passengers
                </div>
              </th>
              <th class="permission-type">Edit company information</th>
              <th class="permission-type">Manage administrators
                <div class="permission-details">
                  Add, edit, remove admin users
                </div></th>
              <!-- <th></th> -->
            </tr>
          </thead>
          <tbody>
            <tr v-for="(admin, index) in sortedAdmins" :key="admin.id" name="adminForm">
              <td>
                {{index + 1}}
              </td>
              <td v-if="admin.id">
                {{admin.email}}
                <br/>
                {{admin.name}}
              </td>
              <td v-if="!admin.id" class="form-inline">
                <input type="email" v-model="admin.email" class="form-control"
                  ng-required="true"
                  placeholder="john@example.com">
                <br/>
                <input type="text" v-model="admin.name" class="form-control"
                  placeholder="John Doe">
              </td>

              <td><input type="checkbox" v-model="admin.permissions.basic"></td>
              <td><input type="checkbox" v-model="admin.permissions.refund"></td>
              <td><input type="checkbox" v-model="admin.permissions.issueTickets"></td>
              <td><input type="checkbox" v-model="admin.permissions.operations"></td>
              <td><input type="checkbox" v-model="admin.permissions.manageCompany"></td>
              <td><input type="checkbox" v-model="admin.permissions.manageAdmins"></td>

              <td>
                <button class="btn btn-success update-button" @click="updateAdmin(admin, adminForm)">
                  <!-- v-if="adminForm.$dirty"
                  :disabled="adminForm.$invalid"> -->
                  Update
                </button>
                <button class="btn btn-danger delete-button" @click="deleteAdmin(admin)">
                  <!-- v-if="adminForm.$pristine && admin.id"> -->
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
  data: () => ({
    admins: []
  }),
  mounted () {
    return this.requery()
  },
  computed: {
    ...mapGetters(['axios']),

    sortedAdmins () {
      return _.sortBy(this.admins, 'id')
    }
  },
  watch: {
    companyId: {
      immediate: true,
      handler (h) {
        this.requery()
      }
    }
  },
  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal', 'showErrorModal']),

    blankAdmin () {
      return {
        id: null,
        email: '',
        name: '',
        permissions: Object.keys(PermissionsMap)
          .reduce((acc, key) => {
            acc[key] = false
            return acc
          }, {})
      }
    },

    requery () {
      this.spinOnPromise(this.axios.get(`/companies/${this.companyId}/admins`)
        .then((response) => {
          this.admins = response.data.map(admin => ({
            ...admin,
            permissions: reverseMapPermissions(
              admin.transportCompanies[0].adminCompany.permissions
            )
          }))
        }))
        .catch((err) => {
          console.log(err.response)
        })
    },

    addAdmin () {
      this.admins.push(this.blankAdmin())
    },

    updateAdmin (admin) {
      const updatePromise = (admin.id === null)
        ? this.axios.post(`/companies/${this.companyId}/admins`, {
          ...admin,
          permissions: mapPermissions(admin.permissions)
        })
        : this.axios.put(`/companies/${this.companyId}/admins/${admin.id}`, {
          permissions: mapPermissions(admin.permissions)
        })

      this.spinOnPromise(updatePromise)
        .then(() => this.requery())
        .catch(e => console.error(e))
    },

    deleteAdmin (admin) {
      this.showModal({
        component: 'CommonModals',
        props: {
          type: 'confirm',
          title: `Delete admin ${admin.name}`,
          message: `Are you sure you want to delete ${admin.name}`
        }
      })
        .then((result) => {
          if (result) {
            return this.spinOnPromise(
              this.axios.delete(`/companies/${this.companyId}/admins/${admin.id}`)
            )
              .then(() => {
                this.requery()
              })
              .catch((err) => {
                console.log(err)
              })
          }
        })
        .then(() => this.requery())
    }
  }
}

const PermissionsMap = {
  basic: ['view-drivers', 'view-admins', 'view-transactions', 'monitor-operations'],
  refund: ['refund'],
  issueTickets: ['issue-tickets'],
  operations: [
    'manage-routes', 'manage-drivers',
    'drive', 'update-trip-status',
    'message-passengers', 'view-passengers',
    'manage-notifications', 'manage-customers'
  ],
  manageCompany: ['manage-company'],
  manageAdmins: ['manage-admins']
}

function mapPermissions (permissions) {
  return _(permissions)
    .keys()
    .filter(key => permissions[key])
    .map(value => PermissionsMap[value])
    .flatten()
    .value()
}
function reverseMapPermissions (permissionList) {
  const permissions = {}

  if (!permissionList) return permissions

  _.each(PermissionsMap, (permissionGroup, groupName) => {
    permissions[groupName] = _.every(
      permissionGroup,
      p => permissionList.indexOf(p) !== -1
    )
  })
  return permissions
}

</script>
