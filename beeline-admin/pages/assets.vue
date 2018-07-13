<template>
  <div class="container withnav">
    
    

    <table class="table table-striped assets-table" v-if="assets">
      <thead>
        <tr>
          <th>Asset</th>
          <th>Preview</th>
          <th>View</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="asset in sortedAssets" :key="asset.id">
          <td>{{asset.id}}</td>
          <td @click="editAsset(asset)">{{asset.preview}}</td>
          <td>
            <a :href="assetUrl(asset)">View</a>
            <a :href="assetUrl(asset, true)">View as HTML</a>
          </td>
          <td>
            <button class="btn btn-danger delete-button" @click="deleteAsset(asset)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <button class="btn btn-default new-asset-button" @click="editAsset(null)">New</button>
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
    assets: []
  }),
  mounted () {
    return this.requery()
  },
  computed: {
    ...mapGetters(['axios']),

    sortedAssets () {
      return _.sortBy(this.assets, 'id')
    }
  },
  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal', 'showErrorModal']),

    assetUrl (asset, renderMarkdown) {
      return `${process.env.BACKEND_URL}/assets/${asset.id}` +
        (renderMarkdown ? '/renderMarkdown' : '')
    },

    deleteAsset (asset) {
      return this.showModal({
        component: 'CommonModals',
        props: {
          type: 'confirm',
          title: `Delete asset ${asset.id}`,
          message: `Are you sure you want to delete ${asset.id}`,
        }
      })
      .then((response) => {
        if (response) {
          return this.spinOnPromise(
            this.axios.delete(`/assets/${asset.id}`)
          )
          .then(() => this.requery())
        }
      }, () => {})
      .catch(this.showErrorModal)
    },

    requery () {
      this.spinOnPromise(this.axios.get(`/assets`)
      .then((response) => {
        this.assets = response.data
      }))
      .catch(this.showErrorModal)
    },

    editAsset (asset) {
      this.showModal({
        component: 'EditAsset',
        props: {
          type: 'confirm',
          title: asset ? `Edit asset ${asset.id}` : 'New asset',
          assetId: asset ? asset.id : null
        }
      })
      .then(({data, id}) => {
        return this.spinOnPromise(
          this.axios.put(`/assets/${id}`, {data})
          .then(() => {
            this.requery()
          })
        )
        .catch((err) => {
          console.log(err);
        })
      }, () => { /* rejected */ })
      .catch(this.showErrorModal)
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
    'manage-notifications', 'manage-customers',
  ],
  manageCompany: ['manage-company'],
  manageAdmins: ['manage-admins'],
}

function mapPermissions(permissions) {
  return _(permissions)
    .keys()
    .filter(key => permissions[key])
    .map(value => PermissionsMap[value])
    .flatten()
    .value()
}
function reverseMapPermissions(permissionList) {
  const permissions = {};

  if (!permissionList)  return permissions;

  _.each(PermissionsMap, (permissionGroup, groupName) => {
    permissions[groupName] = _.every(
      permissionGroup,
      p => permissionList.indexOf(p) !== -1
    )
  })
  return permissions;
}

</script>
