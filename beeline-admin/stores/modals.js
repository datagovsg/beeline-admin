import Vue from 'vue'
import _ from 'lodash'
import assert from 'assert'

const initial = () => ({
  modalStack: [],
  options: null,
})

module.exports = {
  namespaced: true,
  state: initial(),
  mutations: {
    addModal(state, options) {
      state.modalStack.push(_.pick(options, ['options', 'resolve', 'reject']))
    },
    removeModal(state, options) {
      state.modalStack.pop()
    },
  },
  actions: {
    /** Adds a modal request to the queue */
    showModal (context, options) {
      return Promise.resolve(null)
        .then(() => {
          const modalIndex = context.state.modalStack.length

          const resultPromise = new Promise((resolve, reject) => {
            context.commit('addModal', {
              options,
              resolve,
              reject,
            })
          })

          const hideModal = () => {
            assert(modalIndex === context.state.modalStack.length - 1)
            context.commit('removeModal')
          }

          // Result must only be returned *after* modal has been deleted from stack,
          // so that if another modal is shown, there isn't a conflict
          return resultPromise
            .then(result => {
              hideModal()
              return result
            }, err => {
              hideModal()
              throw err
            })
        })
    },
    showErrorModal (context, err) {
      console.error(err)
      return context.dispatch('showModal', {
        component: 'CommonModals',
        props: {
          type: 'alert',
          title: _.get(err, 'response.data.error', 'Error'),
          message: `${_.get(err, 'message')}: ${_.get(err, 'response.data.message', '')}`
        }
      })
    }
  }
}
