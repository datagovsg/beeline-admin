<template><div>
  <label>
    Type
  </label>
  <select
    :value="value.type" @input="updateType($event.target.value)"
    class="form-control">
    <option disabled></option>
    <option v-for="type in discountTypes" :value="type.type">
      {{f.titleCase(type.type)}}
    </option>
  </select>
  <br/>
  
  <div v-if="value.type == 'simpleRate'">
    <div>
      Discount Rate (%):
    </div>
    <div class="input-group">
      <PercentInput
        placeholder="Discount rate (0 - 100)"
        :value="paramCache.simpleRate.rate"
        @input="updateParam('rate', $event)"
        class="form-control" />
      <span class="input-group-addon">%</span>
    </div>
  </div>

  <label v-if="value.type == 'simpleFixed'">
    Discount each ticket price by ($):
    <div class="input-group">
      <span class="input-group-addon">$</span>
      <PriceInput
        :value="paramCache.simpleFixed.fixed"
        @input="updateParam('fixed', $event)"
        class="form-control" />
    </div>
  </label>

  <label v-if="value.type == 'fixedTransactionPrice'">
    Charge the <strong>entire</strong> bundle of tickets at ($):
    <div class="input-group">
      <span class="input-group-addon">$</span>
      <PriceInput
        :value="paramCache.fixedTransactionPrice.price"
        @input="updateParam('price', $event)"
        class="form-control" />
    </div>
  </label>

  <label v-if="value.type == 'flatPrice'">
    Charge per ticket price at ($):
    <div class="input-group">
      <span class="input-group-addon">$</span>
      <PriceInput
        :value="paramCache.flatPrice.price"
        @input="updateParam('price', $event)"
        class="form-control" />
    </div>
  </label>

  <div v-if="value.type == 'tieredRateByQty'">
    <div>N.B. Tiers must be in increasing order</div>
    <div v-for="(tier, index) in paramCache.tieredRateByQty.schedule"
        class="form-inline">

      When user buys at least
      <input type="number" placeholder="Min tickets to qualify" step="1"
        :value="tier[0]"
        @change="updateTier(index, 0, parseInt($event.target.value))"
        class="form-control" />

      tickets,

      <br/>
      discount the price by ($)

      <PercentInput
        :value="tier[1]"
        placeholder="Discount rate (0 - 100)"
        @input="updateTier(index, 1, $event)"
        class="form-control" />

      <button @click="removeTier(index)"
          class="btn btn-danger">
        <span class="glyphicon glyphicon-trash"></span>
      </button>
      <hr/>
    </div>
    <button @click="addTier([null, null])" class="btn btn-default">
      <span class="glyphicon glyphicon-plus"></span>
      Add tier
    </button>
  </div>

  <div v-if="value.type == 'tieredFixedByTotalValue'">
    <div>N.B. Tiers must be in increasing order</div>
    <div v-for="(tier, index) in paramCache.tieredFixedByTotalValue.schedule"
        class="form-inline">

      When user buys
      <PriceInput type="number" placeholder="min value e.g. $100" step="0.01"
        :value="tier[0]"
        @input="updateTier(index, 0, parseInt($event))"
        class="form-control" />

      dollars worth of tickets or route passes,

      <br/>
      discount the total price by ($)

      <PriceInput
        :value="tier[1]"
        placeholder="Discount amount in $"
        @input="updateTier(index, 1, $event)"
        class="form-control" />
      
      <button @click="removeTier(index)"
          class="btn btn-danger">
        <span class="glyphicon glyphicon-trash"></span>
      </button>
      <hr/>
    </div>
    <button @click="addTier([null, null])" class="btn btn-default">
      <span class="glyphicon glyphicon-plus"></span>
      Add tier
    </button>
  </div>

  <div v-if="value.type == 'tieredRateByTotalValue'">
    <div>N.B. Tiers must be in increasing order</div>
    <div v-for="(tier, index) in paramCache.tieredRateByTotalValue.schedule"
        class="form-inline">

      When user buys
      <PriceInput type="number" placeholder="min value e.g. $100" step="0.01"
        :value="tier[0]"
        @input="updateTier(index, 0, parseInt($event))"
        class="form-control" />

      dollars worth of tickets or route passes,

      <br/>
      discount the total price by (%)
      <div class="input-group">
        <PercentInput
          :value="tier[1]"
          placeholder="Discount rate (0 - 100)"
          @input="updateTier(index, 1, $event)"
          class="form-control" />
          <span class="input-group-addon">%</span>
      </div>

      <button @click="removeTier(index)"
          class="btn btn-danger">
        <span class="glyphicon glyphicon-trash"></span>
      </button>
      <hr/>
    </div>
    <button @click="addTier([null, null])" class="btn btn-default">
      <span class="glyphicon glyphicon-plus"></span>
      Add tier
    </button>
  </div>
