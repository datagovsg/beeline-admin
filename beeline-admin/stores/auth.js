
module.exports = {
  namespaced: true,
  state: () => ({
    isAuthenticated: false,
    idToken: null,

    loginDialogShown: false,
    initCompleted: false,
  }),
  mutations: {
    authenticate (state, result) {
      if (result) {
        state.idToken = result.idToken
        state.isAuthenticated = true
      } else {
        state.idToken = null
        state.isAuthenticated = false
      }
    },
    showLoginDialog (state, visible) {
      state.loginDialogShown = visible
    }
  },
}
