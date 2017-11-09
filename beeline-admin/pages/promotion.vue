<template>
  <div>
    <LoadingSpinner ref="loadingSpinner"/>
    <ModalHelper ref="modalHelper"/>

    <div class="col-lg-12">
      <h1 v-if="promotion && promotion.type === 'Promotion'">Edit Promotion '{{promotion && promotion.code}}'</h1>
      <h1 v-if="promotion && promotion.type === 'RoutePass'">Edit Route Pass '{{promotion && promotion.code}}'</h1>

      <div v-if="promotion === false">
        Error loading promotion
      </div>
      <div v-else-if="promotion === null">
        <div class="spinner-elem"></div>
      </div>
      <div v-else>
        <table class="table">
          <tr>
            <th>General</th>
            <th>Redemption Limits</th>
          </tr>
          <tr>
            <td>
              <div class="form-group">
                <label>
                  Code
                  <input type="text" v-model="promotion.code"
                    placeholder="HARI-RAYA" class="form-control"
                    @change="promotion.code = promotion.code.toUpperCase()" />
                </label>
                <div class="alert alert-warning" v-show="!promotion.code">
                  You have not keyed in a promo code. This promotion will be
                  automatically applied to <b>all transactions</b> without a promo code.
                </div>
              </div>

              <div class="form-group" v-if="promotion.type === 'RoutePass'">
                <label>
                  Tag
                  <input type="text" v-model="promotion.params.tag" class="form-control" />
                </label>
              </div>

              <div class="form-group">
                <label>
                  Description (shown to user)
                  <input type="text" v-model="promotion.description"
                    placeholder="Hari Raya promotion" class="form-control"  />
                </label>
              </div>

            </td>
            <td>
              <div class="form-group">
                <label>
                  Max redemptions per user:
                  <input type="number" class="form-control"
                    :value="promotion.params.usageLimit.userLimit"
                    @change="promotion.params.usageLimit.userLimit = $event.target.value ? parseInt($event.target.value) : null" />
                </label>
              </div>

              <div class="form-group">
                <label>
                  Max redemptions by all users:
                  <input type="number" class="form-control"
                    :value="promotion.params.usageLimit.globalLimit"
                    @change="promotion.params.usageLimit.globalLimit = $event.target.value ? parseInt($event.target.value) : null" />
                </label>
              </div>

              <div>
                <b>Note:</b> '0' to disable the promotion, blank to have no limit
              </div>
            </td>
          </tr>
        </table>

        <table class="table table-striped discount-params">
          <thead><tr>
            <th style="width: 50%">
              Apply promo code if...
            </th>
            <th style="width: 50%">
              Give the user...
            </th>
          </tr></thead>
          <tbody>
            <tr>
            <td>
              <table class="table table-striped criteria-list"><tbody>
              <tr v-for="(criterion, index) in promotion.params.qualifyingCriteria"
                  :key="criterion.id">
                <td>
                  <PromotionCriterionEditor :value="criterion"
                    :promotionType="promotion.type"
                    :companyId="companyId"
                    @input="promotion.params.qualifyingCriteria.splice(index, 1, $event)" />
                </td>
                <td>
                  <button @click="promotion.params.qualifyingCriteria = f.moveDown(promotion.params.qualifyingCriteria, index)"
                      class="btn btn-default">
                    <span class="glyphicon glyphicon-arrow-down"></span>
                  </button>
                  <button @click="promotion.params.qualifyingCriteria = f.moveUp(promotion.params.qualifyingCriteria, index)"
                      class="btn btn-default">
                    <span class="glyphicon glyphicon-arrow-up"></span>
                  </button>
                </td>
                <td>
                  <button @click="promotion.params.qualifyingCriteria.splice(index, 1)"
                    class="btn btn-danger">
                    <span class="glyphicon glyphicon-trash"></span>
                  </button>
                </td>
              </tr>
              </tbody></table>
              <div v-show="checkResults">
                Errors:
                <ul>
                  <li v-for="result in checkResults">
                    {{result.message}}
                  </li>
                </ul>
              </div>
              <div>
                <button @click="promotion.params.qualifyingCriteria.push(newCriterion())"
                  class="btn btn-default">
                  <span class="glyphicon glyphicon-plus"></span>
                  Add criterion
                </button>
              </div>
            </td>
            <td>
              <PromotionDiscountEditor
                :promotionType="promotion.type"
                v-model="promotion.params.discountFunction">
              </PromotionDiscountEditor>
            </td>
          </tr>
        </tbody></table>
        <button :disabled="checkResults" @click="save()" class="btn btn-primary">Save</button>
        <button @click="cancel()" class="btn btn-default">Cancel</button>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
