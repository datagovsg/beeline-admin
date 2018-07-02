<template>
<div class="bookings-page">
  <LoadingSpinner ref="loadingSpinner"/>
  <ModalHelper ref="modalHelper"/>

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
            <route-select2 v-model="filter.routeId" :required="false" transport-company-id="companyId">
            </route-select2>
          </div>
          <!-- stop query -->
          <div class="form-group pull-left ticketSearch">
            <label>
              Stop ID
              <input type="text" v-model="filter.stopQuery" class="form-control" />
            </label>
          </div>
          <!-- user query -->
          <div class="form-group pull-left ticketSearch">
            <label>
              User
              <input type="text" v-model="filter.userQuery" class="form-control" />
            </label>
          </div>
          <br clear="both" />

          <h2>Search all dates by:</h2>
          <!-- -->
          <div class="form-group pull-left ticketSearch">
            <label>
              Trip ID
              <input type="number" v-model="filter.tripId" class="form-control" />
            </label>
          </div>
          <!-- txn query -->
          <div class="form-group pull-left ticketSearch">
            <label>
              Transaction ID
              <input type="text" v-model="filter.transactionId" class="form-control" />
            </label>
          </div>
          <!-- Ticket query -->
          <div class="form-group pull-left ticketSearch">
            <label>
              Ticket ID
              <input type="text" v-model="filter.ticketId" class="form-control" />
            </label>
          </div>
          <!-- charge query -->
          <div class="form-group pull-left ticketSearch">
            <label>
              Charge ID (min 8 letters)
              <input type="text" v-model="filter.chargeId" class="form-control" />
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
            </div>
          </div>
        </form>
      </nav>
    </div>

    <div class="row text-center">
      <div class="col-lg-12 ">
        <UibPagination
          :boundaryLinks="true"
          :value="currentPage"
          :totalItems="dataPagination.pageCount * pagination.perPage"
          :itemsPerPage="pagination.perPage" />
        <div>
          Showing {{dataPagination.firstRow}} to {{dataPagination.lastRow}}  of {{dataPagination.totalRows}}
          |
          {{selectedBookings.length}} of {{bookings.length}} tickets selected
          |
          <button :disabled="!selectedBookings.length || numberOfUniqueRoutesInSelectedTickets.length > 1"
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
              <tr v-for="(ticket, $index) in bookings" :class="{
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
                    {{ $index + 1 + (currentPage-1) * pagination.perPage }}
                  </label>
                </td>
                <td>
                  <a v-if="ticket.ticketSale"
                      ui-sref="^.transactions({id: ticket.ticketSale.transactionId})">
                    {{ticket.ticketSale.transactionId}}<br/>
                  </a>
                  <a v-if="ticket.ticketExpense"
                      ui-sref="^.transactions({id: ticket.ticketExpense.transactionId})">
                    (Issue: {{ticket.ticketExpense.transactionId}})<br/>
                  </a>
                  <a v-if="ticket.ticketRefund"
                      ui-sref="^.transactions({id: ticket.ticketRefund.transactionId})">
                    (Related Txn ID: {{ticket.ticketRefund.transactionId}})<br/>
                  </a>
                </td>
                <td class="item-description">
                  <span v-if="ticket.routePass">
                    Purchased using route pass {{ticket.routePass.id}}<br/>
                    Purchase Txn:
                      <a ui-sref="^.transactions({id: ticket.routePass.transactionId})">
                        {{ticket.routePass.transactionId}}</a><br/>
                    Discount: &dollar;{{ f.number(ticket.routePass.discount || 0, '#,###.00') }}
                  </span>
                  <span v-if="ticket.paymentResource">{{ticket.paymentResource}}<br/></span>
                  <span v-if="ticket.ticketExpense">{{ticket.ticketExpense.transaction.description}}<br/></span>
                  <span v-if="ticket.refundResource">{{ticket.refundResource}}<br/></span>
                  <span v-if="ticket.paymentData && ticket.paymentData.transfer && ticket.paymentData.transfer.destination_payment">
                    {{ticket.paymentData.transfer.destination_payment}}<br/>
                  </span>
                  <span v-if="ticket.refundData && ticket.refundData.transfer && ticket.refundData.transfer.destination_payment">
                    {{ticket.refundData.transfer.destination_payment}}<br/>
                  </span>
                  <span v-if="ticket.paymentData && ticket.paymentData.message">
                    {{ticket.paymentData.message}}<br/>
                  </span>
                  <button class="btn btn-danger actions"
                      @click="refundPayment(ticket)"
                      v-if="(ticket.status == 'valid' || ticket.status == 'void') && ticket.paymentResource && ticket.ticketSale && ticket.ticketSale.notes.outstanding > 0">
                   Refund
                   &dollar;{{f.number(ticket.ticketSale.notes.outstanding || 0, '#,###.00')}}
                 </button>
                </td>
                <td>
                  <a ui-sref="^.users({userId: ticket.user.id})">
                    <strong v-if="ticket.user && ticket.user.json">
                      {{ticket.user.json.name + ' #' + ticket.user.json.index}}
                    </strong>
                    <strong v-else>
                      {{ticket.user.name}}
                    </strong>
                    <br> (UID: {{ticket.user.id}})
                  </a>
                  <br> {{f._.get(ticket, 'user.json.telephone', f._.get(ticket, 'user.telephone'))}}
                  <br> {{f._.get(ticket, 'user.json.email', f._.get(ticket, 'user.email'))}}
                  <span v-if="ticket.discount && ticket.discount.debitF">
                    <br>
                    <span class="discount-code label"
                        ui-sref="^.promotions({companyId: ticket.boardStop.trip.route.transportCompanyId, promoId: ticket.discount.discount.promotionId})">
                      <span v-if="f._.get(ticket, 'discount.discount.code')">{{ticket.discount.discount.code}}</span>
                      <span v-else><i>(automatic)</i></span>

                      (#{{ticket.discount.discount.promotionId}})
                    </span>
                  </span>

                  <button type="button" class="btn btn-default"
                    @click="addTicket(ticket)">
                    <span class="glyphicon glyphicon-plus-sign" aria-hidden="true"></span>
                    Issue another ticket
                  </button>
                </td>
                <td class="text-center">
                  <a ui-sref="^.transactions({ticketId: ticket.id})">
                    {{ticket.id}}
                  </a>
                  <button class="btn btn-default btn-icon"
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
                  <a ui-sref="^.trips({routeId: ticket.boardStop.trip.routeId, action: 'route'})">
                    {{ticket.boardStop.trip.routeId}}
                  </a>
                </td>
                <td>
                  {{ticket.boardStop.trip.route.label}}
                </td>
                <td class="item-description">
                  {{ticket.boardStop.trip.route.from}} <br /> {{ticket.boardStop.trip.route.to}}
                </td>
                <td class="item-description">
                  <table class="borderless">
                    <tr>
                      <td>
                        {{f.date(ticket.boardStop.time, 'HH:MM TT')}}
                      </td>
                      <td>
                        {{ticket.boardStop.stop.description}}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        {{f.date(ticket.alightStop.time, 'HH:MM TT')}}
                      </td>
                      <td>
                        {{ticket.alightStop.stop.description}}
                      </td>
                    </tr>
                  </table>
                </td>
                <td>
                  &dollar;{{f.number(ticket.ticketSale.credit, '#,###.00')}}
                  <span v-if="ticket.notes.discountValue">
                    <br>-&dollar;{{f.number(ticket.notes.discountValue, '#,###.00')}}
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
import querystring from 'querystring'
import {mapGetters, mapActions} from 'vuex'

import MultiSelectBroker from '@/components/MultiSelectBroker'
import UibPagination from '@/components/UibPagination.vue'
import SpanSelect from '@/components/SpanSelect.vue'
import filters from '@/filters'

export default {
  props: ['companyId', 'tripId', 'userId'],

  components: {
    MultiSelectBroker,
    SpanSelect,
    UibPagination,
  },

  data () {
    return {
      currentPage: 1,
      pagination: {
        perPage: 50,
        pageCount: 1,
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
          pending: false,
        },
        startAndEndDate: [],
        userQuery: null,
        transactionId: null,
        chargeId: null,
        paymentId: null,
        ticketId: null
      },

      chart: {
        month: new Date,
        fetchedData: [],
      },

      disp: {
        availableRoutes: [],
        month: new Date,
        datesBetween: [],
        counts: {},
        dates: [],
        pagination: {firstRow: 1, lastRow: 1, totalRows: 1},
        isLoading: 0,
      }
    }
  },

  computed: {
    ...mapGetters(['axios']),

    f: () => filters,

    now () {
      return new Date
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
        firstRow: (this.currentPage - 1) * this.fetchedData.perPage + 1,
        lastRow: Math.min(this.currentPage * this.fetchedData.perPage, this.fetchedData.count),
        totalRows: this.fetchedData.count,
        pageCount: Math.ceil(this.fetchedData.count / this.fetchedData.perPage),
      }
    },

    highlightDays () {
      if (!this.chart.fetchedData) return []

      return _.keys(this.chart.fetchedData.countByDate)
        .map((date) => ({
          date: new Date(parseInt(date)),
          annotation: this.chart.fetchedData.countByDate[date],
          selectable: true,
        }))
    },

    csvUrl () {
      return this.buildQuery({format: 'csv'})
    },

    requestUrl () {
      return this.buildQuery()
    },

    monthlyCountsUrl () {
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
    requestUrl: _.debounce(function () {
      this.requery()
    }, {leading: false, trailing: true}, 1000),

    monthlyCountsUrl:  _.debounce(function () {
      this.requeryChart()
    }, {leading: false, trailing: true}, 300),
  },

  created () {
    this.filter.startAndEndDate = [
      this.startOfMonth,
      this.endOfMonth,
    ]
    this.disp.now = this.now
  },

  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal', 'showErrorModal', 'alert', 'confirm']),

    requeryChart () {
      if (!this.monthlyCountsUrl) return

      this.axios.get(this.monthlyCountsUrl)
      .then((result) => {
        this.chart.fetchedData = result.data;
      })
      .catch((err) => {
        console.error(err.stack);
        console.error(err)
      })
    },

    requery () {
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

        this.fetchedData = result.data
        this.bookings = result.data.rows


        this.selectedBookings = [];
      })

      this.spinOnPromise(queryPromise)
      .catch(this.showErrorModal)

      this.requeryChart()
    },

    downloadCsv () {
      this.axios.post('/downloads', {
        uri: $scope.csvUrl
      })
      .then((result) => {
        window.location.href = process.env.BACKEND_URL + '/downloads/' + result.data.token
      })
    },

    sendWrsEmail (ticket) {
      const transactionId = _.get(ticket, 'ticketSale.transactionId') ||
        _.get(ticket, 'ticketExpense.transactionId')

      this.spinOnPromise(this.axios.post(`/custom/wrs/email/${transactionId}`))
      .then(() => {
        return this.alert({
          title: 'Email sent',
          message: 'Email sent to your Beeline Admin Login Email ID. Please check your inbox',
        });
      })
      .catch(this.showErrorModal)
    },

    async refundPayment (ticket) {
      const originalPrice = parseFloat(ticket.ticketSale.credit)
      const discount = ticket.notes.discountValue || 0

      if (await this.confirm('Confirm refund?')) {
        this.spinOnPromise(
          this.axios.post(`/transactions/tickets/${ticket.id}/refund/payment`, {
            targetAmt: originalPrice - discount,
          })
        )
        .then((response) => {
          var txn = response.data;
          var payment = txn.transactionItems.find(ts => ts.itemType == 'refundPayment' && ts.refundPayment)

          this.requery()
          return this.alert( parseFloat(payment.credit).toFixed(2) + " refunded.")
        })
        .catch(this.showErrorModal)
      }
    },

    issueTickets () {
      const selectedTickets = this.selectedTickets
      const firstTicket = selectedTickets.length > 0 ? selectedTickets[0] : null;

      const issueTicketModalOptions = {
        user: _(selectedTickets)
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
          cancelledTickets: selectedTickets
        })
      }

      return this.showModal({
        component: 'IssueTicket',
        props: issueTicketModalOptions,
      })
      .then(() => this.requery(), () => { /* do nothing if cancelled */ })
    },

    // Edit ticket button
    editTicket (ticket) {
      const selectedTicketIds = [ticket.id];
      const selectedTickets = [ticket];

      return this.showModal({
        component: 'IssueTicket',
        props:  {
          users: [ticket.user],
          routeId: ticket.boardStop.trip.routeId,
          boardStopStopId: ticket.boardStop.stopId,
          alightStopStopId: ticket.alightStop.stopId,
          cancelledTickets: selectedTickets
        }
      })
      .then(() => this.requery(), () => { /* do nothing if cancelled */ })
    },
    // Add ticket button -- don't cancel earlier ticket
    addTicket (ticket) {
      const selectedTicketIds = [ticket.id];
      const selectedTickets = [ticket];

      return this.showModal({
        component: 'IssueTicket',
        props: {
          users: [ticket.user],
          routeId: ticket.boardStop.trip.routeId,
          boardStopStopId: ticket.boardStop.stopId,
          alightStopStopId: ticket.alightStop.stopId,
        },
      })
      .then(() => this.requery(), () => { /* do nothing if cancelled */ })
    },

    async issueTickets (result) {
      if (!await this.confirm("Are you sure you want to issue these tickets?")) {
        return;
      }

      const oldTransactionIds = $scope.data.cancelledTickets &&
          _($scope.data.cancelledTickets)
            .map(tkt => (tkt.ticketSale && tkt.ticketSale.transactionId) ||
                (tkt.ticketExpense && tkt.ticketExpense.transactionId) || false
            )
            .filter(tid => tid !== false)
            .uniq()
            .value();
      const cancelledTicketIds = $scope.data.cancelledTickets &&
          $scope.data.cancelledTickets.map(ticket => ticket.id)

      const oldTransactionDescription = oldTransactionIds && oldTransactionIds.length ?
          `(Original Txn #${oldTransactionIds.join(', #')})` : '';
      const oldTicketDescription = cancelledTicketIds && cancelledTicketIds.length ?
          `(Replacing tickets #${cancelledTicketIds.join(', #')})` : '';
      const description = $scope.data.reason || '';

      var issueRequest = {
        trips: _.flatten($scope.data.users.map(user => /* for each user */
          $scope.purchaseOrder.map(po => /* for each trip */
            _.assign(
              _.pick(po, ['boardStopId', 'alightStopId', 'tripId']),
              {userId: user.id}
            )
          )
        )),
        cancelledTicketIds,
        description: description + ' ' + oldTransactionDescription + ' ' + oldTicketDescription
      }

      return this.spinOnPromise(this.axios.post('/transactions/tickets/issue_free', issueRequest))
        .then(() => this.flash('Tickets created!'))
        .catch(this.showErrorModal)
    },

    async toggleVoidTicket (ticket) {
      const { id, status } = ticket
      assert(['valid', 'void'].includes(status),
        `This ticket is ${status} and cannot be voided or made valid`)
      const newStatus = (status === 'void') ? 'valid' : 'void'
      if (await this.confirm(`Confirm change ticket status to ${newStatus}?`)) {
        this.spinOnPromise(this.axios.put(`/tickets/${id}/status`, {status: newStatus}))
        .then((response) => {
          const { status } = response.data
          this.requery()
          return this.alert(`This ticket is now ${status}`)
        })
        .catch(this.showErrorModal)
      }
    },

    buildQuery (override) {
      // update the request and CSV url
      // tripStartDate & tripEndDate should be converted to
      // UTC midnight of the intended dates

      const [startDate, endDate] = this.filter.startAndEndDate

      if (!startDate || !endDate) return null

      const queryOptions = {
        page: this.pagination.currentPage || 1,
        perPage: this.pagination.perPage,

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

      if (this.filter.routeId) {
        queryOptions.routeId = this.filter.routeId
      }

      if (this.filter.tripId || this.filter.paymentId ||
          this.filter.chargeId || this.filter.ticketId) {
        delete queryOptions.tripStartDate;
        delete queryOptions.tripEndDate;
      }

      if (this.filter.tripId) {
        queryOptions.tripId = this.filter.tripId
      }
      if (this.filter.userQuery) {
        queryOptions.userQuery = this.filter.userQuery
      }
      if (this.filter.stopQuery) {
        queryOptions.stopQuery = this.filter.stopQuery
      }
      if (this.filter.transactionId) {
        queryOptions.transactionId = this.filter.transactionId;
      }
      if (this.filter.chargeId) {
        queryOptions.chargeId = this.filter.chargeId
      }
      if (this.filter.paymentId) {
        queryOptions.paymentId = this.filter.paymentId
      }
      if (this.filter.ticketId) {
        queryOptions.ticketId = this.filter.ticketId
      }

      if (this.companyId) {
        queryOptions.transportCompanyId = this.companyId;
      }

      Object.assign(queryOptions, override);

      return `/custom/wrs/report?` + querystring.stringify(queryOptions)
    },

    setSelection (list) {
      this.selectedBookings = list
    },

    toggleSelection (list) {
      this.selectedBookings = _.differenceBy(this.selectedBookings, list, 'id')
        .concat(_.differenceBy(list, this.selectedBookings, 'id'))
    }
  }
}

