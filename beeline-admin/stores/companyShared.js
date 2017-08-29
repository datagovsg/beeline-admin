import SharedStoreTemplate from './SharedStoreTemplate'

const fetchJobs = {
  contactLists: (state) => ({url: `/companies/${state.companyId}/contactLists`}),
}

export default SharedStoreTemplate(
  {
    state: {
      companyId: null
    },
    mutations: {
      updateCompanyId (state, companyId) {
        state.companyId = companyId
      }
    },
    actions: {
      updateCompanyId (context, companyId) {
        context.commit('updateCompanyId', companyId)
        context.dispatch('invalidate', Object.keys(fetchJobs))
      }
    }
  },
  fetchJobs
)
