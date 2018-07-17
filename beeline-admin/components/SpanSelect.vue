<template>
  <DatePicker
    class="span-select"
    :value="value"
    :multiple="true"

    @input="fixInput"
    @month-click="selectEntireMonth"
    :month="month"
    :offset="offset"
    :specialDates="(specialDates || []).concat(selectedSpan)"
    :defaultDisable="defaultDisable"
    :monthFormat="monthFormat"
    :otherMonthSelectable="otherMonthSelectable"
    v-on="otherListeners"

    ref="datepicker"
    >
  </DatePicker>
</template>
<style lang="scss">
.span-select .active {
  background-color: #FDD;
}
.month-label {
  cursor: pointer;
}
</style>
<script>
import {omit, sortBy, difference} from 'lodash'
import assert from 'assert'

import DatePicker from './DatePicker.vue'

export default {
  props: {...DatePicker.props},

  components: {
    DatePicker
  },

  computed: {
    selectedSpan () {
      return [{
        date: (d) => {
          if (this.value.length === 0) {
            return false
          } else if (this.value.length === 1) {
            return this.value[0].getTime() === d.getTime()
          } else if (this.value.length === 2) {
            return this.value[0].getTime() <= d.getTime() &&
              d.getTime() <= this.value[1].getTime()
          }
        },
        classes: ['active']
      }]
    },

    otherListeners () {
      const others = omit(this.$listeners, ['input', 'month-click'])
      return others
    }
  },

  methods: {
    selectEntireMonth (date) {
      const firstDate = this.$refs.datepicker.fromCanonicalTime(new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1)))
      const lastDate = this.$refs.datepicker.fromCanonicalTime(new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0)))
      return this.fixInput([firstDate, lastDate])
    },
    fixInput (newValue) {
      const oldValue = this.value

      if (oldValue.length === 0) {
        this.$emit('input', newValue)
      } else if (oldValue.length === 1) {
        if (newValue.length === 0) {
          this.$emit('input', [oldValue[0], oldValue[0]])
        } else if (newValue.length === 2) {
          this.$emit('input', sortBy(newValue))
        } else {
          assert(false)
        }
      } else if (oldValue.length === 2) {
        /* Pick the deselected date */
        if (newValue.length === 0) {
          // Happens when oldValue[0] === oldValue[1] and user keeps clicking the same date
          this.$emit('input', [])
        } else if (newValue.length === 1) {
          this.$emit('input', difference(oldValue, newValue))
        } else if (newValue.length === 2) {
          this.$emit('input', newValue)
        } else if (newValue.length === 3) {
          /* Pick the selected date */
          this.$emit('input', difference(newValue, oldValue))
        } else {
          assert(false, `Unexpected number of dates: ${newValue.length}`)
        }
      }
    }
  }

}
</script>
