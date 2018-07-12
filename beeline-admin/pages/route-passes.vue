<template>
  <div class="container-fluid withnav route-passes">
    <div class="row" v-if="!companyId">
      Please select a company
    </div>
    <div class="row" v-else-if="!transactions">
      Loading...
    </div>
    <div class="row">
      <div class="col-sm-8">
        <h1>Route Passes</h1>
        <h2>Search selected dates by:</h2>
        <form>
          <div class="form-group">
            <label>User ID</label>
            <UserIdSelector v-model="filter.userId"/>
          </div>
          <div class="form-group">
            <label>Tag</label>
            <RouteTagSelector v-model="filter.tag" :companyId="companyId" />
          </div>
          <div class="form-group">
            <label>TransactionType</label>
            <select v-model="filter.transactionType">
              <option v-for="(transactionType, index) in transactionTypes"
                :label="transactionType"
                :value="transactionType"
                />
            </select>
            <input type="hidden" class="form-control" v-model="filter.transactionType">
          </div>
          <div class="form-group">
            <div class="checkbox">
              <label><input type="checkbox" v-model="filter.hideUncommittedTransactions">Hide uncommitted transactions</label>
            </div>
          </div>
          <br>

        </form>
        <button :disabled="progressText" class="btn btn-default" @click="downloadCSV()" type="button">
          <span class="glyphicon glyphicon-save" aria-hidden="true"/>
          Download CSV
        </button>
        <span v-if="progressText">&nbsp;{{ progressText }}</span>
      </div>
      <div class="col-sm-4">
        <div class="datepicker-wrap">
          <h4 class="text-center">
            Dates selected:
            {{ f.date(this.transactionQuery.startDateTime, 'isoDate') }} -
            {{ f.date(this.transactionQuery.endDateTime - 24 * 3600 * 1000, 'isoDate') }}
          </h4>
          <SpanSelect @month-changed="monthChanged" v-model="filter.dates" :special-dates="specialDates"/>
        </div>
      </div>
    </div>
    <div class="row text-center">
      <div class="col-lg-12">
          <UibPagination :boundary-links="true" v-model="paging.page" :total-items="transactionSummary.totalItems" :items-per-page="paging.perPage"/>
          <div>
            Showing {{paging.page * paging.perPage + 1}} to {{paging.page * paging.perPage + (transactions || []).length}} of {{transactionSummary.totalItems}}
          </div>
      </div>
    </div>
    <div class="row">
      <div class="col-sm-12">
        <table class="table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Txn ID</th>
              <th>Txn Description</th>
              <th>Charge ID</th>
              <th>Txn Timestamp</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Redeemed Ticket ID</th>
              <th>Route Label</th>
              <th>Route Description</th>
              <th>Description</th>
              <th>Type</th>
              <th>User</th>
              <th>Tag</th>
              <th>Payment Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(txn, index) in transactions">
              <td>{{ index + 1 + paging.page * paging.perPage }}</td>
              <td>
                <a :href="`#/c/${companyId}/transactions?id=${txn.transactionId}`">
                  {{txn.transactionId}}<br/>
                </a>
                <a v-if="txn.refundingTransactionId" :href="`#/c/${companyId}/transactions?id=${txn.refundingTransactionId}`">{{txn.refundingTransactionId}}</a>
              </td>
              <td>
                <span>{{txn.transaction.description}}</span><br/>
                <span v-if="txn.discount && txn.discount.description">
                  Discount Scheme: {{txn.discount.description}}
                </span>
              </td>
              <td>
                <span v-if="txn.transaction.committed">
                  {{txn.paymentResource}}<br/>
                  <span v-if="txn.refundResource">{{txn.refundResource}}<br/></span>
                  {{txn.transferResource}}<br/>
                  <button :class="`btn ${txn.redeemed ? 'btn-default' : 'btn-danger'}`" v-if="txn.transaction.committed && (txn.transaction.type === 'routePassPurchase' || txn.transaction.type === 'conversion') && !txn.refundingTransactionId"
                    @click="refund(txn)">
                    Refund
                    &dollar;{{routePassPurchasePrice(txn).toFixed(2)}}
                  </button>
                </span>
                <span v-if="!txn.transaction.committed">
                  {{txn.paymentMessage || 'Reason is unknown'}}
                </span>
              </td>
              <td>{{f.date(txn.createdAt, 'dd mmm yyyy HH:MM:ss')}}</td>
              <td>{{txn.expiresAt !== undefined ? f.date(txn.expiresAt, 'dd mmm yyyy') : ''}}</td>
              <td :title="`Transaction ID: ${txn.transactionId}`">
                <span class="label txn-redeemed" v-if="txn.redeemed && txn.transaction.committed && !txn.refundingTransactionId">Redeemed</span>
                <span class="label txn-redeemed" v-if="!txn.redeemed && txn.transaction.committed && txn.routePass.status === 'expired'">Expired</span>
                <span class="label txn-valid" v-if="!txn.redeemed && txn.transaction.committed && !txn.refundingTransactionId && txn.routePass.status !== 'expired'">Valid</span>
                <span class="label txn-failed" v-if="!txn.transaction.committed">Failed</span>
                <span class="label txn-refunded" v-if="txn.transaction.committed && txn.refundingTransactionId">Refunded</span>
              </td>
              <td>{{txn.redeemed}}</td>
              <td>{{txn.routeLabel}}</td>
              <td>{{txn.routeDescription}}</td>
              <td>{{txn.description}}</td>
              <td>{{txn.transaction.type}}</td>
              <td>
              <a :href="`#/c/${companyId}/users/${txn.routePass.userId}`">
              <strong>{{txn.routePass.user.name}}</strong>
              <br>(UID: {{txn.routePass.userId}})</a>
              <br>{{txn.routePass.user.telephone}}
              <br>{{txn.routePass.user.email}}
              <br>
                <span class="discount-code label" v-if="txn.discount && txn.discount.promotionId"
                    :href="`#/c/${companyId}/promotions/${txn.discount.promotionId}`">
                  <span v-if="txn.discount.code">{{txn.discount.code}}</span>
                  <span v-else><i>(automatic)</i></span>
                  (#{{txn.discount.promotionId}})
                </span>
              </td>
              <td><ul class="tags"><li class="tags">{{txn.routePass.tag}}</li></ul></td>
              <td>
                {{(txn.transaction.type === 'ticketPurchase' ? +txn.credit : routePassPurchasePrice(txn)).toFixed(2)}}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="row text-center">
      <div class="col-lg-12">
          <UibPagination :boundary-links="true" v-model="paging.page" :total-items="transactionSummary.totalItems" :items-per-page="paging.perPage"/>
      </div>
    </div>
  </div>
</template>
<script>
import assert from 'assert'
import querystring from 'querystring'
import {mapGetters, mapActions, mapState} from 'vuex'
import _ from 'lodash'
import download from 'downloadjs'
import * as resources from '../stores/resources'
import filters from '../filters'

import SpanSelect from '@/components/SpanSelect.vue'
import RouteTagSelector from '@/components/RouteTagSelector.vue'
import UibPagination from '@/components/UibPagination.vue'
import UserIdSelector from '@/components/UserIdSelector.vue'

export default {
  props: ['companyId', 'userId'],
  data () {
    return {
      progressText: null,
      filter: {
        dates: [],
        selectedMonth: new Date(),
        tag: null,
        transactionType: null,
        hideUncommittedTransactions: false,
        userId: this.userId,
      },
      paging: {
        page: 0,
        perPage: 20,
      },
      transactions: [],
      transactionTypes: ['', 'conversion', 'routePassPurchase', 'ticketPurchase', 'refundPayment', 'freeRoutePass', 'routePassExpiry'],
      publicHolidaysPromise: this.fetch('publicHolidays')
    }
  },
  components: {
    RouteTagSelector,
    SpanSelect,
    UibPagination,
    UserIdSelector
  },
  computed: {
    ...mapGetters(['axios']),
    ...mapState('shared', ['publicHolidays']),

    f: () => filters,

    specialDates () {
      return this.publicHolidayDates.concat(this.highlightDays)
    },
    highlightDays () {
      return _.keys(this.transactionSummary.txnCountByDay)
        .map(date => ({
          date: new Date(parseInt(date)),
          annotation: this.transactionSummary.txnCountByDay[date],
          selectable: true,
        }))
    },
    transactionSummaryQuery () {
      return this.buildQuery({}, this.filter)
    },
    transactionQuery () {
      return this.buildQuery(this.paging, this.filter)
    }
  },
  asyncComputed: {
    transactionSummary: {
      get () {
        return this.companyId
          ? this.axios
            .get(
              `/companies/${this.companyId}/transaction_items/route_passes/summary?` +
              querystring.stringify(this.transactionSummaryQuery)
            )
            .then(response => _.pick(response.data, ['totalItems', 'txnCountByDay']))
            .catch(this.showErrorModal)
          : {
            txnCountByDay: {},
            totalItems: 0
          }
      },
      default: {
        txnCountByDay: {},
        totalItems: 0
      }
    },
    publicHolidayDates: {
      async get () {
        await this.publicHolidaysPromise
        return this.publicHolidays.map(ph => (
          {
            date: new Date(ph.date),
            classes: ['public-holiday'],
          }
        ))
      },
      default: []
    }
  },
  watch: {
    filter: {
      deep: true,
      handler: function () {
        this.paging.page = 0
      }
    },
    transactionQuery: {
      immediate: true,
      handler: _.debounce(function () {
        this.loadTransactions()
      }, 1000)
    }
  },
  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal', 'showErrorModal']),
    ...mapActions('shared', ['fetch']),

    async downloadCSV() {
      const payloads = []
      const noHeaders = csvText => csvText.substring(csvText.indexOf("\n") + 1)

      let { startDateTime, endDateTime } = this.transactionQuery
      try {
        for (; startDateTime < endDateTime; startDateTime += 24 * 3600 * 1000) {
          const dateString = filters.date(startDateTime, 'dd mmm yyyy')
          this.progressText = `Fetching route pass dump for ${dateString}...`
          const params = _.assign(
            {},
            this.transactionQuery,
            {
              startDateTime,
              endDateTime: startDateTime + 24 * 3600 * 1000,
              format: 'csvdump'
            }
          )
          const url = `/companies/${this.companyId}/transaction_items/route_passes?${querystring.stringify(params)}`
          const response = await this.axios.get(url)
          const payload = payloads.length > 0
            ? noHeaders(response.data + "\n")
            : response.data + "\n"
          payloads.push(payload)
        }
        const blob = new Blob(payloads, { type: 'text/csv' })
        const fileName = `route_pass_dump.csv`
        this.progressText = `Generating ${fileName}...`
        download(blob, fileName, 'text/csv')
      } finally {
        this.progressText = null
      }
    },
    routePassDiscount (routePassTxnItem) {
      return +_.get(routePassTxnItem, 'routePass.notes.discountValue', 0)
    },
    routePassPurchasePrice (txn) {
      return (+txn.credit || 0) - this.routePassDiscount(txn)
    },
    buildQuery (paging, filter) {
      let queryOptions = {}

      if(typeof paging.page === 'number') {
        // paging is zero-indexed, but the endpoint isn't
        queryOptions.page = paging.page + 1
      }

      if(paging.perPage) {
        queryOptions.perPage = paging.perPage
      }

      if(filter.userId) {
        queryOptions.userId = filter.userId
      }

      if(filter.tag) {
        queryOptions.tag = filter.tag
      }

      if(filter.hideUncommittedTransactions){
        queryOptions.hideUncommittedTransactions = filter.hideUncommittedTransactions
      }

      if(filter.transactionType) {
        queryOptions.transactionType = filter.transactionType
      }

      if(filter.dates.length > 0) {
        queryOptions.startDateTime = filter.dates[0].getTime()
      } else {
        queryOptions.startDateTime = new Date(
          filter.selectedMonth.getFullYear(),
          filter.selectedMonth.getMonth(),
          1
        ).getTime()
      }

      if(filter.dates.length > 1) {
        // Because we want less-then-equals semantics
        queryOptions.endDateTime = filter.dates[1].getTime() + 24 * 3600 * 1000
      } else {
        queryOptions.endDateTime = new Date(
          filter.selectedMonth.getFullYear(),
          filter.selectedMonth.getMonth() + 1,
          0
        ).getTime() + 24 * 3600 * 1000
      }

      return queryOptions
    },
    loadTransactions: async function () {
      if (this.companyId) {
        try {
          await this.spinOnPromise(Promise.resolve(true).then(async () => {
            const response = await this.axios.get(
              `/companies/${this.companyId}/transaction_items/route_passes?` +
              querystring.stringify(this.transactionQuery)
            )
            this.transactions = await this.postProcessTransaction(response.data)
          }))
        } catch (err) {
          this.showErrorModal(err)
        }
      }
    },
    postProcessTransaction (txns) {
      const transactionLevelQueries = {}
      return Promise.all(_.map(txns, (txn) => {
        // do the route label mapping
        txn.routeLabel = txn.routePass.route.label
        txn.routeDescription = txn.routePass.route.name
        // to speed up, skip the query transaction items for non-purchase / non-conversion ones
        if (!['freeRoutePass', 'routePassPurchase', 'conversion', 'ticketPurchase'].includes(txn.transaction.type) && txn.transaction.committed) {
          return Promise.resolve(txn)
        } else if (txn.transaction.type === 'ticketPurchase') {
          return this.processTicket(txn)
        } else {
          return this.processTransactionItems(txn)
        }
      }))
    },
    processTicket (txn) {
      txn.description = `Trip Date: ${txn.tripDate}`
      return txn
    },
    processTransactionItems (txn) {
      const {transactionItems} = txn.transaction

      txn.redeemed = _.get(txn.routePass, 'notes.ticketId')
      txn.expiresAt = _.get(txn.routePass, 'expiresAt')

      const perPassDiscount = _.get(txn, `routePass.notes.discountValue`)
      txn.description = perPassDiscount ? `Discount: ${perPassDiscount.toFixed(2)}` : `No Discount`

      return txn
    },
    matchByType (items, typeArray) {
      return typeArray.map(type => items.find(item => item.itemType && item.itemType === type))
    },
    monthChanged (newMonth) {
      this.filter.selectedMonth = newMonth
      this.filter.startDate = this.filter.endDate = null
    },
    refund (routePassTxnItem) {
      this.spinOnPromise(this.axios
        .post(
          `/transactions/route_passes/${routePassTxnItem.itemId}/refund/payment`,
          { transactionItemId: routePassTxnItem.id }
        )
        .then(() => {
          this.showModal({
            component: 'CommonModals',
            props: {
              type: 'alert',
              title: 'Success',
              message: 'Refund successful'
            }
          })
        })
        .catch(this.showErrorModal)
        .then(this.loadTransactions)
      )
    }
  }
}
</script>

<style lang="scss">
.span-select {
  width: 100%;
  td, th {
    text-align: center;
    line-height: 3.0;
    position: relative;

    &.selected {
      background-color: #008;
      color: #FFF;
    }
    &.disabled {
      background-color: #888;
      color: #CCC;
    }
    &.different-month {
      opacity: 0.5;
    }
    &:not(.different-month) {
      font-weight: bold;
    }
    &.public-holiday {
      color: #F00;
    }
    div.annotation {
      background-color: #FF6C6A;
      color: #F4F4F4;
      position: absolute;
      bottom: 0;
      right: 0;
      line-height: 1.6;
      font-size: 12px;
      padding: 1px 5px;
    }
  }
  th:not([colspan]) {
    width: 14%;
  }
}
</style>
