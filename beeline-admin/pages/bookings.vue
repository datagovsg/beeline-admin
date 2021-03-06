<template>
<div class="bookings-page">

    <!--  Remove bookings-page class -->
    <div class="row">
      <nav>
        <div class="col-lg-4 pull-right">
          <div class="datepicker-wrap">
            <h4 class="text-center">Select the start date, and the end date:</h4>
            <SpanSelect
              :specialDates="highlightDays"
              :offset="0"
              :value="filter.startAndEndDate"
              @input="filter.startAndEndDate = $event"
              @month-changed="chart.month = $event" /> <!-- FIXME: month not updated -->
          </div>
        </div>
        <form class="col-lg-8 pull-left" :class="{loading: disp.isLoading}">
          <h1>Bookings</h1>
          <h2>Search selected dates by:</h2>
          <div class="ticketSearch">
            <label>
              Filter by Route:
            </label>
            <RouteSelector
              v-model="filter.routeId"
              :companyId="companyId"
              :startDate="filter.startAndEndDate[0]"
              :endDate="addOneDay(filter.startAndEndDate[1])"
              />
          </div>
          <!-- stop query -->
          <div class="form-group pull-left ticketSearch">
            <label>
              Stop ID
              <input type="text" v-model.lazy="filter.stopQuery" class="form-control" />
            </label>
          </div>
          <!-- user query -->
          <div class="form-group pull-left ticketSearch">
            <label>
              User
              <input type="text" v-model.lazy="filter.userQuery" class="form-control" />
            </label>
          </div>
          <br clear="both" />

          <h2>Search all dates by:</h2>
          <!-- -->
          <div class="form-group pull-left ticketSearch">
            <label>
              Trip ID
              <input type="tel" v-model.lazy="filter.tripId" class="form-control" />
            </label>
          </div>
          <!-- txn query -->
          <div class="form-group pull-left ticketSearch">
            <label>
              Transaction ID
              <input type="tel" v-model.lazy="filter.transactionId" class="form-control" />
            </label>
          </div>
          <!-- Ticket query -->
          <div class="form-group pull-left ticketSearch">
            <label>
              Ticket ID
              <input type="tel" v-model.lazy="filter.ticketId" class="form-control" />
            </label>
          </div>
          <!-- charge query -->
          <div class="form-group pull-left ticketSearch">
            <label>
              Charge ID (min 8 letters)
              <input type="text" v-model.lazy="filter.chargeId" class="form-control" />
            </label>
          </div>
          <!-- payment query -->
          <div class="form-group pull-left ticketSearch">
            <label>
              Payment ID (min 8 letters)
              <input type="text" v-model.lazy="filter.paymentId" class="form-control" />
            </label>
          </div>
          <br clear="both">
          <div class="pull-left">
            <span class="ticketCheckbox">Ticket Status:</span>
            <label class="ticketCheckbox">
              <input type="checkbox" v-model="filter.status.valid" /> <span uib-tooltip="Valid - Paid and Free Tickets">Valid</span>
            </label>

            <label class="ticketCheckbox">
              <input type="checkbox" v-model="filter.status.void" /> <span uib-tooltip="Void - Tickets that are cancelled. Includes tickets that are edited as new tickets are issued during the edit.">Void</span>
            </label>

            <label class="ticketCheckbox">
              <input type="checkbox" v-model="filter.status.refunded" /> <span uib-tooltip="Refunded - Tickets that are refunded to the user."> Refunded</span>
            </label>

            <label class="ticketCheckbox">
              <input type="checkbox" v-model="filter.status.failed" /> <span uib-tooltip="Failed - Tickets due to failed payments."> Failed</span>
            </label>

            <label class="ticketCheckbox">
              <input type="checkbox" v-model="filter.status.pending" /> <span uib-tooltip="Pending - in the middle of a transaction"> Pending</span>
            </label>

            <br clear="both" />
            <div class="bookingNav">
              <button class="btn btn-default" @click="downloadCsv()" type="button">
                <span class="glyphicon glyphicon-save" aria-hidden="true"></span>
                Download CSV
              </button>
              <span v-if="progressText">&nbsp;{{ progressText }}</span>
            </div>
          </div>
        </form>
      </nav>
    </div>

    <div class="row text-center">
      <div class="col-lg-12 ">
        <UibPagination
          :boundaryLinks="true"
          :value="pagination.currentPage - 1"
          @input="pagination.currentPage = $event + 1"
          :totalItems="dataPagination.pageCount * pagination.perPage"
          :itemsPerPage="pagination.perPage" />
        <div>
          Showing {{dataPagination.firstRow}} to {{dataPagination.lastRow}}  of {{dataPagination.totalRows}}
          |
          {{selectedBookings.length}} of {{bookings.length}} tickets selected
          |
          <button :disabled="!selectedBookings.length || numberOfUniqueRoutesInSelectedTickets > 1"
            @click="issueTickets()"
            class="btn btn-default btn-lg">
            Edit Selected Tickets
          </button>
          <div v-if="numberOfUniqueRoutesInSelectedTickets > 1">
            You may not simultaneously edit tickets for different routes
          </div>
        </div>
      </div>
    </div>
    <br />
    <div class="row">
      <div class="col-lg-12">
        <div class="table-responsive">
          <MultiSelectBroker :collection="bookings"
            @toggle="toggleSelection($event)"
            @set="setSelection($event)"
            />
          <table class="table table-striped table-bordered table-condensed table-hover transactions-view">
            <thead>
              <tr>
                <th>&#10003;</th>
                <th>Txn ID</th>
                <th>Charge ID</th>
                <th>User</th>
                <th>Ticket<br>ID</th>
                <th>Trip<br>ID</th>
                <th>Trip<br>Date</th>
                <th>Route<br>ID</th>
                <th>Route<br>Label</th>
                <th>Route<br>Description</th>
                <th>Pick-up stop<br />Drop-off Stop</th>
                <th>Price<br>per trip</th>
                <th>Ticket<br>Status</th>
                <th>Transaction<br>Timestamp</th>
                <th>Ticket<br>Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(ticket, index) in bookings" :key="ticket.id" :class="{
                valid: ticket.status === 'valid',
                failed: ticket.status === 'failed',
                refunded: ticket.status !== 'valid' && ticket.status !== 'failed',
                selected: selectedBookings.find(s => s === ticket),
              }">
                <td>
                  <label>
                    <input type="checkbox"
                      :value="selectedBookings.find(s => s === ticket)"
                      @change="toggleSelection([ticket])"
                      :disabled="ticket.status != 'valid'"/>
                    {{ index + 1 + (pagination.currentPage-1) * pagination.perPage }}
                  </label>
                </td>
                <td>
                  <a v-if="ticket.ticketSale"
                    :href="`#/c/${companyId}/transactions?transactionId=${ticket.ticketSale.transactionId}`">
                    {{ticket.ticketSale.transactionId}}<br/>
                  </a>
                  <a v-if="ticket.ticketExpense"
                    :href="`#/c/${companyId}/transactions?transactionId=${ticket.ticketExpense.transactionId}`">
                    (Issue: {{ticket.ticketExpense.transactionId}})<br/>
                  </a>
                  <a v-if="ticket.ticketRefund"
                    :href="`#/c/${companyId}/transactions?transactionId=${ticket.ticketRefund.transactionId}`">
                    (Related Txn ID: {{ticket.ticketRefund.transactionId}})<br/>
                  </a>
                </td>
                <td class="item-description">
                  <span v-if="ticket.routePass">
                    Purchased using route pass {{ticket.routePass.id}}<br/>
                    Purchase Txn:
                      <a
                        :href="`#/c/${companyId}/transactions?transactionId=${ticket.routePass.transactionId}`">
                        {{ticket.routePass.transactionId}}</a><br/>
                    Discount: &dollar;{{ f.number(ticket.routePass.discount || 0, '#,###.00') }}
                  </span>
                  <span v-if="ticket.paymentResource">{{ticket.paymentResource}}<br/></span>
                  <span v-if="ticket.ticketExpense">{{ticket.ticketExpense.transaction.description}}<br/></span>
                  <span v-if="ticket.refundResource">{{ticket.refundResource}}<br/></span>
                  <span v-if="f._.get(ticket, 'paymentData.transfer.destination_payment')">
                    {{ticket.paymentData.transfer.destination_payment}}<br/>
                  </span>
                  <span v-if="f._.get(ticket, 'refundData.transfer.destination_payment')">
                    {{ticket.refundData.transfer.destination_payment}}<br/>
                  </span>
                  <span v-if="f._.get(ticket, 'paymentData.message')">
                    {{ticket.paymentData.message}}<br/>
                  </span>
                  <button class="btn btn-danger actions"
                      @click="refundPayment(ticket)"
                      v-if="(ticket.status == 'valid' || ticket.status == 'void')
                      && ticket.paymentResource
                      && ticket.ticketSale
                      && f._.get(ticket, 'ticketSale.notes.outstanding', 0) > 0">
                   Refund
                   &dollar;{{f.number(f._.get(ticket, 'ticketSale.notes.outstanding', 0), '#,###.00')}}
                 </button>
                </td>
                <td>
                  <a :href="`#/c/${companyId}/users/${ticket.user.id}`">
                    <strong v-if="f._.get(ticket, 'user.json')">
                      {{ticket.user.json.name + ' #' + ticket.user.json.index}}
                    </strong>
                    <strong v-else>
                      {{ticket.user.name}}
                    </strong>
                    <br> (UID: {{ticket.user.id}})
                  </a>
                  <br> {{f._.get(ticket, 'user.json.telephone', f._.get(ticket, 'user.telephone'))}}
                  <br> {{f._.get(ticket, 'user.json.email', f._.get(ticket, 'user.email'))}}
                  <span v-if="f._.get(ticket, 'discount.debitF')">
                    <br>
                    <a class="discount-code label"
                      :href="`#/c/${ticket.boardStop.trip.route.transportCompanyId}/promotions/${ticket.discount.discount.promotionId}`">
                      <span v-if="f._.get(ticket, 'discount.discount.code')">{{ticket.discount.discount.code}}</span>
                      <span v-else><i>(automatic)</i></span>
                      (#{{ticket.discount.discount.promotionId}})
                    </a>
                  </span>

                  <button type="button" class="btn btn-default"
                    @click="addTicket(ticket)">
                    <span class="glyphicon glyphicon-plus-sign" aria-hidden="true"></span>
                    Issue another ticket
                  </button>
                </td>
                <td class="text-center">
                  <a :href="`#/c/${companyId}/transactions?ticketId=${ticket.Id}`">
                    {{ticket.id}}
                  </a>
                  <button class="btn btn-default btn-icon send-wrs-email"
                    @click="sendWrsEmail(ticket)">
                    <i class="glyphicon glyphicon-envelope"></i>
                  </button>
                </td>
                <td>
                  {{ticket.boardStop.trip.id}}
                </td>
                <td>
                  {{f.date(ticket.boardStop.trip.date, 'dd-mmm-yy', true)}}
                </td>
                <td>
                  <a :href="`#/c/${companyId}/trips/${ticket.boardStop.trip.routeId}/route`">
                    {{ticket.boardStop.trip.routeId}}
                  </a>
                </td>
                <td>
                  {{f._.get(ticket, 'boardStop.trip.route.label')}}
                </td>
                <td class="item-description">
                  {{f._.get(ticket, 'boardStop.trip.route.from')}} <br />
                  {{f._.get(ticket, 'boardStop.trip.route.to')}}
                </td>
                <td class="item-description">
                  <table class="borderless">
                    <tr>
                      <td>
                        {{f.date(ticket.boardStop.time, 'HH:MM TT')}}
                      </td>
                      <td>
                        {{f._.get(ticket, 'boardStop.stop.description')}}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        {{f.date(ticket.alightStop.time, 'HH:MM TT')}}
                      </td>
                      <td>
                        {{f._.get(ticket, 'alightStop.stop.description')}}
                      </td>
                    </tr>
                  </table>
                </td>
                <td>
                  &dollar;{{f.number(f._.get(ticket, 'ticketSale.credit'), '#,###.00')}}
                  <span v-if="f._.get(ticket, 'notes.discountValue')">
                    <br>-&dollar;{{f.number(f._.get(ticket, 'notes.discountValue'), '#,###.00')}}
                  </span>
                </td>
                <td>
                  <span class="label ticket-valid"
                      v-if="ticket.status === 'valid'">Valid</span>
                  <span class="label ticket-void"
                      v-if="ticket.status === 'void'">Void</span>
                  <span class="label ticket-refunded"
                      v-if="ticket.status === 'refunded'">Refunded</span>
                  <span class="label ticket-failed"
                      v-if="ticket.status === 'failed'">Failed</span>
                </td>
                <td>
                  <span>
                    {{f.date(ticket.createdAt, 'dd-mmm-yy')}} <br>
                    {{f.date(ticket.createdAt, 'HH:MM:ss')}}
                  </span>
                  <br>
                  <span v-if="ticket.ticketRefund">
                    {{f.date(ticket.ticketRefund.createdAt, 'dd-mmm-yy')}} <br>
                    {{f.date(ticket.ticketRefund.createdAt, 'HH:MM:ss')}}
                  </span>
                </td>
                <td class="item-info text-center">
                  <div class="btn-group" role="group" aria-label="...">
                    <button type="button" class="btn btn-default"
                      @click="editTicket(ticket)"
                      :disabled="ticket.status != 'valid' || selectedBookings.length > 1">
                      <span class="glyphicon glyphicon-edit" aria-hidden="true"></span>
                      Edit
                    </button>
                    <button type="button" class="btn btn-warning btn-default"
                      @click="toggleVoidTicket(ticket)"
                      :disabled="!['valid', 'void'].includes(ticket.status) || selectedBookings.length > 1">
                      {{ (ticket.status === 'void') ? 'Unvoid' : 'Void' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div> <!-- table-responsive -->
      </div> <!-- col-lg-12 -->
    </div> <!-- row -->
</div> <!-- .booking-page -->

</template>
<script>
import _ from 'lodash'
import assert from 'assert'
import download from 'downloadjs'
import querystring from 'querystring'
import {mapState, mapGetters, mapActions} from 'vuex'
import redirect from '@/shared/redirect'

import MultiSelectBroker from '@/components/MultiSelectBroker'
import UibPagination from '@/components/UibPagination.vue'
import RouteSelector from '@/components/RouteSelector.vue'
import SpanSelect from '@/components/SpanSelect.vue'
import * as filters from '@/filters'

const CSV_FIELDS = [
  "ticketSale.transaction.id",
  "ticketRefund.transaction.id",
  "ticketExpense.transaction.id",

  "ticketRefund.transaction.description",
  "ticketExpense.transaction.description",

  "routePass.transactionId",
  "routePass.id",
  "routePass.discount",

  "boardStop.trip.date",
  "user.name",
  "user.telephone",
  "user.email",

  "id",
  "paymentResource",
  "paymentData.transfer.destination_payment",
  "refundResource",
  "boardStop.trip.id",
  "boardStop.trip.route.id",
  "boardStop.trip.route.label",
  "boardStop.trip.route.from",
  "boardStop.trip.route.to",
  "boardStop.trip.route.transportCompany.name",

  "boardStop.time",
  "boardStop.stop.description",
  "alightStop.time",
  "alightStop.stop.description",

  "boardStop.trip.price",
  "ticketSale.credit",
  "notes.discountCodes",
  "notes.discountValue",

  "discount.discount.code",
  "discount.discount.description",
  "discount.discount.promotionId",

  "status",
  "createdAt",
  "ticketRefund.createdAt",
]

export default {
  props: ['companyId', 'tripId', 'userId', 'routeId'],

  components: {
    MultiSelectBroker,
    RouteSelector,
    SpanSelect,
    UibPagination
  },

  data () {
    return {
      progressText: null,
      pagination: {
        perPage: 50,
        pageCount: 1,
        currentPage: 1
      },

      fetchedData: null,
      bookings: [],
      selectedBookings: [],

      filter: {
        showPartial: false,
        routeId: false,
        status: {
          valid: true,
          refunded: true,
          void: true,
          failed: false,
          pending: false
        },
        startAndEndDate: [],
        userQuery: '',
        tripId: '',
        transactionId: '',
        chargeId: '',
        paymentId: '',
        ticketId: ''
      },

      chart: {
        month: new Date(),
        fetchedData: []
      },

      disp: {
        availableRoutes: [],
        month: new Date(),
        datesBetween: [],
        counts: {},
        dates: [],
        pagination: {firstRow: 1, lastRow: 1, totalRows: 1},
        isLoading: 0
      }
    }
  },

  computed: {
    ...mapGetters(['axios']),
    ...mapState('auth', ['idToken']),

    f: () => filters,

    now () {
      return new Date()
    },
    startOfMonth () {
      return new Date(Date.UTC(
        this.now.getFullYear(),
        this.now.getMonth(),
        1
      ))
    },
    endOfMonth () {
      return new Date(Date.UTC(
        this.now.getFullYear(),
        this.now.getMonth() + 1,
        0
      ))
    },

    dataPagination () {
      if (!this.fetchedData) {
        return {
          firstRow: 0,
          lastRow: 0,
          totalRows: 0,
          pageCount: 0
        }
      }

      return {
        firstRow: (this.pagination.currentPage - 1) * this.fetchedData.perPage + 1,
        lastRow: Math.min(this.pagination.currentPage * this.fetchedData.perPage, this.fetchedData.count),
        totalRows: this.fetchedData.count,
        pageCount: Math.ceil(this.fetchedData.count / this.fetchedData.perPage)
      }
    },

    highlightDays () {
      if (!this.chart.fetchedData) return []

      return _.keys(this.chart.fetchedData.countByDate)
        .map((date) => ({
          date: new Date(parseInt(date)),
          annotation: this.chart.fetchedData.countByDate[date],
          selectable: true
        }))
    },

    csvUrl () {
      if (!this.idToken) return
      /* querystring.stringify strips out empty arrays [] */
      return this.buildQuery({format: 'csv', page: [], perPage: []})
    },

    requestUrlWithoutPagination () {
      if (!this.idToken) return
      return this.buildQuery()
    },

    requestUrl () {
      if (!this.idToken) return
      const url = this.addPaginationOptions(this.requestUrlWithoutPagination)
      return url
    },

    monthlyCountsUrl () {
      if (!this.idToken) return
      return this.buildQuery({
        tripStartDate: Date.UTC(
          this.chart.month.getUTCFullYear(),
          this.chart.month.getUTCMonth(),
          1
        ),
        tripEndDate: Date.UTC(
          this.chart.month.getUTCFullYear(),
          this.chart.month.getUTCMonth() + 1,
          1
        )
      })
    },

    numberOfUniqueRoutesInSelectedTickets () {
      return _.uniqBy(this.selectedBookings, s => s.boardStop.trip.routeId).length
    }
  },

  watch: {
    requestUrlWithoutPagination () {
      this.pagination.currentPage = 1
    },

    requestUrl: _.debounce(function () {
      this.requeryTable()
    }, 1000, {leading: false, trailing: true}),

    monthlyCountsUrl: _.debounce(function () {
      this.requeryChart()
    }, 1000, {leading: false, trailing: true})
  },

  created () {
    this.filter.startAndEndDate = [
      this.startOfMonth,
      this.endOfMonth
    ]
    this.filter.routeId = this.routeId
    this.filter.userId = this.userId
    this.filter.tripId = this.tripId
    this.disp.now = this.now
  },

  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal', 'showErrorModal', 'alert', 'confirm', 'flash']),

    requeryBoth () {
      this.requeryTable()
      this.requeryChart()
    },

    requeryChart () {
      if (!this.monthlyCountsUrl) return

      this.axios.get(this.monthlyCountsUrl)
        .then((result) => {
          this.chart.fetchedData = result.data
        })
        .catch((err) => {
          console.error(err)
        })
    },

    requeryTable () {
      if (this.requestUrl === null) return

      const queryPromise = this.$lastPromise = this.axios.get(this.requestUrl)
        .then((result) => {
          if (queryPromise !== this.$lastPromise) return

          // for WRS tickets, we cheated and saved a JSON in the user's name field :(
          for (let ticket of result.data.rows) {
            try {
              ticket.user.json = JSON.parse(ticket.user.name)
            } catch (e) {}
          }

          this.pagination.currentPage = result.data.page
          this.fetchedData = result.data
          this.bookings = result.data.rows
          this.selectedBookings = []
        })
        .catch((err) => {
          console.log(err)
        })

      this.spinOnPromise(queryPromise)
        .catch(this.showErrorModal)

      return queryPromise
    },

    async downloadCsv () {
      const payloads = [CSV_FIELDS.join(',') + '\n']
      const noHeaders = csvText => csvText.substring(csvText.indexOf('\n') + 1)

      const { perPage } = this.pagination
      const { totalRows: totalItems } = this.dataPagination
      try {
        for (let page = 1; totalItems - page * perPage >= -perPage; ++page) {
          this.progressText = `Fetched ${page * perPage} of ${totalItems} records...`
          const url = this.buildQuery({page, perPage, format: 'json'})
          const response = await this.axios.get(url)
            
          const bookingJSONToCSV = row => {
            const csv = CSV_FIELDS
              .map(f => {
                const v = _.get(row, f)
                if (v && f === 'boardStop.trip.date') {
                  // Return the date portion
                  return `"${v.split('T')[0]}"`
                } else if (v && ['boardStop.time', 'alightStop.time'].includes(f)) {
                  return `"${v.replace('T', ' ').replace(/\.\d{3}Z$/,'')}"`
                } else {
                  return v ? `"${v}"` : v
                }
              })
            return csv.join(',')
          }

          const payload = response.data.rows.map(bookingJSONToCSV).join('\n') + '\n'
          payloads.push(payload)
        }
        const blob = new Blob(payloads, { type: 'text/csv' })
        const fileName = `bookings_report.csv`
        this.progressText = `Generating ${fileName}...`
        download(blob, fileName, 'text/csv')
      } finally {
        this.progressText = null
      }
    },

    async sendWrsEmail (ticket) {
      if (await this.confirm({title: 'Send a copy of this ticket to your email?'})) {
        const transactionId = _.get(ticket, 'ticketSale.transactionId') ||
          _.get(ticket, 'ticketExpense.transactionId')

        this.spinOnPromise(this.axios.post(`/custom/wrs/email/${transactionId}`))
          .then(() => {
            return this.alert({
              title: 'Email sent',
              message: 'Email sent to your Beeline Admin Login Email ID. Please check your inbox'
            })
          })
          .catch(this.showErrorModal)
      }
    },

    async refundPayment (ticket) {
      const originalPrice = parseFloat(ticket.ticketSale.credit)
      const discount = ticket.notes.discountValue || 0

      if (await this.confirm('Confirm refund?')) {
        this.spinOnPromise(
          this.axios.post(`/transactions/tickets/${ticket.id}/refund/payment`, {
            targetAmt: originalPrice - discount
          })
        )
          .then((response) => {
            var txn = response.data
            var payment = txn.transactionItems
              .find(ts => ts.itemType === 'refundPayment' && ts.refundPayment)

            this.requeryBoth()
            return this.alert({ title: parseFloat(payment.credit).toFixed(2) + ' refunded.' })
          })
          .catch(this.showErrorModal)
      }
    },

    issueTickets () {
      const selectedBookings = this.selectedBookings
      const firstTicket = selectedBookings.length > 0 ? selectedBookings[0] : null

      const issueTicketModalOptions = {
        users: _(selectedBookings)
          .filter()
          .map(t => t.user)
          .uniqBy('id')
          .value()
      }

      if (firstTicket) {
        Object.assign(issueTicketModalOptions, {
          routeId: firstTicket.boardStop.trip.routeId,
          boardStopStopId: firstTicket.boardStop.stopId,
          alightStopStopId: firstTicket.alightStop.stopId,
          cancelledTickets: selectedBookings
        })
      }

      return this.showModal({
        component: 'IssueTicket',
        props: issueTicketModalOptions
      })
        .then((request) =>
          this.spinOnPromise(
            this.axios.post('/transactions/tickets/issue_free', request))
            .then(() => this.flash({title: 'Tickets created!'}))
            .catch(this.showErrorModal)
        )
        .then(() => this.requeryBoth(), () => { /* do nothing if cancelled */ })
    },

    // Edit ticket button
    editTicket (ticket) {
      const selectedTickets = [ticket]

      return this.showModal({
        component: 'IssueTicket',
        props: {
          users: [ticket.user],
          routeId: ticket.boardStop.trip.routeId,
          boardStopStopId: ticket.boardStop.stopId,
          alightStopStopId: ticket.alightStop.stopId,
          cancelledTickets: selectedTickets
        }
      })
        .then((request) =>
          this.spinOnPromise(
            this.axios.post('/transactions/tickets/issue_free', request))
            .then(() => this.flash({title: 'Tickets created!'}))
            .catch(this.showErrorModal)
        )
        .then(() => this.requeryBoth(), () => { /* do nothing if cancelled */ })
    },
    // Add ticket button -- don't cancel earlier ticket
    addTicket (ticket) {
      return this.showModal({
        component: 'IssueTicket',
        props: {
          users: [ticket.user],
          routeId: ticket.boardStop.trip.routeId,
          boardStopStopId: ticket.boardStop.stopId,
          alightStopStopId: ticket.alightStop.stopId
        }
      })
        .then((request) =>
          this.spinOnPromise(
            this.axios.post('/transactions/tickets/issue_free', request))
            .then(() => this.flash({title: 'Tickets created!'}))
            .catch(this.showErrorModal)
        )
        .then(() => this.requeryBoth(), () => { /* do nothing if cancelled */ })
    },

    async toggleVoidTicket (ticket) {
      const { id, status } = ticket
      assert(['valid', 'void'].includes(status),
        `This ticket is ${status} and cannot be voided or made valid`)
      const newStatus = (status === 'void') ? 'valid' : 'void'
      if (await this.confirm({title: `Confirm change ticket status to ${newStatus}?`})) {
        this.spinOnPromise(this.axios.put(`/tickets/${id}/status`, {status: newStatus}))
          .then((response) => {
            const { status } = response.data
            this.requeryBoth()
            return this.alert({title: `This ticket is now ${status}`})
          })
          .catch(this.showErrorModal)
      }
    },

    addPaginationOptions (url) {
      return url + '&' + querystring.stringify({
        page: this.pagination.currentPage || 1,
        perPage: this.pagination.perPage
      })
    },

    buildQuery (override) {
      // update the request and CSV url
      // tripStartDate & tripEndDate should be converted to
      // UTC midnight of the intended dates

      const [startDate, endDate] = this.filter.startAndEndDate

      if (!startDate || !endDate) return null

      const queryOptions = {
        tripStartDate: Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate()
        ),
        tripEndDate: Date.UTC(
          endDate.getUTCFullYear(),
          endDate.getUTCMonth(),
          endDate.getUTCDate() + 1
        ),
        statuses: JSON.stringify(Object.keys(this.filter.status)
          .filter(key => this.filter.status[key]))
      }

      /* Search selected dates by... fields */
      if (this.filter.routeId) {
        queryOptions.routeId = this.filter.routeId
      }
      if (this.filter.userQuery) {
        queryOptions.userQuery = this.filter.userQuery.trim()
      }
      if (this.filter.stopQuery) {
        queryOptions.stopQuery = this.filter.stopQuery.trim()
      }

      /* Search all dates by... fields */
      if (this.filter.tripId || this.filter.paymentId ||
          this.filter.transactionId ||
          this.filter.chargeId || this.filter.ticketId) {
        delete queryOptions.tripStartDate
        delete queryOptions.tripEndDate
      }

      if (this.filter.tripId) {
        queryOptions.tripId = this.filter.tripId.trim()
      }
      if (this.filter.transactionId) {
        queryOptions.transactionId = this.filter.transactionId.trim()
      }
      if (this.filter.chargeId) {
        queryOptions.chargeId = this.filter.chargeId.trim()
      }
      if (this.filter.paymentId) {
        queryOptions.paymentId = this.filter.paymentId.trim()
      }
      if (this.filter.ticketId) {
        queryOptions.ticketId = this.filter.ticketId.trim()
      }

      if (this.companyId) {
        queryOptions.transportCompanyId = this.companyId
      }

      Object.assign(queryOptions, override)

      return `/custom/wrs/report?` + querystring.stringify(queryOptions)
    },

    setSelection (list) {
      this.selectedBookings = list
    },

    toggleSelection (list) {
      this.selectedBookings = _.differenceBy(this.selectedBookings, list, 'id')
        .concat(_.differenceBy(list, this.selectedBookings, 'id'))
    },

    addOneDay (d) {
      return d && new Date(d.getTime() + 24 * 3600 * 1000)
    }
  }
}

</script>

<style lang="scss">
@import "~/scss/bootstrap/_variables.scss";
@import "~/scss/bootstrap/_mixins.scss";

.bookings-page {
  margin-bottom: $padding-large-vertical*5;
  nav {
    .uib-datepicker {
      float: left;
      margin: 0 1em;
    }
    &:after {
      content: ".";
      visibility: hidden;
      clear: both;
    }
  }
  .ticketSearch {
    margin-right: $padding-large-horizontal;
    margin-top: $padding-large-horizontal;
  }
  .ticketCheckbox {
    margin-right: $padding-base-horizontal;
  }
  .bookingNav {
    margin-top: $padding-large-vertical;
    margin-right: $padding-base-horizontal;
  }
  tr.selected td {
    background-color: $table-bg-hover;
  }

  .actions.btn {
    margin: $padding_small_vertical 0;
  }
}

.loading {
  background-image: url("../../www/img/spinner.svg");
  background-position: top right;
  background-repeat: no-repeat;
  background-size: 200px 200px;
}

.label{
  &.ticket-valid {
    @include label-variant($label-success-bg);
  }

  &.ticket-void {
    @include label-variant($label-default-bg);
  }

  &.ticket-refunded {
    @include label-variant($label-danger-bg);
  }

  &.ticket-failed, &.discount-code {
    @include label-variant($gray-darker);
  }

}
</style>
