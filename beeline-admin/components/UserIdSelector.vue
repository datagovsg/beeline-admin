<template>
  <Select2
    :options="selectOptions"
    :value="editValue"
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

  data() {
    return {
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
          const match = this.matchingResults && this.matchingResults.find(u => u.id === this.value)

          if (!match) {
            // Trigger a search for this user's data
            this.fetchMatchingResults(`${this.value}`)
          }

          this.editValue = match || defaultValue(v)
        }
      }
    },
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

    fetchMatchingResults: debounce(function (query) {
      /* The API does not support search if the query string is too short */
      if (query.length < 3) return

      const promise = this.$lastPromise = this.axios.get(`/users/search?` + querystring.stringify({
        q: query,
        includeEphemeral: this.includeEphemeral ? 'true' : 'false',
      }))
      .then((response) => {
        if (this.$lastPromise === promise) {
          this.matchingResults = response.data

          if (this.value !== null && this.value !== undefined) {
            this.editValue = this.matchingResults.find(u => u.id === this.value)
              || this.editValue /* if there was a previous match */
              || defaultValue(this.value)
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
