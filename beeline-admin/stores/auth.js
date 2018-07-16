
module.exports = {
  namespaced: true,
  state: () => ({
    isAuthenticated: false,
    idToken: null,

    loginDialogShown: false,
    initCompleted: false
  }),
  mutations: {
    authenticate (state, result) {
      state.isAuthenticated = true
      if (result) {
        state.idToken = result.idToken
      } else {
        state.idToken = null
      }
    },
    showLoginDialog (state, visible) {
      state.loginDialogShown = visible
    }
  }
}
