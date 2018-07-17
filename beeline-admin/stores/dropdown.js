
module.exports = {
  namespaced: true,

  state () {
    return {
      activeDropdown: null
    }
  },

  mutations: {
    setDropdown (state, dropdown) {
      state.activeDropdown = dropdown
    }
  }
}
