<template>
  <div>
    <label>
      Type
      <select class="form-control" :value="value.type"
          @input="updateType($event.target.value)">
        <option v-for="t in criterionTypes" :value="t.type">
          {{f.titleCase(t.type)}}
        </option>
      </select>
    </label>

    <div v-if="value.type === 'limitByCompany'">
      <label>
        Company
        <CompanySelector class="form-control"
          :value="paramCache.limitByCompany.companyId"
          @input="updateParam('companyId', $event)"
          />
      </label>
    </div>

    <div v-if="value.type === 'limitByContactList'">
      <label>
        Contact List
        <ContactListSelector class="form-control"
          :companyId="companyId"
          :value="paramCache.limitByContactList.contactListId"
          @input="updateParam('contactListId', $event)"
          />
      </label>
    </div>

    <div v-if="value.type === 'limitByRoute'">
      <label>
        Routes
        <RouteSelector :multiple="true" class="form-control"
          :companyId="companyId"
          :value="paramCache.limitByRoute.routeIds"
          @input="updateParam('routeIds', $event)"
          />
      </label>
    </div>

    <div v-if="value.type === 'limitByRouteTags'">
      <label>
        Tags
        <TagsEditor
          :value="paramCache.limitByRouteTags.tags"
          @input="updateParam('tags', $event)"
          />
      </label>
    </div>

    <div v-if="value.type === 'limitByTripDate'">
      <label>
        Start date (inclusive):
      </label>
      <DatePickerDropdown
        :offset="0"
        :value="paramCache.limitByTripDate.startDate && new Date(paramCache.limitByTripDate.startDate)"
        @input="updateParam('startDate', $event && f.dateformat($event, 'yyyy-mm-dd', true))"
        />
      <label>
        End date (inclusive):
      </label>
      <DatePickerDropdown
        :offset="0"
        :value="paramCache.limitByTripDate.endDate && new Date(paramCache.limitByTripDate.endDate)"
        @input="updateParam('endDate', $event && f.dateformat($event, 'yyyy-mm-dd', true))"
        />
    </div>

    <div v-if="value.type === 'limitByPurchaseDate'">
      <label>
        Start date (inclusive):
      </label>
      <DatePickerDropdown
        :offset="0"
        :value="paramCache.limitByPurchaseDate.startDate && new Date(paramCache.limitByPurchaseDate.startDate)"
        @input="updateParam('startDate', $event && f.dateformat($event, 'yyyy-mm-dd', true))"
        />
      <label>
        End date (inclusive):
      </label>
      <DatePickerDropdown
        :offset="0"
        :value="paramCache.limitByPurchaseDate.endDate && new Date(paramCache.limitByPurchaseDate.endDate)"
        @input="updateParam('endDate', $event && f.dateformat($event, 'yyyy-mm-dd', true))"
        />
    </div>

    <div v-if="value.type === 'limitByMinTicketCount'">
      <label>
        Min. number of tickets
      </label>
      <input
        class="form-control"
        type="number"
        step="1"
        :value="paramCache.limitByMinTicketCount.n"
        @change="updateParam('n', $event.target.value && parseInt($event.target.value))"
        />
    </div>

    <div v-if="value.type === 'limitByTripDayOfWeek'">
      Days of week promo is valid for:
      <label>
        <input type="checkbox" :checked="paramCache.limitByTripDayOfWeek[0]"
          @change="updateParam(0, $event.target.checked)" />
        Sunday
      </label>
      <label>
        <input type="checkbox" :checked="paramCache.limitByTripDayOfWeek[1]"
          @change="updateParam(1, $event.target.checked)" />
        Monday
      </label>
      <label>
        <input type="checkbox" :checked="paramCache.limitByTripDayOfWeek[2]"
          @change="updateParam(2, $event.target.checked)" />
        Tuesday
      </label>
      <label>
        <input type="checkbox" :checked="paramCache.limitByTripDayOfWeek[3]"
          @change="updateParam(3, $event.target.checked)" />
        Wednesday
      </label>
      <label>
        <input type="checkbox" :checked="paramCache.limitByTripDayOfWeek[4]"
          @change="updateParam(4, $event.target.checked)" />
        Thursday
      </label>
      <label>
        <input type="checkbox" :checked="paramCache.limitByTripDayOfWeek[5]"
          @change="updateParam(5, $event.target.checked)" />
        Friday
      </label>
      <label>
        <input type="checkbox" :checked="paramCache.limitByTripDayOfWeek[6]"
          @change="updateParam(6, $event.target.checked)" />
        Saturday
      </label>
    </div>

    <hr/>
  </div>
</template>
<script>
const _ = require('lodash')
const titleCase = require('title-case')
const leftPad = require('left-pad')
import dateformat from 'dateformat'
import {mapGetters, mapActions, mapState} from 'vuex'

import TagsEditor from '@/components/TagsEditor.vue'
import DatePickerDropdown from '@/components/DatePickerDropdown.vue'
import RouteSelector from '@/components/RouteSelector.vue'
import ContactListSelector from '@/components/ContactListSelector.vue'
import CompanySelector from '@/components/CompanySelector.vue'

const criterionTypes = _.sortBy([
  {
    type: 'limitByCompany',
    default: {companyId: null},
    restrict: ['Promotion', 'RoutePass']
  },
  {
    type: 'limitByContactList',
    default: {contactListId: null}
  },
  {
    type: 'limitByMinTicketCount',
    default: {n: 5},
    restrict: ['Promotion']
  },
  {
    type: 'limitByPurchaseDate',
    default: {startDate: null, endDate: null}
  },
  {
    type: 'limitByRoute',
    default: {routeIds: []},
    restrict: ['Promotion']
  },
  {
    type: 'limitByRouteTags',
    default: {tags: []},
    restrict: ['Promotion']
  },
  {
    type: 'limitByTripDayOfWeek',
    default: {0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false},
    restrict: ['Promotion']
  },
  {
    type: 'limitByTripDate',
    default: {startDate: null, endDate: null},
    restrict: ['Promotion']
  }
], 'type')

export default {
  props: ['value', 'companyId', 'promotionType'],
  data () {
    return {
      paramCache: _(criterionTypes)
        .keyBy(x => x.type)
        .mapValues(x => (x.default || {}))
        .value(),
      disp: _(criterionTypes)
        .keyBy(x => x.type)
        .mapValues(x => ({}))
        .value()
    }
  },
  components: {
    TagsEditor,
    DatePickerDropdown,
    RouteSelector,
    CompanySelector,
    ContactListSelector
  },
  watch: {
    'value.params': {
      immediate: true,
      handler (p) {
        if (this.value && this.value.type) {
          this.paramCache[this.value.type] = p
        }
      }
    }
  },
  computed: {
    ...mapState('shared', ['companies', 'currentRoutes']),
    f () {
      return {
        titleCase, dateformat
      }
    },
    params () {
      return this.value.type && this.paramCache[this.type]
    },
    criterionTypes () {
      return criterionTypes.filter(t => !t.restrict || t.restrict.indexOf(this.promotionType) !== -1)
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
    }
  }
}
</script>
