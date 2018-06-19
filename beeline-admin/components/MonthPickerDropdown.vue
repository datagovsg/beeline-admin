<template>
  <div class="input-group datepicker-dropdown" @click.stop="handleClick">
    <input type="text" class="form-control" v-model="buffer" @input="checkDate" />
    <span class="input-group-btn">
      <button class="btn btn-primary btn-icon" type="button"
        @click="showPopup = !showPopup">
        <span class="glyphicon glyphicon-calendar" aria-hidden="true"></span>
      </button>
    </span>

    <div class="popup" v-show="showPopup">
      <!-- <div style="text-align: right">
        <button class="btn btn-primary" type="button"
          @click="showPopup = false">
          <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
        </button>
      </div> -->
      <MonthPicker :offset="offset" :value="value" @input="updateValue($event)" />
    </div>
  </div>
</template>

<style lang="scss">

.datepicker-dropdown {
  overflow: visible;
  position: relative;

  .popup {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 100;
    background-color: white;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);

    table {
      th, td {
        text-align: center;
        padding: 0.5em;
      }
      td {
        background-color: white;
        width: 3em;

        &.selected {
          background-color: #008;
          color: #FFF;
        }
      }
    }
  }
}
</style>

<script>
import dateformat from 'dateformat'

import MonthPicker from '@/components/MonthPicker.vue'

const currentOffset = new Date().getTimezoneOffset() * 60000

export default {
  props: {
    value: {
      type: Date
    },
    format: {
      type: String,
      default: 'mmmm yyyy',
    },
    offset: {
      default: currentOffset
    }
  },
  created () {
    this.clickOut = () => {
      this.showPopup = false;
    }
    document.body.addEventListener('click', this.clickOut)
  },
  destroyed () {
    document.body.removeEventListener('click', this.clickOut)
  },
  data () {
    return {
      buffer: '',
      showPopup: false,
      clickOut: null,
    }
  },
  watch: {
    value: {
      immediate: true,
      handler (v) {
        this.buffer = v && dateformat(v.getTime(), this.format)
      }
    },
    showPopup (v, oldV) {

    }
  },
  components: {
    MonthPicker,
  },
  computed: {
    dateString() {
      return dateformat(this.value, this.format)
    }
  },
  methods: {
    updateValue (e) {
      this.$emit('input', e)
    },
    checkDate () {
      // FIXME
    },
    handleClick () {
      // STUB
    }
  }
}
</script>
