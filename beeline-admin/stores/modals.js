
const initial = () => ({
  modalShown: null,
  _resolve: null,
  _reject: null,
  title: '',
  message: '',
  defaultValue: '',
})

module.exports = {
  namespaced: true,
  state: initial(),
  mutations: {
    setModal(state, options) {
      _.assign(state, _.pick(options, ['title', 'message', 'defaultValue', 'modalShown',
        '_resolve', '_reject']))
    }
  },
  actions: {
   prompt (context, options) {
     const promise = new Promise((resolve, reject) => {
       context.commit('setModal', {
         ...options,
         modalShown: 'prompt',
         _resolve: resolve,
         _reject: reject
       })
     })
     .then((result) => {
       return result || ''
     })
     .catch((err) => null)

     promise.then((result) => {
       context.commit('setModal', initial())
     })

     return promise
   },
   alert (context, options) {
     const promise = new Promise((resolve, reject) => {
       context.commit('setModal', {
         ...options,
         modalShown: 'alert',
         _resolve: resolve,
         _reject: reject
       })
     })
     .then((result) => {
       return result || ''
     })
     .catch((err) => null)

     promise.then((result) => {
       context.commit('setModal', initial())
     })

     return promise
   }
  }
}
