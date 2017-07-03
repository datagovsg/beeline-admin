<template>
  <div class="spinner-elem" v-if="promise">
  </div>
</template>

<script>
import assert from 'assert'

export default {
  data () {
    return {
      promise: null,
    }
  },
  methods: {
    watch(promise) {
      assert(typeof promise.then === 'function')

      let nextPromise

      if (this.promise) {
        nextPromise = Promise.all([
          this.promise,
          promise.catch(() => {})
        ])
      } else {
        nextPromise = promise.catch((err) => {console.log(err)})
      }

      nextPromise.then(() => {
        if (this.promise === nextPromise) this.end()
      })

      this.promise = nextPromise

      return promise
    },
    end () {
      this.promise = null
    }
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
