<template>
  <table>
    <thead>
      <tr>
        <th @click="currentlyViewedMonth = prevMonth">‹</th>
        <th colspan="5">{{ (this.monthFormat || (x => this.f.date(x, 'mmmm yyyy')))(monthCanonical) }}</th>
        <th @click="currentlyViewedMonth = nextMonth">›</th>
      </tr>
      <tr>
        <th>S</th>
        <th>M</th>
        <th>T</th>
        <th>W</th>
        <th>T</th>
        <th>F</th>
        <th>S</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="week in weeks">
        <td @click="clicked(week[0])" :class="dayClasses(week[0])">{{week[0].day}}</td>
        <td @click="clicked(week[1])" :class="dayClasses(week[1])">{{week[1].day}}</td>
        <td @click="clicked(week[2])" :class="dayClasses(week[2])">{{week[2].day}}</td>
        <td @click="clicked(week[3])" :class="dayClasses(week[3])">{{week[3].day}}</td>
        <td @click="clicked(week[4])" :class="dayClasses(week[4])">{{week[4].day}}</td>
        <td @click="clicked(week[5])" :class="dayClasses(week[5])">{{week[5].day}}</td>
        <td @click="clicked(week[6])" :class="dayClasses(week[6])">{{week[6].day}}</td>
      </tr>
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
    'month',
    'specialDates',
    'defaultDisable',
    'monthFormat',
  ],
  data () {
    return {
      currentlyViewedMonth: this.month || new Date()
    }
  },
  computed: {
    f() {
      return {date: dateformat}
    },
    prevMonth () {
      return new Date(Date.UTC(
        this.monthCanonical.getUTCFullYear(),
        this.monthCanonical.getUTCMonth() - 1,
        1,
      ) + this.effectiveOffset)
    },
    nextMonth () {
      return new Date(Date.UTC(
        this.monthCanonical.getUTCFullYear(),
        this.monthCanonical.getUTCMonth() + 1,
        1,
      ) + this.effectiveOffset)
    },
    monthCanonical () {
      const month = this.currentlyViewedMonth || new Date()

      return new Date(month.getTime() - this.effectiveOffset)
    },
    firstDayOfCalendar () {
      const firstDayOfMonth = new Date(Date.UTC(
        this.monthCanonical.getUTCFullYear(),
        this.monthCanonical.getUTCMonth(),
        1
      ))

      return new Date(Date.UTC(
        firstDayOfMonth.getUTCFullYear(),
        firstDayOfMonth.getUTCMonth(),
        firstDayOfMonth.getUTCDate() - firstDayOfMonth.getUTCDay()
      ))
    },
    effectiveOffset () {
      return (typeof this.offset === 'number')
        ? this.offset
        : new Date().getTimezoneOffset() * 60000
    },
    specialDatesByTime () {
      if (!this.specialDates) return () => null

      // Build the date index for raw date values
      const dateIndex = _(this.specialDates)
        .filter(s => s.date instanceof Date)
        .groupBy(specialDate => this.canonicalTime(specialDate.date))
        .value()

      const dateFns = this.specialDates
        .filter(s => typeof s.date === 'function')

      return (canonicalTime) => {
        let merged = {}

        if (dateIndex[canonicalTime]) {
          merged = dateIndex[canonicalTime].reduce(mergeDateInfo, merged)
        }

        merged = dateFns
        .filter(dateFn => dateFn.date(new Date(canonicalTime + this.effectiveOffset)))
        .reduce(mergeDateInfo, merged)

        return merged
      }
    },
    weeks () {
      return [0, 1, 2, 3, 4].map(
        weekNumber => [0,1,2,3,4,5,6].map(weekDay => {
          const canonical = ((weekNumber * 7) + weekDay) * 24*3600*1000 + this.firstDayOfCalendar.getTime()
          const canonicalDate = new Date(canonical)
          return {
            canonical,
            date: canonicalDate,
            day: canonicalDate.getDate(),
            disabled: (this.defaultDisable)
              ? !this.specialDatesByTime(canonical) || !this.specialDatesByTime(canonical).enabled
              : this.specialDatesByTime(canonical) && this.specialDatesByTime(canonical).disabled,
            differentMonth: (canonicalDate.getMonth() !== this.monthCanonical.getMonth()),
            classes: (this.specialDatesByTime(canonical) && this.specialDatesByTime(canonical).classes) || [],
            selected: this.value && (this.multiple
              ? this.value.find(d => this.canonicalTime(d) === canonical)
              : this.canonicalTime(this.value) === canonical)
          }
        })
      )
    }
  },
  methods: {
    canonicalTime (date) {
      const tzDate = new Date(date.getTime() - this.effectiveOffset)
      const time = Date.UTC(tzDate.getUTCFullYear(), tzDate.getUTCMonth(), tzDate.getUTCDate())
      return time
    },
    clicked (day) {
      if (day.disabled) return

      if (this.multiple) {
        const index = this.value.findIndex(v => this.canonicalTime(v) === day.canonical)

        if (index === -1) {
          this.$emit('input', this.value.concat([this.toUserDate(day.date)]))
        } else {
          this.$emit('input', this.value
            .filter(v => this.canonicalTime(v) !== day.canonical))
        }
      } else {
        this.$emit('input', this.toUserDate(day.date))
      }
    },
    dayClasses (day) {
      const basic = {
        disabled: day.disabled,
        'different-month': day.differentMonth,
        selected: day.selected,
      }
      for (let d of day.classes) {
        basic[d] = true
      }
      return basic
    },
    toUserDate(date) {
      return new Date(date.getTime() + this.effectiveOffset)
    },
  }
}


function mergeDateInfo (a, b) {
  return {
    ...a, ...b,
    classes: a.classes ? (b.classes ? a.classes.concat(b.classes) : a.classes) : b.classes
  }
}

</script>
