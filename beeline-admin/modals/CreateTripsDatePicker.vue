<template>
  <Modal :value="isShown" title="Test!" @cancel="reject">
    <div slot="modal-header" class="modal-header">
      <h3>Select dates</h3>
    </div>

    Select the trips from the old route to copy over to the new route:

    <DatePicker :defaultDisable="true" :multiple="true"
      :month="new Date(route.dates.lastDate)" :offset="0"
      :specialDates="specialDates"
      v-model="selectedDates" class="date-picker"
      />

    <strong>Trips to create:</strong>
    <ul class="date-list">
      <li v-for="date in sortedSelectedDates">
        {{f.date(date, 'dd-mmm-yyyy')}}
      </li>
    </ul>

    <div slot="modal-footer" class="modal-footer">
      <div class="row">
        <div class="col-lg-12">
          <button class="btn btn-default" @click="reject()">
            Cancel
          </button>
          <button class="btn btn-primary" @click="resolve(selectedDates)">
            Create Trips
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import _ from 'lodash'

export default {
  props: ['route'],
  mixins: [
    require('./ModalMixin')
  ],
  data() {
    return {
      selectedDates: []
    }
  },
  computed: {
    specialDates() {
      return this.route.trips.map(t => ({
        date: t.date,
        enabled: true,
      }))
    },
    sortedSelectedDates() {
      return _.sortBy(this.selectedDates)
    },
    f() {
      return {
        date: require('dateformat')
      }
    }
  },
  components: {
    DatePicker: require('../components/DatePicker.vue')
  }
}
</script>

<style lang="scss">
.date-picker {
  width: 100%;
  td, th {
    text-align: center;
    line-height: 3.0;

    &.selected {
      background-color: #008;
      color: #FFF;
    }
    &.disabled {
      background-color: #888;
      color: #CCC;
    }
  }
  th:not([colspan]) {
    width: 14%;
  }
}
</style>
