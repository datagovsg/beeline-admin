<template>
  <table class="month-picker">
    <tbody>
      <tbody>
        <tr>
          <th @click="currentlyViewedYear = prevYear">‹</th>
          <th>{{ f.date(yearCanonical, 'yyyy') }}</th>
          <th @click="currentlyViewedYear = nextYear">›</th>
        </tr>
        <tr>
          <td colspan="3">
            <div>
              <button v-for="month in months" @click="clicked(month)" type="button">
                {{f.date(month, 'mmmm')}}
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </tbody>
  </table>
</template>

<script>
import dateformat from 'dateformat'

export default {
  props: [
    'value',
    'multiple',
    'offset',
    'year',
    'defaultDisable',
  ],
  data () {
    return {
      currentlyViewedYear: this.year || new Date()
    }
  },
  computed: {
    f() {
      return {date: dateformat}
    },
    prevYear () {
      return new Date(Date.UTC(
        this.yearCanonical.getUTCFullYear() - 1,
        0,
        1,
      ) + this.effectiveOffset)
    },
    nextYear () {
      return new Date(Date.UTC(
        this.yearCanonical.getUTCFullYear() + 1,
        0,
        1,
      ) + this.effectiveOffset)
    },
    yearCanonical () {
      const year = this.currentlyViewedYear || new Date()

      return new Date(year.getTime() - this.effectiveOffset)
    },
    effectiveOffset () {
      return (typeof this.offset === 'number')
        ? this.offset
        : new Date().getTimezoneOffset() * 60000
    },
    months () {
      return [0,1,2,3,4,5,6,7,8,9,10,11]
        .map(month => {
          return new Date(Date.UTC(
            this.yearCanonical.getUTCFullYear(),
            month,
            1
          ))
        })
    }
  },
  methods: {
    clicked (month) {
      this.$emit('input', this.toUserDate(month))
    },
    toUserDate(date) {
      return new Date(date.getTime() + this.effectiveOffset)
    },
  }
}


function mergeDateInfo (a, b) {
  return {
    ...a, ...b,
    classes: _.flatten([a.classes, b.classes])
  }
}

</script>
<style lang="scss">
.month-picker tbody > tr > td > div {
  width: 21em;
  display: flex;
  flex-wrap: wrap;

  & > button {
    flex: 0 0 7em;
    box-sizing: border-box;
  }
}
</style>
