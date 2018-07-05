<template>
<div>
  <h1>Transactions</h1>

  <section class="filter">
    <!-- transaction dates -->
    <div class="datepicker-wrap">
      Select the start date, and the end date:
      <!-- note: using default offset (= user's time zone)
        because transactions precise down to the second -->
      <SpanSelect
        :specialDates="highlightDays"
        :value="filter.startAndEndDate"
        @input="filter.startAndEndDate = $event"
        @month-changed="chart.month = $event" />
    </div>

    <!-- transaction types -->
    <div>
      Transaction Types:
      <span class="btn-group">
        <button
          @click="filter.itemTypes.ticketSale = !filter.itemTypes.ticketSale"
          :class="{[filter.itemTypes.ticketSale ? 'btn-primary' : 'btn-default']: true}" class="btn">
            Ticket Sale
        </button>
        <button
          @click="filter.itemTypes.ticketRefund = !filter.itemTypes.ticketRefund"
          :class="{[filter.itemTypes.ticketRefund ? 'btn-primary' : 'btn-default']: true}" class="btn">
            Ticket Refund
        </button>
        <button
          @click="filter.itemTypes.ticketExpense = !filter.itemTypes.ticketExpense"
          :class="{[filter.itemTypes.ticketExpense ? 'btn-primary' : 'btn-default']: true}" class="btn">
            Free Tickets (Ticket Expense)
        </button>
      </span>
      <span class="btn-group">
        <button
          @click="filter.itemTypes.payment = !filter.itemTypes.payment"
          :class="{[filter.itemTypes.payment ? 'btn-primary' : 'btn-default']: true}" class="btn">
            Payments
        </button>
        <button
          @click="filter.itemTypes.refundPayment = !filter.itemTypes.refundPayment"
          :class="{[filter.itemTypes.refundPayment ? 'btn-primary' : 'btn-default']: true}" class="btn">
            Refunds
        </button>
        <button
          @click="filter.itemTypes.routeCredits = !filter.itemTypes.routeCredits"
          :class="{[filter.itemTypes.routeCredits ? 'btn-primary' : 'btn-default']: true}" class="btn">
            Route Credits
        </button>
        <button
          @click="filter.itemTypes.routePass = !filter.itemTypes.routePass"
          :class="{[filter.itemTypes.routePass ? 'btn-primary' : 'btn-default']: true}" class="btn">
            Route Passes
        </button>
      </span>
      <span class="btn-group">
        <button
          @click="filter.itemTypes.transfer = !filter.itemTypes.transfer"
          :class="{[filter.itemTypes.transfer ? 'btn-primary' : 'btn-default']: true}" class="btn">
            Beeline &lt;-> Operator Funds Transfer
        </button>
        <button
          @click="filter.itemTypes.account = !filter.itemTypes.account"
          :class="{[filter.itemTypes.account ? 'btn-primary' : 'btn-default']: true}" class="btn">
            Account
        </button>
        <button
          @click="filter.itemTypes.discount = !filter.itemTypes.discount"
          :class="{[filter.itemTypes.discount ? 'btn-primary' : 'btn-default']: true}" class="btn">
            Discount
        </button>
      </span>
    </div>

    <!-- txn id -->
    <div>
      <label>
      Transaction ID
        <input type="text"
        v-model.lazy="filter.transactionId"
        />
      </label>
    </div>

    <!-- ticket id -->
    <div>
      <label>
      Ticket ID
        <input type="text" v-model.lazy="filter.ticketId" />
      </label>
    </div>

    <!-- user search -->
    <div>
      <label>
      User search
        <input type="text" v-model.lazy="filter.userQuery" />
      </label>
    </div>

    <button class="btn btn-lg btn-primary" @click="downloadCsv()">
      Download CSV
    </button>
    <button class="btn btn-default btn-lg" @click="downloadStatement()">
      Download Statement
    </button>
  </section>


  <UibPagination
    :boundaryLinks="true"
    :value="pagination.currentPage - 1"
    @input="pagination.currentPage = $event + 1"
    :totalItems="dataPagination.pageCount * pagination.perPage"
    :itemsPerPage="pagination.perPage" />

  <table class="table table-striped transactions-view">
    <thead>
      <tr>
        <th>Txn ID</th>
        <th>Txn Date</th>
        <th>Txn Description</th>
        <th>Txn Item ID</th>
        <th>Item type</th>
        <th>Item ID</th>
        <th>Description 1</th>
        <th>Description 2</th>
        <th>Description 3</th>
        <th>Description 4</th>
        <th>Description 5</th>
        <th>Description 6</th>
        <th>Debit</th>
        <th>Credit</th>
      </tr>
    </thead>
    <tbody v-if="fetchedData">
      <tr v-for="item in fetchedData.rows"
        :key="item.id"
        :class="{
          failed: !item.transaction.committed
        }">
        <td>
          <a :href="`#/c/${companyId}/transactions/${item.transactionId}`">
            {{item.transactionId}}<br/>
          </a>
        </td>
        <td>{{f.date(item.transaction.createdAt, 'dd-mmm-yyyy HH:MM:ss')}}</td>
        <td>{{item.transaction.description}}</td>
        <td>{{item.id}}</td>
        <td>{{item.itemType}}</td>
        <td>{{item.itemId}}</td>

        <!-- for each ticket type -->
        <template v-if="item.itemType == 'ticketSale'">
          <td>
            <template v-if="f._.get(item, 'ticketSale.user.json')">
              {{f._.get(item, 'ticketSale.user.json.name')}}
              {{f._.get(item, 'ticketSale.user.json.index', -1) >= 0
                ? '#' + (item.ticketSale.user.json.index + 1)
                : ''}}
            </template>
            <template v-else>
              {{f._.get(item, 'ticketSale.user.name')}}
            </template>
          </td>
          <td>
            {{
              f._.get(item, 'ticketSale.user.json.telephone') ||
              f._.get(item, 'ticketSale.user.telephone')
            }}
          </td>
          <td>
            {{
              f._.get(item, 'ticketSale.user.json.email') ||
              f._.get(item, 'ticketSale.user.email')
            }}
          </td>
          <td>{{f._.get(item, 'ticketSale.boardStop.stop.description')}}</td>
          <td>{{f._.get(item, 'ticketSale.alightStop.stop.description')}}</td>
          <td>
            <template v-if="item.ticketSale">
              <a :href="`#/c/${companyId}/bookings?&routeId=${item.ticketSale.boardStop.trip.routeId}`">
                {{item.ticketSale.boardStop.trip.route.label}}
              </a>
              -
              <a :href="`#/c/${companyId}/bookings?&tripId=${item.ticketSale.boardStop.tripId}`">
                Trip #{{item.ticketSale.boardStop.tripId}}
              </a>
            </template>
          </td>
        </template>

        <!-- for each ticket type -->
        <template v-if="item.itemType == 'ticketRefund'">
          <td>
            <template v-if="f._.get(item, 'ticketRefund.user.json')">
              {{f._.get(item, 'ticketRefund.user.json.name')}}
              {{f._.get(item, 'ticketRefund.user.json.index', -1) >= 0
                ? '#' + (item.ticketRefund.user.json.index + 1)
                : ''}}
            </template>
            <template v-else>
              {{f._.get(item, 'ticketRefund.user.name')}}
            </template>
          </td>
          <td>
            {{
              f._.get(item, 'ticketRefund.user.json.telephone') ||
              f._.get(item, 'ticketRefund.user.telephone')
            }}
          </td>
          <td>
            {{
              f._.get(item, 'ticketRefund.user.json.email') ||
              f._.get(item, 'ticketRefund.user.email')
            }}
          </td>
          <td>{{f._.get(item, 'ticketRefund.boardStop.stop.description')}}</td>
          <td>{{f._.get(item, 'ticketRefund.alightStop.stop.description')}}</td>
          <td>
            <a :href="`#/c/${companyId}/bookings?routeId=${item.ticketRefund.boardStop.trip.routeId})`">
              {{item.ticketRefund.boardStop.trip.route.label}}
            </a>
            -
            <a :href="`#/c/${companyId}/bookings?tripId=${item.ticketRefund.boardStop.tripId}`">
              Trip #{{item.ticketRefund.boardStop.tripId}}
            </a>
          </td>
        </template>

        <!-- for each ticket type -->
        <template v-if="item.itemType == 'ticketExpense'">
          <td>
            <template v-if="f._.get(item, 'ticketExpense.user.json')">
              {{f._.get(item, 'ticketExpense.user.json.name')}}
              {{f._.get(item, 'ticketExpense.user.json.index', -1) >= 0
                ? '#' + (item.ticketExpense.user.json.index + 1)
                : ''}}
            </template>
            <template v-else>
              {{f._.get(item, 'ticketExpense.user.name')}}
            </template>
          </td>
          <td>
            {{
              f._.get(item, 'ticketExpense.user.json.telephone') ||
              f._.get(item, 'ticketExpense.user.telephone')
            }}
          </td>
          <td>
            {{
              f._.get(item, 'ticketExpense.user.json.email') ||
              f._.get(item, 'ticketExpense.user.email')
            }}
          </td>
          <td>{{f._.get(item, 'ticketExpense.boardStop.stop.description')}}</td>
          <td>{{f._.get(item, 'ticketExpense.alightStop.stop.description')}}</td>
          <td>
            <a :href="`#/c/${companyId}/bookings?routeId=${item.ticketExpense.boardStop.trip.routeId}`">
              {{item.ticketExpense.boardStop.trip.route.label}}
            </a>
            -
            <a :href="`#/c/${companyId}/bookings?tripId=${item.ticketExpense.boardStop.tripId}`">
              Trip #{{item.ticketExpense.boardStop.tripId}}
            </a>
          </td>
        </template>

        <!-- payment -->
        <template v-if="item.itemType == 'payment'">
          <td>{{item.payment.paymentResource}}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </template>

        <!-- payment -->
        <template v-if="item.itemType == 'refundPayment'">
          <td>{{item.refundPayment.paymentResource}}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </template>

        <!-- revenue/expense accounts -->
        <template v-if="item.itemType == 'account'">
          <td>{{item.account.name}}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </template>

        <!-- transfers -->
        <template v-if="item.itemType == 'transfer'">
          <td>{{item.transfer.transportCompanyId}}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </template>

        <!-- Route credits -->
        <template v-if="item.itemType == 'routeCredits'">
          <td>{{item.routeCredits.tag}}</td>
          <td>{{item.routeCredits.userId}}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </template>

        <!-- Route passes -->
        <template v-if="item.itemType == 'routePass'">
          <td>{{item.routePass.tag}}</td>
          <td>{{item.routePass.userId}}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </template>

        <!-- transfers -->
        <template v-if="item.itemType == 'discount'">
          <td v-if="item.itemType == 'discount'">
            {{item.discount.description}}
            <span v-if="item.discount.code">
              &mdash;
              {{item.discount.code}}
            </span>
          </td>
          <td v-if="item.itemType == 'discount'">
            <!--
              FIXME: we need to identify the correct company,
              otherwise the destination page will load nothing
            -->
            <a :href="`#/c/${companyId}/promotions/${item.discount.promotionId}`"
                v-if="item.discount.promotionId">
              Promotion #{{item.discount.promotionId}}
            </a>
          </td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </template>

        <!-- debit/credit -->
        <td>{{item.debitF >= 0 ? item.debit : ''}}</td>
        <td>{{item.creditF > 0 ? item.credit : ''}}</td>
      </tr>
    </tbody>
  </table>
