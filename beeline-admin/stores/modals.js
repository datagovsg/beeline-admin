
const initial = () => ({
  _resolve: null,
  _reject: null,
  options: null,
})

module.exports = {
  namespaced: true,
  state: initial(),
  mutations: {
    setModal(state, options) {
      _.assign(state, _.pick(options, ['options', '_resolve', '_reject']))
    }
  },
  actions: {
   showModal (context, options) {
     const promise = new Promise((resolve, reject) => {
       context.commit('setModal', {
         options,
         _resolve: resolve,
         _reject: reject
       })
     })
     return promise
   },
   closeModal (context, options) {
     context.commit('setModal', {
       options: null,
       _resolve: null,
       _reject: null,
     })
   }
  }
}
