<template>
  <div class="container-fluid withnav promotions-list">
    
    
    <div class="col-lg-12">
      <h1>Manage Promotions</h1>

      <div>
        <label>
          <input type="radio" value="Promotion" v-model="filter.promotionType" />
          Promotions on Tickets
        </label>
        <label>
          <input type="radio" value="RoutePass" v-model="filter.promotionType" />
          Promotions on Route Passes
        </label>
      </div>

      <div v-if="filter.promotionType === 'Promotion'">
        <label>
          <input type="radio" value="General" v-model="filter.promotionSubtype" />
          General Promotions
        </label>
        <label>
          <input type="radio" value="OneTimeUse" v-model="filter.promotionSubtype" />
          One-time Use Promotions
        </label>
      </div>

      <div style="text-align: right">
        <button @click="postNew()" class="btn btn-default">
          <span class="glyphicon glyphicon-plus"></span>
          <span v-if="filter.promotionType === 'Promotion'">Add Promo Code</span>
          <span v-if="filter.promotionType === 'RoutePass'">Add Route Pass</span>
        </button>
      </div>

      <table class="table table-striped">
        <thead>
          <tr>
            <SortTh style="width: 3%"></SortTh>
            <SortTh @sort="sort" field="id" :order="filter.order" :orderBy="filter.orderBy" style="width: 5%">ID</SortTh>
            <SortTh @sort="sort" field="type" :order="filter.order" :orderBy="filter.orderBy" style="width: 5%">Type</SortTh>
            <SortTh @sort="sort" field="code" :order="filter.order" :orderBy="filter.orderBy" style="width: 10%">Code</SortTh>
            <SortTh @sort="sort" field="description" :order="filter.order" :orderBy="filter.orderBy" style="width: 15%">Description</SortTh>
            <SortTh @sort="sort" field="" :order="filter.order" :orderBy="filter.orderBy" style="width: 15%">Limits</SortTh>
            <SortTh @sort="sort" field="orderFields.orderPercUse" :order="filter.order" :orderBy="filter.orderBy" style="width: 15%">Usage</SortTh>
            <SortTh @sort="sort" field="" :order="filter.order" :orderBy="filter.orderBy" style="width: 15%">Criteria</SortTh>
            <SortTh @sort="sort" field="" :order="filter.order" :orderBy="filter.orderBy" style="width: 15%">Discount</SortTh>
            <SortTh @sort="sort" field="createdAt" :order="filter.order" :orderBy="filter.orderBy" style="width: 5%">Created at</SortTh>
            <SortTh @sort="sort" field="updatedAt" :order="filter.order" :orderBy="filter.orderBy" style="width: 5%">Updated at</SortTh>
            <SortTh @sort="sort" field="" :order="filter.order" :orderBy="filter.orderBy" style="width: 7%"></SortTh>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(promotion, $index) in sortedPromotions" :key="promotion.id">
            <td>
              {{$index + 1}}
            </td>
            <td>
              <a :href="`#/c/${companyId}/promotions/${promotion.id}`">
                {{promotion.id}}
              </a>
            </td>
            <td>
              {{promotion.type}}
            </td>
            <td>
              <a :href="`#/c/${companyId}/promotions/${promotion.id}`">
                {{promotion.code}}
              </a>
            </td>
            <td>
              <a :href="`#/c/${companyId}/promotions/${promotion.id}`">
                {{promotion.description}}
              </a>
            </td>
            <td>
              <div v-if="promotion.params.usageLimit.userLimit">
                <b>Per User:</b> {{promotion.params.usageLimit.userLimit}}
                <br/>
              </div>
              <div v-if="promotion.params.usageLimit.globalLimit">
                <b>All Redemptions:</b> {{promotion.params.usageLimit.globalLimit}}
                <br/>
              </div>
            </td>
            <td>
              <div v-if="promotion.params.usageLimit.globalLimit">
                {{((100 * promotion.counts.global / promotion.params.usageLimit.globalLimit) || 0).toFixed(0) }}%
              </div>
              <div v-if="promotion.counts && promotion.counts.global !== undefined">
                {{promotion.counts.global || 0}} redemptions
              </div>
              <div v-if="promotion.params.usageLimit.userLimit">
                {{promotion.counts.distinctUsers || 0}} unique users
              </div>
            </td>
            <td>
              <ol class="criteria">
                <li v-for="criterion in promotion.params.qualifyingCriteria">
                  <b>{{f.titleCase(criterion.type)}}</b>
                  <SchemaViewer :schema="PromotionsSchemata[criterion.type]" :value="criterion.params">
                  </SchemaViewer>
                </li>
              </ol>
            </td>
            <td>
              <b>{{f.titleCase(promotion.params.discountFunction.type)}}</b>
              <ul class="discount">
                <li v-for="(value, key) in promotion.params.discountFunction.params">
                  {{key}}: {{value}}
                </li>
              </ul>
            </td>
            <td>
              {{f.date(promotion.createdAt, 'dd mmm yyyy HH:MM:ss')}}
            </td>
            <td>
              {{f.date(promotion.updatedAt, 'dd mmm yyyy HH:MM:ss')}}
            </td>
            <td>
              <a class="btn btn-default"
                :href="`#/c/${companyId}/promotions/${promotion.id}`">
                <span class="glyphicon glyphicon-pencil"/> Edit
              </a>
              <button @click="destroy(promotion)" class="btn btn-danger">
                <span class="glyphicon glyphicon-trash"/> Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

