<template>
<table class="table">
  <thead>
    <tr>
      <th>Date</th>
      <th>Transaction Description</th>
      <th>Balance Before</th>
      <th>Change</th>
      <th>Balance After</th>
    </tr>
  </thead>
  <tbody>
    <tr v-if="moreToLoad">
      <td colspan="5">
        <button @click="loadMoreHistory()" class="btn btn-default">Load more</button>
      </td>
    </tr>
    <tr v-for="ti in routeCreditHistory" :key="ti.id">
      <td>{{f.date(ti.createdAt, 'dd-mmm-yyyy HH:MM:ss')}}</td>
      <td>{{ti.transaction.description}}</td>
      <td class="text-right">{{f.number(ti._balanceBefore, '#,##0')}}</td>
      <td class="text-right">{{f.number(ti.credit > 0 ? 1 : -1, '#,##0')}}</td>
      <td class="text-right">{{f.number(ti._balanceAfter, '#,##0')}}</td>
    </tr>
    <tr>
      <td></td>
      <td>Final balance</td>
      <td class="text-right"></td>
      <td class="text-right"></td>
      <td class="text-right">{{f.number(finalBalance, '#,##0')}}</td>
    </tr>
  </tbody>
</table>
</template>

<script>
import {mapState, mapGetters, mapActions} from 'vuex'

import filters from '@/filters'

export default {
  props: ['userId', 'companyId', 'tag', 'finalBalance'],

  computed: {
    ...mapGetters(['axios']),
    ...mapState('auth', ['idToken']),

    f: () => filters,

    baseUrl () {
      if (!this.idToken) return null

      return `/companies/${this.companyId}/route_passes/${this.tag}` +
        `/users/${this.userId}/history`
    }
  },

  data () {
    return {
      moreToLoad: true,
      routeCreditHistory: [],
    }
  },

  watch: {
    baseUrl: {
      immediate: true,
      handler (h) {
        this.moreToLoad = true
        this.routeCreditHistory = []
        this.$promises = []

        if (h) {
          this.loadMoreHistory()
        }
      }
    }
  },

  methods: {
    ...mapActions('modals', ['showErrorModal']),

    loadMoreHistory () {
      const index = this.$promises.length
      const promise = this.$promises[index] =
        (index ? this.$promises[index - 1] : Promise.resolve([]))
        .then(async (historySoFar) => {
          if (promise !== this.$promises[index]) return // superseded

          const lastIdQuery = historySoFar.length === 0 ?
            '' : `?lastId=${historySoFar[historySoFar.length - 1].id}`

          const historyResponse = await this.axios.get(`${this.baseUrl}${lastIdQuery}`)

          if (promise !== this.$promises[index]) return // superseded

          const concatenated = this.decorateWithBalance(historySoFar, historyResponse.data)

          if (historyResponse.data.length < 20) {
            this.moreToLoad = false
          }
          this.routeCreditHistory = concatenated.slice().reverse();
          return concatenated
        })
        .catch(this.showErrorModal)
    },

    decorateWithBalance (lastChunk, nextChunk) {
      let lastBalance = lastChunk.length === 0 ?
        parseFloat(this.finalBalance) : lastChunk[lastChunk.length - 1]._balanceBefore

      for (let item of nextChunk) {
        const nextBalance = lastBalance + (item.debit < 0 ? -1 : 1)
        item._balanceAfter = lastBalance
        item._balanceBefore = parseFloat(nextBalance.toFixed(2))

        lastBalance = nextBalance
      }

      return lastChunk.concat(nextChunk)
    }
  }
}
</script>