/// TRIP SELECTION BROKER
// export default function(AdminService, RoutesService, $rootScope, LoadingSpinner) {
//     link(scope, elem, attr) {
//       // The options for the select
//       scope.info = {
//         tripDates: [],
//         tripStops: [],
//       }

//       // Pull the list of routes
//       var routesPromise = RoutesService.getCurrentRoutes()
//       .then((routes) => {
//         scope.routes = routes
//       })
//       LoadingSpinner.watchPromise(routesPromise);

//       // Get trip dates
//       scope.$watch('routeId', (routeId) => {
//         if (!routeId) {
//           return null;
//         }

//         scope.info.tripDates = [];
//         scope.trips = [];

//         var today = new Date();
//         today.setHours(0,0,0);

//         RoutesService.getRoute(routeId, {
//           includeTrips: true,
//           startDate: today.getTime()
//         })
//         .then((route) => {
//           scope.trips = route.trips.filter(t => t.isRunning);

//           scope.datepickerDaysAllowed = scope.trips.map(trip =>
//             new Date(
//                 trip.date.getFullYear(),
//                 trip.date.getMonth(),
//                 trip.date.getDate()));
//           scope.datepickerHighlightDays = route.trips.map(trip =>
//             ({
//               date: new Date(
//                   trip.date.getFullYear(),
//                   trip.date.getMonth(),
//                   trip.date.getDate()),
//               selectable: true,
//               annotation: `${trip.availability.seatsAvailable}`
//             }))

