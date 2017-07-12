<template>
  <Modal :value="!!isShown" class="trip-data-editor" @cancel="reject()">
    <!-- If creating trips, tripIds doesn't exist -->
    <div slot="modal-header" class="modal-header"
        v-if="createNew">
      <h3>Create trips</h3>
      <ul class="date-list">
        <li v-for="date in newTripDates">
          {{f.date(date, 'dd-mmm-yyyy')}}
        </li>
      </ul>
    </div>

    <!-- If editing trips, tripIds exist -->
    <div class="modal-header" v-else>
      <h3>Edit trips</h3>
      <ul class="date-list">
        <p>
          Trip ID:
        </p>
        <li v-for="trip in editedTrips">
          {{trip.id}} ({{f.date(trip.date, 'dd-mmm-yyyy')}})
        </li>
      </ul>
    </div>

    <div class="container-fluid" v-if="editTrip">
      <div class="overflow-scroll">
        <div class=" trip-data-editor-nav">
          <div class="row">
            <div class="col-lg-10 col-lg-offset-1">
              <div class="flex-grow">
                <div class="flex-row form-inline">
                  <div class="flex-grow">
                    <label>
                      Trip capacity:
                    </label>
                    <input type="number" class="form-control" min="0"
                      v-model.number="editTrip.capacity" />
                    <br />
                    <label>
                      Trip price:
                    </label>
                    <input type="number" class="form-control" min="0" step="0.01"
                      v-model="editTrip.price" />
                  </div>

                  <div class="flex-grow">
                    <label>
                      Trip Status
                    </label>
                    <select v-model="editTrip.status" class="form-control">
                      <option :value="null">Normal</option>
                      <option value="cancelled">Cancelled due to Emergency</option>
                      <option value="void">Void</option>
                    </select>
                  </div>
                  <div class="flex-grow">
                    <label>
                      Close booking
                      <select class="form-control"
                        v-model.number="editTrip.bookingInfo.windowSize">
                        <option :value="0">0 mins</option>
                        <option :value="-5 * 60 * 1000">5 mins</option>
                        <option :value="-15 * 60 * 1000">15 mins</option>
                        <option :value="-30 * 60 * 1000">30 mins</option>
                        <option :value="-1 * 60 * 60 * 1000">1 hour</option>
                        <option :value="-3 * 60 * 60 * 1000">3 hours</option>
                        <option :value="-6 * 60 * 60 * 1000">6 hours</option>
                      </select>
                    </label>
                    <label>
                      ... before
                      <select class="form-control"
                          v-model="editTrip.bookingInfo.windowType">
                        <option value="stop">passenger's pick-up stop</option>
                        <option value="firstStop">first stop of trip</option>
                      </select>
                    </label>

                    <br />
                    <label>
                      Notes to passenger:
                      <textarea type="text" class="form-control"
                        v-model="editTrip.bookingInfo.notes" />
                    </label>
                    <label>
                      Child ticket price (WRS)
                      <input type="number" step="0.01" class="form-control"
                        v-model.number="editTrip.bookingInfo.childTicketPrice">
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-lg-10 col-lg-offset-1">
            <div class="add-stop-button">
              <button class="btn btn-primary btn-lg" @click="editTrip.tripStops.push(blankTripStop())">
              <span class="glyphicon glyphicon-plus" aria-hidden="true"></span>Add a Stop
            </button>
            </div>
          </div>
          <div class="col-lg-10 col-lg-offset-1">
            <div class="table-responsive">
              <table class="table table-striped table-bordered table-condensed table-hover">
                <thead>
                  <tr>
                    <th></th>
                    <th>Time</th>
                    <th>Stop</th>
                    <th>Boarding</th>
                    <th>Alighting</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(tripStop, index) in editTrip.tripStops">
                    <td>
                      {{ index + 1 }}
                    </td>
                    <td>
                      <TimeInput class="form-control"
                        :value="f.date(tripStop.time, 'HH:MM')"
                        @input="tripStop.time = updateTime(tripStop.time, $event)"
                        />
                    </td>
                    <td>
                       <div class="stop-selector-cell">
                         <StopSelector v-model="tripStop.stopId" />
                          <!-- <stop-selector-popup ng-model="tripStop.stopId" class="btn btn-default btn-icon">
                            <span class="glyphicon glyphicon-map-marker" aria-hidden="true"></span> Add/Edit Stop
                          </stop-selector-popup> -->
                      </div>
                    </td>
                    <td>
                      <label>
                      <input type="checkbox" v-model="tripStop.canBoard" />
                      Boarding
                    </label>
                    </td>
                    <td>
                      <label>
                      <input type="checkbox" v-model="tripStop.canAlight" />
                      Alighting
                    </label>
                    </td>
                    <td class="text-center">
                      <button class="btn btn-danger btn-icon" @click="editTrip.tripStops.splice(index, 1)">
                      <span class="glyphicon glyphicon-trash" aria-hidden="true"></span>
                    </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
    <!-- trip-data-editor -->

    <div slot="modal-footer" class="modal-footer">
      <button class="btn btn-primary" @click="resolve(editTrip)">
        Save
      </button>
      <button class="btn btn-default" @click="reject()">
        Cancel
      </button>
    </div>
  </Modal>
</template>

<script>
const filters = require('../filters')

export default {
  props: [
    'createNew', 'referenceTrip',
    'newTripDates', 'editedTrips'
  ],
  data() {
    return {
      editTrip: null
    }
  },
  watch: {
    referenceTrip: {
      immediate: true,
      handler(trip) {
        this.editTrip = {
          price: '0.00',
          capacity: 13,
          status: null,
          tripStops: [],
          ...trip,
          bookingInfo: {
            windowSize: 0,
            windowType: 'stop',
            notes: '',
            childTicketPrice: null,
            ...(trip && trip.bookingInfo)
          }
        }
      }
    }
  },
  computed: {
    f: () => filters,
  },
  methods: {
    blankTripStop() {
      return {
        stopId: null,
        time: null,
        canBoard: true,
        canAlight: true,
      }
    },
    updateTime(date, input) {
      if (!input) return null

      const newDate = new Date(date.getTime())
      const split = input.split(':').map(x => parseInt(x))

      newDate.setHours(split[0], split[1])
      return newDate
    }
  },
  mixins: [
    require('../modals/ModalMixin')
  ],
}
</script>
