import assert from 'assert'

const initial = () => ({
  spinnerPromise: null
})

module.exports = {
  namespaced: true,
  state: initial(),
  mutations: {
    _setPromise(state, promise) {
      state.spinnerPromise = promise
    }
  },
  actions: {
    spinOnPromise(context, promise) {
      assert(typeof promise.then === 'function')

      let nextPromise

      if (context.state.spinnerPromise) {
        nextPromise = Promise.all([
          context.state.spinnerPromise,
          promise.catch((err) => {console.error(err)})
        ])
      } else {
        nextPromise = promise.catch((err) => {console.error(err)})
      }

      // If another promise is subsequently watch()ed, then
      // nextPromise !== this.promise
      nextPromise.then(() => {
        if (context.state.spinnerPromise === nextPromise) {
          context.commit('_setPromise', null)
        }
      })

      context.commit('_setPromise', nextPromise)

      return promise
    },
  },
}
