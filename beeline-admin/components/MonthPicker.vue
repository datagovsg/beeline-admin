<template>
  <table class="month-picker">
    <thead>
      <tr>
        <th style="text-align: left">
          <button @click="currentlyViewedYear = prevYear" class="btn btn-default">
            ‹
          </button>
        </th>
        <th>{{ f.date(yearCanonical, 'yyyy') }}</th>

        <th style="text-align: right">
          <button @click="currentlyViewedYear = nextYear" class="btn btn-default">
            ›
          </button>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td colspan="3">
          <div>
            <button v-for="m in months"
              :key="m.getTime()"
              @click="clicked(m)"
              type="button"
              class="btn"
              :class="{
                [ (currentlyViewedYear.getUTCFullYear() === valueYear &&
                  m.getUTCMonth() === valueMonth) ?
                  'btn-primary' : 'btn-default']: true
              }"
              >
              {{f.date(m, 'mmmm')}}
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import dateformat from 'dateformat'

export default {
  props: {
    value: {type: Date},
    multiple: {default: false},
    offset: {default: 0},
    year: {type: Date},
    defaultDisable: {}
  },
  data () {
    return {
      currentlyViewedYear: this.year || new Date()
    }
  },
  computed: {
    f () {
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
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        .map(month => {
          return new Date(Date.UTC(
            this.yearCanonical.getUTCFullYear(),
            month,
            1
          ))
        })
    },

    valueYear () { return this.value && this.value.getUTCFullYear() },
    valueMonth () { return this.value && this.value.getUTCMonth() }
  },
  methods: {
    clicked (month) {
      this.$emit('input', this.toUserDate(month))
    },
    toUserDate (date) {
      return new Date(date.getTime() + this.effectiveOffset)
    }
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
