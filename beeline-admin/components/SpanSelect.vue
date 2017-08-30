<template>
  <DatePicker
    class="span-select"
    :value="value"
    :multiple="true"

    @input="fixInput"

    :month="month"
    :offset="0"
    :specialDates="(specialDates || []).concat(selectedSpan)"
    :defaultDisable="defaultDisable"
    :monthFormat="monthFormat"
    :otherMonthSelectable="otherMonthSelectable"
    >
  </DatePicker>
</template>
<style lang="scss">
.span-select .active {
  background-color: #FDD;
}
</style>
<script>
import DatePicker from './DatePicker.vue'
import {sortBy, difference} from 'lodash'

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
            return this.value[0].getTime() <= d.getTime()
              && d.getTime() <= this.value[1].getTime()
          }
        },
        classes: ['active']
      }]
    }
  },

  methods: {
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
        if (newValue.length === 1) {
          this.$emit('input', difference(oldValue, newValue))
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