</div>
</template>

<script>
const _ = require('lodash');
const titleCase = require('title-case')
const leftPad = require('left-pad')
import dateformat from 'dateformat'
import {mapGetters, mapActions, mapState} from 'vuex'

const discountTypes = _.sortBy([
  {
    type: 'simpleRate',
    default: {rate: null},
    restrict: ['Promotion', 'RoutePass'],
  },
  {
    type: 'simpleFixed',
    default: {fixed: null},
    restrict: ['Promotion', 'RoutePass'],
  },
  {
    type: 'flatPrice',
    default: {price: null},
    restrict: ['Promotion', 'RoutePass'],
  },
  {
    type: 'tieredRateByQty',
    default: {schedule: []},
    restrict: ['Promotion', 'RoutePass'],
  },
  {
    type: 'tieredFixedByTotalValue',
    default: {schedule: []},
    restrict: ['Promotion', 'RoutePass'],
  },
  {
    type: 'tieredRateByTotalValue',
    default: {schedule: []},
    restrict: ['Promotion', 'RoutePass'],
  },
  {
    type: 'fixedTransactionPrice',
    default: {price: null},
    restrict: ['Promotion', 'RoutePass'],
  },
], 'type')

export default {
  props: ['value', 'companyId', 'promotionType'],
  data () {
    return {
      paramCache:  _(discountTypes)
        .keyBy(x => x.type)
        .mapValues(x => x.default)
        .value(),
    }
  },
  components: {
    PercentInput: require('./PercentInput.vue').default,
    PriceInput: require('./PriceInput.vue').default,
  },
  watch: {
    'value.params': {
      immediate: true,
      handler(p) {
        if (this.value && this.value.type) {
          this.paramCache[this.value.type] = p
        }
      }
    }
  },
  computed: {
    f () {
      return {
        titleCase, dateformat
      }
    },
    params () {
      return this.value.type && this.paramCache[this.type]
    },
    discountTypes () {
      return discountTypes.filter(r => !r.restrict || r.restrict.indexOf(this.promotionType) !== -1)
    }
  },
  methods: {
    updateParam (key, value) {
      console.log(key, value)
      this.$emit('input', {
        ...this.value,
        params: {
          ...this.value.params,
          [key]: value
        }
      })
    },
    updateType (type) {
      this.$emit('input', {
        type,
        params: this.paramCache[type]
      })
    },
    updateTier (tierIndex, key, type) {
      const newTiers = _.clone(this.value.params.schedule)
      newTiers[tierIndex] = _.clone(this.value.params.schedule[tierIndex])
      newTiers[tierIndex][key] = type

      this.$emit('input', {
        ...this.value,
        params: {
          ...this.value.params,
          schedule: newTiers
        }
      })
    },
    removeTier (tierIndex) {
      const newTiers = _.filter(this.value.params.schedule,
        (v, k) => k !== tierIndex)

      this.$emit('input', {
        ...this.value,
        params: {
          ...this.value.params,
          schedule: newTiers
        }
      })
    },
    addTier (v) {
      this.$emit('input', {
        ...this.value,
        params: {
          ...this.value.params,
          schedule: this.value.params.schedule.concat([v])
        }
      })
    },
  }
}
</script>