table.discount-params > tbody > tr > td {
  padding: 1em;
  vertical-align: top;
}
table.criteria-list > tbody > tr > td {
  vertical-align: middle;
}
</style>
<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import * as resources from '../stores/resources'
import _ from 'lodash'
const filters = require('../filters')

export default {
  props: ['id', 'companyId'],
  data () {
    return {
      promotion: null,
      originalPromotion: null,
    }
  },
  created () {

  },
  components: {
    PromotionCriterionEditor: require('../components/PromotionCriterionEditor.vue').default,
    PromotionDiscountEditor: require('../components/PromotionDiscountEditor.vue').default,
  },
  computed: {
    ...mapGetters(['axios']),
    f: () => filters,

    promotionPromise() {
      console.log("Promise: ", this.id)
      if (!this.id) return

      return this.axios.get(`/companies/${this.companyId}/promotions/${this.id}`)
        .then((response) => {
          return this.makeEditable(response.data)
        })
    },

    companyQualifyingCriterion () {
      return {
        type: 'limitByCompany',
        params: {companyId: this.companyId}
      }
    },

    checkResults () {
      if (!this.promotion) return

      let results = []

      results.push(() => {
        /* If there is a limitByMinTicketCount, it must be at the end */
        const invalid = _.filter(this.promotion.params.qualifyingCriteria, (v, index) => {
          return index !== this.promotion.params.qualifyingCriteria.length - 1 &&
            v.type === 'limitByMinTicketCount'
        })

        if (invalid.length) {
          return {
            message: `If you are using limitByMinTicketCount it must be placed
              at the end of the list`
          }
        }
      })

      results.push(() => {
        /* If there is a limitByMinTicketCount, userLimit must be disabled */
        const invalid = this.promotion.params.qualifyingCriteria.find(v => v.type === 'limitByMinTicketCount')

        if (invalid && _.get(this.promotion.params, 'usageLimit.userLimit') !== null) {
          return {
            message: `limitByMinTicketCount cannot be used with userLimit`
          }
        }
      })

      results = results.map(f => f()).filter(x => x)
      results = results.length ? results : null

      return results
    }
  },
  watch: {
    promotionPromise: {
      immediate: true,
      handler(p) {
        if (!p) return
        p
        .then((q) => {
          this.promotion = q
          // deep clone the promotion object for cancel purpose
          this.originalPromotion = _.cloneDeep(q)
        })
        .catch((err) => {
          console.log(err)
          this.promotion = false
        })
      }
    }
  },
  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal']),
    preSaveTransform (e) {
      const myParams = _.omit(e.params, ['companyId'])

      return {
        code: e.code.toUpperCase(),
        params: {
          ...myParams,
          qualifyingCriteria: myParams.qualifyingCriteria
            .concat([this.companyQualifyingCriterion])
            .map(i => _.omit(i, 'id')),
        },
        description: e.description,
        type: e.type,
      }
    },

    save () {
      this.spinOnPromise(this.axios.put(
        `/companies/${this.companyId}/promotions/${this.id}`,
        this.preSaveTransform(this.promotion)
      )
      .then((response) => {
        this.promotion = this.makeEditable(response.data)
      }))
      .then(() =>
        this.showModal({
          component: 'CommonModals',
          props: {
            type: 'flash',
            message: 'Promotion saved'
          }
        })
      )
      .catch(err => {
        this.showModal({
          component: 'CommonModals',
          props: {
            type: 'alert',
            title: 'Error',
            message: _.get(err, 'message')
          }
        })
      })
    },

    cancel () {
      // assign back the original promotion
      this.promotion = _.cloneDeep(this.originalPromotion)
    },

    newCriterion () {
      return {
        id: Date.now(),
        type: null,
        params: null,
      }
    },

    makeEditable (promo) {
      /* We need to add limitByCompany for all promotions
      created by a company */
      const filterCompanyCriteria = (qc) => {
        return qc.filter(c =>
            !(c.type === this.companyQualifyingCriterion.type &&
            c.params.companyId == this.companyQualifyingCriterion.params.companyId))
      }

      return _.cloneDeep({
        type: 'Promotion',
        code: 'HELLOW',
        description: 'Hello world!',
        ...promo,
        params: {
          tag: '',
          ...promo.params,
          refundFunction: _.defaults(promo.params.refundFunction, { type: 'refundDiscountedAmt', params: {} }),
          qualifyingCriteria: filterCompanyCriteria(promo.params.qualifyingCriteria)
            .map((i, j) => ({...i, id: j})),
          discountFunction: promo.params.discountFunction || {type: 'simpleRate', params: {rate: 0}},
          usageLimit: promo.params.usageLimit || { userLimit: null, globalLimit: null },
        },
      })
    }
  }
}
</script>
