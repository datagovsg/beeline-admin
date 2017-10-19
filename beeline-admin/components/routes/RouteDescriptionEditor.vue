<template>
  <div class="editor-tabs-content" v-if="editRoute">
    <div class="row">
      <div class="col-lg-6">
        <form class="form-horizontal">
          <div class="form-group" v-if="isSuperAdmin">
            <label class="col-sm-2 control-label">
              Company
            </label>
            <div class="col-sm-10">
              <CompanySelector class="form-control" v-model="editRoute.transportCompanyId" />
            </div>
          </div>
          <div class="form-group">
            <label class="col-sm-2 control-label">Route Label</label>
            <div class="col-sm-10">
              <input type="text" class="form-control" v-model="editRoute.label" placeholder="Route Label" >
            </div>
          </div>
          <div class="form-group">
            <label class="col-sm-2 control-label">Route Name</label>
            <div class="col-sm-10">
              <input type="text" class="form-control" v-model="editRoute.name" placeholder="Route Name">
            </div>
          </div>
          <div class="form-group">
            <label class="col-sm-2 control-label">From</label>
            <div class="col-sm-10">
              <input type="text" class="form-control" v-model="editRoute.from" placeholder="Start Address" >
            </div>
          </div>
          <div class="form-group">
            <label class="col-sm-2 control-label">To</label>
            <div class="col-sm-10">
              <input type="text" class="form-control" v-model="editRoute.to" placeholder="End Address" >
            </div>
          </div>
          <div class="form-group">
            <label class="col-sm-2 control-label">Signage</label>
            <div class="col-sm-10">
              <input type="text" class="form-control" placeholder="Signage" name="signage" v-model="editRoute.notes.signage">
            </div>
          </div>
          <div class="form-group">
            <label class="col-sm-2 control-label">Description</label>
            <div class="col-sm-10">
              <input type="text" class="form-control"  placeholder="Route Description" v-model="editRoute.notes.description">
            </div>
          </div>
          <div class="form-group">
            <label class="col-sm-2 control-label">Schedule</label>
            <div class="col-sm-10">
              <input type="text" class="form-control" v-model="editRoute.schedule" placeholder="AM, Mon to Fri except P.H.">
            </div>
          </div>
          <div class="form-group">
            <label class="col-sm-2 control-label">Tags</label>
            <div class="col-sm-10">
              <TagsEditor v-model="editRoute.tags">
              </TagsEditor>
            </div>
          </div>
          <div class="form-group">
            <label class="col-sm-2 control-label">Route Pass Sizes (e.g. 5, 10, 15)</label>
            <div class="col-sm-10">
              <NumberArrayEditor v-model="editRoute.notes.passSizes" />
            </div>
          </div>
          <div class="form-group">
            <label for="inputPassword3" class="col-sm-2 control-label">Notes</label>
            <div class="col-sm-10">
              <textarea class="form-control" placeholder="Important Notes in Markdown" rows=12 v-model="editRoute.features" ></textarea>
            </div>
          </div>
        </form>
      </div>
      <div class="col-lg-6">
        <div class="path-editor">
          <PathEditor v-model="editRoute.path" :route="route || {trips: []}">
          </PathEditor>
        </div>
      </div>
    </div>
    <hr />
    <div class="row">
      <div class="col-lg-12">
        <div class="route-buttons">
          <button class="btn btn-primary" @click="doSaveRoute()" ng-disabled="!route || (form.routeEditorForm.$dirty && form.routeEditorForm.$invalid)">
            Save Route Changes
          </button>

          <div class="btn-group">
            <button class="btn btn-default" @click="doResetRoute()" v-if="!editRoute.id">
              Reset Route
            </button>
            <button class="btn btn-danger" @click="doDeleteRoute()" :disabled="!editRoute || !editRoute.id">
              Delete this Route
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import * as resources from '../../stores/resources'
const filters = require('../../filters')

export default {
  props: ['route', 'companyId'],
  data() {
    return {
      editRoute: null
    }
  },
  components: {
    PathEditor: require('./PathEditor.vue')
  },
  computed: {
    ...mapGetters(['axios', 'isSuperAdmin']),
    routePromise () {
      if (!this.routeId) {
        return Promise.resolve(null)
      } else {
        return this.getRoute({
          id: this.routeId,
          options: {
            includeDates: true,
            includeFeatures: true,
          }
        })
      }
    },
    activeTab () {
      return this.tabs.indexOf(this.tab)
    }
  },
  watch: {
    route: {
      immediate: true,
      handler (route) {
        this.editRoute = route ? {
          ...route,
          companyTags: route.companyTags || [],
          tags: route.tags || [],
          notes: {
            description: null,
            signage: null,
            passSizes: [],
            ...route.notes,
          }
        } : {
          // Blank route
          features: '',
          transportCompanyId: null,
          path: '',
          companyTags: [],
          tags: [],
          label: '',
          name: '',
          from: '',
          to: '',
          trips: [],
          id: null,
          schedule: '',
          notes: {
            description: null,
            signage: null,
          }
        }
      }
    },
  },
  methods: {
    ...mapActions('resources', ['getRoute', 'saveRoute', 'createTripForDate']),
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal']),

    doSaveRoute() {
      this.spinOnPromise(
        this.saveRoute(this.editRoute)
        .then((response) => {
          if (!this.editRoute.id) {
            window.location.hash = `#/c/${this.companyId}/trips/${response.data.id}/route`
          }
        })
      )
      .catch((err) => {
        return this.showModal({
          component: 'CommonModals',
          props: {
            type: 'alert',
            title: 'Error saving route',
            message: _.get(err, 'message')
          }
        })
      })
    },
    doResetRoute() {
      this.editRoute = blankRoute()
    },
    doDeleteRoute() {
      if (!this.editRoute.id) return

      this.showModal({
        component: 'CommonModals',
        props: {
          type: 'confirm',
          message: `Are you sure you want to delete ${this.route.label}`
        }
      })
      .then((confirm) => {
        if (confirm) {
          return this.spinOnPromise(this.axios.delete(`/routes/${this.route.id}`))
            .then(() => {
              window.location.hash = `#/c/${this.companyId}/routes`
            })
        }
      })
      .catch((err) => {
        return this.showModal({
          component: 'CommonModals',
          props: {
            type: 'alert',
            title: 'Error deleting route',
            message: _.get(err, 'message')
          }
        })
      })
    },
  }
}
</script>