//           // Unselect the dates that are now unselectable
//           var offset = new Date().getTimezoneOffset() * 60000;
//           scope.selectedDates = scope.selectedDates.filter(
//             d => route.trips.some(t => t.date.valueOf() + offset === d.valueOf())
//           )
//         })
//       });

//       // Both deep and shallow watch selected dates
//       scope.$watch('selectedDates', updateStops, true);
//       scope.$watch('selectedDates', updateStops, false);

//       scope.$watchGroup(['boardStop', 'alightStop', 'selectedTrips'], () => {
//         if (scope.boardStop) {
//           scope.boardStopId = scope.boardStop.stopId;
//         }
//         if (scope.alightStop) {
//           scope.alightStopId = scope.alightStop.stopId;
//         }

//         if (!scope.selectedTrips) {
//           return;
//         }

//         // update scope.trips
//         scope.purchaseOrder = scope.selectedTrips.map(trip =>
//           ({
//             tripId: trip.id,
//             boardStopId: scope.boardStop ? trip.tripStops.find(ts => ts.stopId === scope.boardStop.stopId).id
//                                     : null,
//             alightStopId: scope.alightStop ? trip.tripStops.find(ts => ts.stopId === scope.alightStop.stopId).id
//                                     : null
//           }))
//       })
//     },
//   }
// }

</script>