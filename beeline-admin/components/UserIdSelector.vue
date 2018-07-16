<template>
  <Select2
    :options="selectOptions"
    :value="displayValue"
    @input="updateValue"
    @text-input="updateSearch"
    >
    <template scope="s" slot="display-template">
      <template v-if="s.entry">
        ({{s.entry.id}})
        {{s.entry.name}}
        {{s.entry.telephone}}
        {{s.entry.email}}
      </template>
    </template>
    <template scope="s" slot="option-template">
      <template v-if="s.entry">
        ({{s.entry.id}})
        {{s.entry.name}}
        {{s.entry.telephone}}
        {{s.entry.email}}
      </template>
    </template>
  </Select2>
</template>

<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import {debounce} from 'lodash'
import querystring from 'querystring'

import Select2 from '@/components/Select2.vue'

const filters = require('../filters')

export default {
  props: ['value', 'includeEphemeral'],

  components: {
    Select2
  },

  data () {
    return {
      matchingResults: null,
      fetchedValue: null
    }
  },

  watch: {
    matchedValue: {
      immediate: true,
      handler (m) {
        /* if there's a value, but no match, fetch the user only */
        if (!m && this.value) {
          const promise = this.$fetchPromise = this.axios.get(`/user/${this.value}`)
            .then((response) => {
              if (promise === this.$fetchPromise) {
                this.fetchedValue = response.data
              }
            })
        }
      }
    }
  },

  computed: {
    ...mapState('shared', ['currentRoutes']),
    ...mapGetters(['axios']),

    selectOptions () {
      return this.matchingResults ||
        [this.value ? blankValue(this.value) : null]
    },

    matchedValue () {
      return this.matchingResults && this.matchingResults.find(u => u.id === this.value)
    },

    displayValue () {
      if (!this.value) {
        return null
      } else {
        return this.matchedValue ||
          (this.fetchedValue && this.fetchedValue.id === this.value
            ? this.fetchedValue
            : blankValue(this.value))
      }
    }
  },

  methods: {
    updateValue (v) {
      this.$emit('input', v && v.id)
    },

    updateSearch (query) {
      this.searchQuery = query
      this.fetchMatchingResults(query)
    },

    fetchMatchingResults: debounce(function (query) {
      /* The API does not support search if the query string is too short */
      if (query.length < 3) return

      const promise = this.$lastPromise = this.axios.get(`/users/search?` + querystring.stringify({
        q: query,
        includeEphemeral: this.includeEphemeral ? 'true' : 'false'
      }))
        .then((response) => {
          if (this.$lastPromise === promise) {
            this.matchingResults = response.data
          }
        })
    }, 300)
  }
}

function formatUser (u) {
  return `(${u.id}) ${u.name} ${u.telephone} ${u.email}`
}

function blankValue (uid) {
  return {
    id: uid,
    name: 'Loading...',
    description: '',
    telephone: ''
  }
}

</script>