</template>
<script>
import _ from 'lodash'
import {mapActions, mapGetters} from 'vuex'
import leftPad from 'left-pad'
import SchemaViewer from '../components/promotions/SchemaViewer.vue'
import PromotionsSchemata from '../components/promotions/Schemata'
import CompanyIdMixin from '../mixins/CompanyIdMixin'
import SortTh from '@/components/SortTh.vue'
const filters = require('../filters')

export default {
  mixins: [CompanyIdMixin],

  components: {
    SchemaViewer,
    SortTh,
  },
  data () {
    return {
      filter: {
        orderBy: 'code',
        order: 'asc',
        promotionType: 'Promotion',
        promotionSubtype: 'General'
      },
      orderFields: {
        orderPercUse (promotion) {
          return (promotion.counts.global / promotion.params.usageLimit.globalLimit) || 0
        }
      },
      promotions: null,
    }
  },

  computed: {
    ...mapGetters(['axios']),

    f: () => filters,

    PromotionsSchemata: () => PromotionsSchemata,

    sortedPromotions () {
      return this.promotions && _.orderBy(
        this.promotions.filter(x => {
          if (this.filter.promotionType === 'RoutePass') {
            return x.type === this.filter.promotionType
          } else {
             if (this.filter.promotionSubtype === 'General') {
              return x.type === this.filter.promotionType && (x.params.usageLimit.userLimit !== 1 || x.params.usageLimit.globalLimit !== 1)
            } else {
              return x.type === this.filter.promotionType && x.params.usageLimit.userLimit === 1 && x.params.usageLimit.globalLimit === 1
            }
          }
        }),
        [this.filter.orderBy],
        [this.filter.order]
      )
    }
  },
  watch: {
    companyId: {
      immediate: true,
      handler (h) {
       this.spinOnPromise(this.refresh())
      }
    }
  },

  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal', 'showErrorModal']),

    refresh () {
      return this.axios.get(`/companies/${this.companyId}/promotions`)
        .then(response => {
          this.promotions = response.data
        })
    },

    sort({order, orderBy}) {
      this.filter.order = order
      this.filter.orderBy = orderBy
    },

    postNew () {
      const code = randomString() + randomString() + randomString()

      let promoData

      let now = new Date()
      let startDate = now.toISOString().slice(0,10)
      // 1 month after today
      let endDate = new Date(now.getFullYear(), now.getMonth()+1, now.getDate()).toISOString().slice(0,10)

      if (this.filter.promotionType === 'Promotion') {
        promoData = {
          code,
          description: `New Promo Code`,
          type: 'Promotion',
          params: {
            qualifyingCriteria: [{type: 'limitByCompany', params: {companyId: this.companyId}}, {type: 'limitByTripDate', params: {startDate: startDate,endDate: endDate}}],
            discountFunction: { type: 'simpleRate', params: {rate: 0.10}},
            refundFunction: { type: 'refundDiscountedAmt', params: {} },
            usageLimit: {userLimit: 1, globalLimit: 1000000}
          }
        }
      } else {
        // TODO: how to add route price schedule to the route?
        promoData = {
          code: '', //route pass with no promo code entered
          description: `New Route Pass`,
          type: 'RoutePass',
          params: {
            tag: code,
            qualifyingCriteria: [{type: 'limitByCompany', params: {companyId: this.companyId}}, {type: 'limitByPurchaseDate', params: {startDate: startDate,endDate: endDate}}],
            discountFunction: { type: 'tieredRateByTotalValue', params: {"schedule": [[25, 0.1], [50, 0.2]]}},
            refundFunction: { type: 'refundDiscountedAmt', params: {} },
            usageLimit: {userLimit: null, globalLimit: null}
          }
        }
      }

      return this.spinOnPromise(
        this.axios.post(
          `/companies/${this.companyId}/promotions`,
          promoData
        )
        .then(() => this.refresh())
      )
      .then(() =>
        this.showModal({
          component: 'CommonModals',
          props: {
            type: 'flash',
            message: `A new dummy promotion ${code} has been created`
          }
        })
      )
      .catch(this.showErrorModal)
    },

    destroy (promotion) {
      return this.showModal({
        component: 'CommonModals',
        props: {
          type: 'confirm',
          message: `Are you sure you want to delete?`
        }
      })
      .then((result) => {
        if (result) {
          this.spinOnPromise(
            this.axios.delete(
              `/companies/${this.companyId}/promotions/${promotion.id}`
            )
            .then(() => this.refresh())
          )
        }
      })
      .catch(this.showErrorModal)
    }
  }
}


function randomString() {
  return leftPad(Math.floor(Math.random() * (1 << 30))
    .toString(35).toUpperCase(), 5, 'Z')
}
</script>
