<template>
  <Modal class="stops-popup" @cancel="reject()" :value="value" :clickToClose="false">
    <div class="modal-header">
      <p>
        Select an existing stop or pin a new stop location on the map
      </p>
    </div>
    <div class="modal-body">
      <div class="row">
        <div class="col-lg-12">
          <div class="map-editor-row">
            <div class="map-panel">
              <GmapMap :center="{lat: 1.38, lng: 103.8}" :zoom="12"
                @click="newStop($event)"
                :style="{width: '100%', height: '400px'}" ref="gmap">
                <!-- <ui-gmap-markers models="allStops" coords="'$latlng'" idKey="'id'"
                  type="'cluster'" typeOptions="{maxZoom: 18}" click="stopClicked"
                  dorebuildall="true" modelsbyref="true"
                  control="map.markersControl">
                </ui-gmap-markers> -->
                <GmapCluster :maxZoom="18">
                  <GmapMarker v-for="stop in stops"
                    :key="stop.id"
                    :position="geoJsonToLatLng(stop.coordinates)"
                    @click="selectedStop = stop"
                    :options="{optimized: true}"
                    />
                </GmapCluster>
                <GmapMarker :position="geoJsonToLatLng(editStop.coordinates)"
                  v-if="editStop && !editStop.id"
                  label="*"
                  />
              </GmapMap>
            </div>
            <div class="flex-row stops-edit-panel">
              <div v-if="editStop">
                  <h4>
                    <span v-if="!editStop.id">New Stop</span>
                    <span v-if="editStop.id">{{editStop.description}}</span>
                  </h4>
                  <div class="row">
                    <div class="form-horizontal stop-form">
                      <div class="form-group">
                        <label class="col-sm-4 control-label">Stop Description</label>
                        <div class="col-sm-7">
                          <input type="text" class="form-control" v-model="editStop.description" placeholder="Stop Description">
                        </div>
                      </div>
                      <div class="form-group">
                        <label class="col-sm-4 control-label">Road Name</label>
                        <div class="col-sm-7">
                          <input type="text" class="form-control" v-model="editStop.road" placeholder="Road Name">
                        </div>
                      </div>
                      <div class="form-group">
                        <label class="col-sm-4 control-label">Stop Label</label>
                        <div class="col-sm-7">
                          <input type="text" class="form-control" v-model="editStop.label" placeholder="Stop Label">
                        </div>
                      </div>

                      <div class="form-group">
                        <label class="col-sm-4 control-label">Stop Coordinates</label>
                        <div class="col-sm-7 form-inline">
                          <label class="col-sm-4 control-label">Latitude</label>
                          <input type="text" class="form-control" v-model.lazy.number="editStop.coordinates.coordinates[1]" placeholder="1.380">

                          <label class="col-sm-4 control-label">Latitude</label>
                          <input type="text" class="form-control" v-model.lazy.number="editStop.coordinates.coordinates[0]" placeholder="103.8">
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-lg-11">
                      <div class="pull-right">
                        <button class="btn btn-primary" @click="saveStop(editStop)">
                          Save Stop
                        </button>
                        <button class="btn btn-danger" v-show="editStop.id" @click="deleteStop(editStop)">
                          Delete Stop
                        </button>
                      </div>
                    </div>
                  </div>
              </div> <!-- if selected stop -->
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <span class="btn-group">
        <button class="btn btn-primary"
          :disabled="!selectedStop || !selectedStop.id"
          @click="resolve(selectedStop)">
          OK
        </button>
        <button class="btn btn-default" @click="reject()">
          Cancel
        </button>
      </span>
    </div>
  </modal>
</template>

<style lang="scss">
.map-editor-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  .map-panel {
    flex: 1 0 400px;
  }
  .stops-edit-panel {
    flex: 1 0 400px;
    padding: 0.5em 1em;
  }
}
</style>

<script>
const filters = require('../filters')
import {mapState, mapActions, mapGetters} from 'vuex'

import Modal from '@/modals/MyModal.vue'
import ModalMixin from '@/modals/ModalMixin'

export default {
  props: [
    'createNew', 'referenceTrip',
    'newTripDates', 'editedTrips'
  ],
  components: { Modal },
  data () {
    return {
      editStop: null,
      selectedStop: null
    }
  },
  watch: {
    selectedStop: {
      immediate: true,
      handler (stop) {
        const editStop = _.cloneDeep(stop)
        this.editStop = editStop || null

        if (this.$refs.gmap) { this.$refs.gmap.resizePreserveCenter() }
      }
    }
  },
  created () {
    this.fetch(['stops'])
  },
  computed: {
    f: () => filters,
    ...mapState('shared', ['stops']),
    ...mapGetters(['axios'])
  },
  methods: {
    ...mapActions('shared', ['fetch', 'refresh']),
    ...mapActions('modals', ['showModal', 'showErrorModal']),
    geoJsonToLatLng (gjs) {
      return {
        lat: gjs.coordinates[1],
        lng: gjs.coordinates[0]
      }
    },
    saveStop (s) {
      if (s.id) {
        this.axios.put(
          `/stops/${s.id}`,
          _.pick(s, ['description', 'coordinates', 'road', 'label'])
        )
          .then((response) => {
            this.refresh(['stops'])
            this.selectedStop = _.clone(s)
          })
          .catch(this.showErrorModal)
      } else {
        this.axios.post(
          `/stops`,
          _.pick(s, ['description', 'coordinates', 'road', 'label'])
        )
          .then((response) => {
            this.refresh(['stops'])
            s.id = response.data.id
            this.selectedStop = _.clone(s)
          })
          .catch(this.showErrorModal)
      }
    },
    deleteStop (s) {
      this.showModal({
        component: 'CommonModals',
        props: {
          type: 'confirm',
          message: 'Are you sure you want to delete this stop?'
        }
      })
        .then((result) => {
          if (result) {
            return this.axios.delete(`/stops/${s.id}`)
          }
        })
        .catch(this.showErrorModal)
    },
    newStop (e) {
      this.editStop = {
        description: '',
        road: '',
        label: '',
        id: null,
        coordinates: {
          type: 'Point',
          coordinates: [
            e.latLng.lng(),
            e.latLng.lat()
          ]
        }
      }
    }
  },
  mixins: [ModalMixin]
}
</script>
