import _ from 'lodash'
import assert from 'assert'

module.exports = {
  props: ['collection'],

  data () {
    return {
      listStart: null,
      lastSelectedIndex: null
    }
  },

  render () {
    return ''
  },

  methods: {
    mousedown (event, index) {
      event.preventDefault()
      assert(typeof index === 'number')

      if (event.ctrlKey) {
        this.ctrlMousedown(index)
      } else if (event.shiftKey) {
        this.shiftMousedown(index)
      } else {
        this.regularMousedown(index)
      }
    },

    shiftMousedown (index) {
      const toggleRange = (index < this.lastSelectedIndex)
        ? _.range(
          index,
          this.lastSelectedIndex +
              ((this.lastSelectedIndex <= this.listStart) ? 0 : 1)
        )
        : _.range(
          this.lastSelectedIndex +
            ((this.lastSelectedIndex >= this.listStart) ? 1 : 0),
          index + 1
        )

      this.$emit('toggle', toggleRange.map(i => this.collection[i]))
      this.lastSelectedIndex = index
    },

    ctrlMousedown (index) {
      this.$emit('toggle', [this.collection[index]])
      this.listStart = index
      this.lastSelectedIndex = index
    },

    regularMousedown (index) {
      this.$emit('set', [this.collection[index]])
      this.listStart = index
      this.lastSelectedIndex = index
    }
  }
}
