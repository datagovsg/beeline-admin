<template>
  <Select2
    :options="selectOptions"
    :value="editValue"
    :text="searchQuery"
    @input="updateValue"
    @text_input="updateSearch"
    >
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
const filters = require('../filters')

export default {
  props: ['value', 'includeEphemeral'],

  data() {
    return {
      searchQuery: '',
      editValue: null,
      matchingResults: null,
    }
  },

  watch: {
    value: {
      immediate: true,
      handler (v) {
        if (v === null || v === undefined) {
          this.editValue = null
        } else {
          const match = this.matchingResults.find(u => u.id === this.value)
          this.editValue = match || defaultValue(v)
          this.searchQuery = `(${this.editValue.id}) ${this.editValue.name} ` +
            `${this.editValue.telephone} ${this.editValue.email}`
        }
      }
    }
  },

  computed: {
    ...mapState('shared', ['currentRoutes']),
    ...mapGetters(['axios']),

    selectOptions () {
      return this.matchingResults ||
        [this.value ? defaultValue(this.value) : null]
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

    fetchMatchingResults: _.debounce(function (query) {
      const promise = this.$lastPromise = this.axios.get(`/users/search?` + querystring.stringify({
        q: query,
        includeEphemeral: this.includeEphemeral ? 'true' : 'false',
      }))
      .then((response) => {
        if (this.$lastPromise === promise) {
          this.matchingResults = response.data

          if (this.value !== null && this.value !== undefined) {
            this.editValue = this.matchingResults.find(u => u.id === this.value)
          }
        }
      })
    }, 300)
  }
}

function defaultValue (uid) {
  return {
    id: uid,
    name: 'Loading...',
    description: '',
    telephone: '',
  }
}
</script>
