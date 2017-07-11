<template>
  <div class="spinner-elem" v-if="spinnerPromise">
  </div>
</template>

<script>
import assert from 'assert'
import {mapGetters, mapActions, mapState} from 'vuex'

export default {
  data () {
    return {
      promise: null,
    }
  },
  computed: {
    ...mapState('spinner', ['spinnerPromise'])
  },
  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    watch(promise) {
      this.spinOnPromise(promise)
    },
  }
}
</script>

<style>

.spinner-elem {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;

  background-color: rgba(0,0,0,0.5);
  background-image: url('/img/spinner.svg');
  background-position: 50% 50%;
  background-repeat: no-repeat;
  background-size: 200px 200px;
}

</style>