</div>
</template>
<script>
import assert from 'assert'
import querystring from 'querystring'
import {mapGetters, mapActions} from 'vuex'
import redirect from '@/shared/redirect'

import MultiSelectBroker from '@/components/MultiSelectBroker'
import UibPagination from '@/components/UibPagination.vue'
import RouteSelector from '@/components/RouteSelector.vue'
import SpanSelect from '@/components/SpanSelect.vue'
import filters from '@/filters'

export default {
  props: ['companyId', 'transactionId', 'ticketId'],

  components: {
    MultiSelectBroker,
    RouteSelector,
    SpanSelect,
    UibPagination,
  },

  data () {
    return {
      pagination: {
        currentPage: 1,
        perPage: 100,
        pageCount: 1,
      },

      fetchedData: null,
      bookings: [],
      selectedBookings: [],

      filter: {
        orderBy: 'createdAt',
        order: 'desc',

        itemTypes: {
          ticketSale: true,
          ticketRefund: true,
          ticketExpense: true,
          payment: true,
          transfer: true,
          refundPayment: true,
          account: true,
          discount: true,
          routeCredits: true,
          routePass: true,
        },
        startAndEndDate: [],

        userQuery: null,
        transactionId: null,
        ticketId: null,
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
    ...mapGetters(['axios', 'isSuperAdmin']),

    f: () => filters,

    now () {
      return new Date
    },
    startOfMonth () {
      return new Date(
        this.now.getFullYear(),
        this.now.getMonth(),
        1
      )
    },
    endOfMonth () {
      return new Date(
        this.now.getFullYear(),
        this.now.getMonth() + 1,
        0
      )
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
      /* querystring.stringify strips out empty arrays [] */
      return this.buildQuery({page:1, perPage:10000000, format: 'csv'})
    },

    statementUrl () {
      /* querystring.stringify strips out empty arrays [] */
      return this.buildQuery({page:1, perPage:10000000, format: 'statement'})
    },

    requestUrl () {
      return this.buildQuery()
    },
  },

  watch: {
    requestUrl: _.debounce(function () {
      this.requery()
    }, 1000, {leading: false, trailing: true}),
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
    ...mapActions('modals', ['showModal', 'showErrorModal', 'alert', 'confirm', 'flash']),

    requery () {
      if (this.requestUrl === null) return

      const queryPromise = this.$lastPromise = this.axios.get(this.requestUrl)
      .then((result) => {
        if (queryPromise !== this.$lastPromise) return

        // for WRS tickets, we cheated and saved a JSON in the user's name field :(
        for (let ti of result.data.rows) {
          if (ti.itemType.startsWith('ticket') &&
              ti[ti.itemType]) {
            try {
              ti[ti.itemType].user.json = JSON.parse(ti[ti.itemType].user.name);
            }
            catch (err) {}
          }
        }

        this.fetchedData = result.data
      })
      .catch((err) => {
        console.log(err)
      })

      this.spinOnPromise(queryPromise)
      .catch(this.showErrorModal)
    },

    buildQuery(overrides) {
      var queryOpts = {};

      queryOpts.order = this.filter.order = 'desc';
      queryOpts.orderBy = this.filter.orderBy = 'createdAt';
      queryOpts.perPage = this.pagination.perPage;
      queryOpts.page = this.pagination.currentPage;
      queryOpts.itemTypes = JSON.stringify(Object.keys(this.filter.itemTypes)
          .filter(k => this.filter.itemTypes[k]))

      if (this.filter.transactionId) {
        queryOpts.transactionId = this.filter.transactionId;
      }
      else if (this.filter.ticketId) {
        queryOpts.ticketId = this.filter.ticketId;
      }
      else {
        const [startDate, endDate] = this.filter.startAndEndDate

        if (!startDate || !endDate) return null

        if (this.filter.userQuery) {
          queryOpts.userQuery = this.filter.userQuery;
        }

        queryOpts.startDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        ).getTime();

        queryOpts.endDate = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate() + 1
        ).getTime();
      }

      Object.assign(queryOpts, overrides);

      return '/transaction_items?' + querystring.stringify(queryOpts);
    },
    downloadCsv () {
      this.axios.post('/downloads', {
        uri: this.csvUrl
      })
      .then((result) => {
        redirect(`${process.env.BACKEND_URL}/downloads/${result.data.token}`)
      })
    },
    downloadStatement () {
      this.axios.post('/downloads', {
        uri: this.statementUrl
      })
      .then((result) => {
        redirect(`${process.env.BACKEND_URL}/downloads/${result.data.token}`)
      })
    },
  }
}

</script>
