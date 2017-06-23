<template>
  <div>
    <LoadingSpinner ref="loadingSpinner"/>
    <ModalHelper ref="modalHelper"/>

    <div class="col-lg-12">
      <h1>Edit Promotion '{{promotion && promotion.code}}'</h1>

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

              <div class="form-group">
                <label>
                  <input type="radio" value="Promotion" v-model="promotion.type" />
                  Promotions on Tickets
                </label>
                <label>
                  <input type="radio" value="RoutePass" v-model="promotion.type" />
                  Promotions on Route Passes
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
                    v-model.number="promotion.params.usageLimit.userLimit" />
                </label>
              </div>

              <div class="form-group">
                <label>
                  Max redemptions by all users:
                  <input type="number" class="form-control"
                    v-model.number="promotion.params.usageLimit.globalLimit" />
                </label>
              </div>

              <div>
                <b>Note:</b> '0' to disable the promotion, blank to have no limit
              </div>
            </td>
          </tr>
        </table>

        <table class="table table-striped discount-params">
          <tr>
            <th style="width: 50%">
              Apply promo code if...
            </th>
            <th style="width: 50%">
              Give the user...
            </th>
          </tr>
          <tr>
            <td>
              <div v-for="(criterion, index) in promotion.params.qualifyingCriteria"
                  :key="index">
                <PromotionCriterionEditor :value="criterion"
                  :promotionType="promotion.type"
                  :companyId="companyId"
                  @input="promotion.params.qualifyingCriteria.splice(index, 1, $event)" />

                <button @click="promotion.params.qualifyingCriteria.splice(index, 1)"
                  class="btn btn-danger">
                  <span class="glyphicon glyphicon-trash"></span>
                </button>
              </div>
              <div>
                <button @click="promotion.params.qualifyingCriteria.push(newPromotion())"
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
        </table>
        <button @click="save()" class="btn btn-primary">Save</button>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
table.discount-params {
  td {
    vertical-align: top;
  }
}
</style>
<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import * as resources from '../shared/resources'
import _ from 'lodash'
const filters = require('../filters')

export default {
  props: ['id', 'companyId'],
  data () {
    return {promotion: null,}
  },
  created () {

  },
  components: {
    PromotionCriterionEditor: require('../components/PromotionCriterionEditor.vue'),
    PromotionDiscountEditor: require('../components/PromotionDiscountEditor.vue'),
  },
  computed: {
    ...mapGetters(['axios']),
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
    }
  },
  watch: {
    promotionPromise: {
      immediate: true,
      handler(p) {
        if (!p) return
        p
        .then((q) => this.promotion = q)
        .catch((err) => {
          console.log(err)
          this.promotion = false
        })
      }
    }
  },
  methods: {
    preSaveTransform (e) {
      const myParams = _.omit(e.params, ['companyId'])

      return {
        code: e.code.toUpperCase(),
        params: {
          ...myParams,
          qualifyingCriteria: myParams.qualifyingCriteria.concat([this.companyQualifyingCriterion])
        },
        description: e.description,
        type: e.type,
      }
    },

    save () {
      this.$refs.loadingSpinner.watch(this.axios.put(
        `/companies/${this.companyId}/promotions/${this.id}`,
        this.preSaveTransform(this.promotion)
      )
      .then((response) => {
        this.promotion = this.makeEditable(response.data)
      })
      .then(() =>
        this.$refs.modalHelper.show(
          'CommonModals',
          {
            type: 'flash',
            message: 'Promotion saved'
          }
        )
      )
      .catch(err => {
        this.$refs.modalHelper.show(
          'CommonModals',
          {
            type: 'alert',
            title: 'Error',
            message: _.get(err, 'message')
          }
        )
      }))
    },

    newPromotion () {
      return {
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
          ...promo.params,
          refundFunction: _.defaults(promo.params.refundFunction, { type: 'refundDiscountedAmt', params: {} }),
          qualifyingCriteria: filterCompanyCriteria(promo.params.qualifyingCriteria),
          discountFunction: promo.params.discountFunction || {type: 'simpleRate', params: {rate: 0}},
          usageLimit: promo.params.usageLimit || { userLimit: null, globalLimit: null },
        },
      })
    }
  }
}
</script>
