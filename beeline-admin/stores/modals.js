import Vue from 'vue'
import _ from 'lodash'
import assert from 'assert'

const initial = () => ({
  _resolve: null,
  _reject: null,
  _promise: Promise.resolve(null),
  options: null,
})

module.exports = {
  namespaced: true,
  state: initial(),
  mutations: {
    setModal(state, options) {
      _.assign(state, _.pick(options, ['options', '_resolve', '_reject']))
    },
    setPromise(state, promise) {
      _.assign(state, {_promise: promise})
    }
  },
  actions: {
    /** Adds a modal request to the queue */
    showModal (context, options) {
      return context.state._promise
        .catch(() => {}) /* continue regardless of errors from previous promise */
        .then(() => {
          // at this point, assume the modal is fully closed
          assert(context.state._resolve === null)

          const resultPromise = new Promise((resolve, reject) => {
            context.commit('setModal', {
              options,
              _resolve: resolve,
              _reject: reject,
            })
          })

          // But don't allow the next dialog to show, until we fully
          // close current dialog
          context.commit(
            'setPromise',
            resultPromise
              .catch(() => {})
              .then(() => {
                context.commit('setModal', {
                  options: null,
                  _resolve: null,
                  _reject: null,
                })

                // Let the changes bubble to ModalHelper
                return new Promise((resolve) => {
                  // FIXME: wtf is wrong with wffranco/vue-strap?
                  setTimeout(resolve, 1000)
                })
              })
          )

          return resultPromise
        })
    },
  }
}
