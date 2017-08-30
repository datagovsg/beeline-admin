<template>
  <Select2
    :value="editValue"
    @input="updateValue"
    @text_input="updateSearch"
    :options="selectOptions"
    >
    <template scope="s" slot="display-template">
      <template v-if="s.entry">
        <div v-if="s.entry" class="route-tag-selector-option">
          <ul class="tags"><li>{{s.entry && s.entry.tag}}</li></ul>
          <div class="matching-routes">
            <span v-for="(route, index) in (s.entry && s.entry.routes && s.entry.routes.slice(0, 5))">
              {{index > 0 ? ', ' : ''}}{{route.label}}
            </span>
            <span v-if="(s.entry && s.entry.routes && s.entry.routes.length > 5)">
              ...
            </span>
          </div>
        </div>
      </template>
    </template>

    <template scope="s" slot="option-template">
      <div v-if="s.entry" class="route-tag-selector-option">
        <ul class="tags"><li>{{s.entry && s.entry.tag}}</li></ul>
        <ul class="matching-routes">
          <li  v-for="route in (s.entry && s.entry.routes && s.entry.routes.slice(0, 3))">
            {{route.label}} {{route.name}}
          </li>
          <li  v-if="s.entry && s.entry.routes && s.entry.routes.length > 3">
            ...
          </li>
          <li  v-if="!s.entry.routes">
            Loading...
          </li>
          <li  v-if="s.entry.routes && s.entry.routes.length === 0">
            No routes found
          </li>
        </ul>
      </div>
    </template>
  </Select2>
</template>
<style lang="scss">
.route-tag-selector-option {
  display: flex;
  & > .tags {
    flex: 0 0 auto;
  }
  & > .matching-routes {
    flex: 1 1 auto;
  }
  ul.matching-routes {
    padding: 0;
    margin: 0;
    li {
      display: block;
      list-style-type: none;
      padding: 0;
      margin: 0;
    }
  }
}
</style>
<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import {debounce} from 'lodash'
import querystring from 'querystring'
import _ from 'lodash'
const filters = require('../filters')

const SYSTEM_TAGS = _.fromPairs([
  'public', 'lite', 'mandai', 'crowdstart', 'lelong',
  'notify-when-empty', 'success', 'failed',
].map(t => [t, true]))

export default {
  props: ['value', 'includeRestricted', 'companyId'],

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
          const match = this.matchingResults && this.matchingResults.find(u => u.id === this.value)

          if (!match) {
            // Trigger a search for this user's data
            this.fetchMatchingResults(`${this.value}`)
          }

          this.editValue = match || defaultValue(v, !this.allRoutes)
        }
      }
    },
  },

  created () {
    this.fetch('allRoutes')
  },

  computed: {
    ...mapState('shared', ['allRoutes']),
    ...mapGetters(['axios']),

    selectOptions () {
      // Show exact matches first
      const match = this.matchingResults &&
        this.matchingResults.find(r => r.tag === this.searchQuery)

      // Always allow the current search query to become a tag
      return this.searchQuery
        ? [match || defaultValue(this.searchQuery)].concat(this.matchingResults.filter(r => r.tag !== this.searchQuery))
        : this.matchingResults

    }
  },

  methods: {
    ...mapActions('shared', ['fetch']),

    updateValue (v) {
      this.$emit('input', v && v.tag)
    },

    updateSearch (query) {
      this.searchQuery = query
      this.fetchMatchingResults(query)
    },

    fetchMatchingResults: debounce(function (query) {
      const tagsToRoutes = {}
      const ucaseQuery = query.toUpperCase()

      if (this.allRoutes) {
        /* filter by route name/label or tag. Put it in a forEach for efficiency */
        const routes = this.companyId
          ? this.allRoutes.filter(r => r.transportCompanyId === this.companyId)
          : this.allRoutes

        routes.forEach(route => {
          const routeMatchesQuery =
            (route.name || '').toUpperCase().indexOf(ucaseQuery) !== -1 ||
            (route.label || '').toUpperCase().indexOf(ucaseQuery) !== -1 ||
            route.id.toString() === ucaseQuery

          for (let tag of (route.tags || [])) {
            if (!this.includeRestricted && SYSTEM_TAGS[tag])
              continue

            const tagMatchesQuery = tag.toUpperCase().indexOf(ucaseQuery) !== -1

            if (tagMatchesQuery || routeMatchesQuery) {
              tagsToRoutes[tag] = tagsToRoutes[tag] || []
              if (tagsToRoutes[tag].length < 10) {
                tagsToRoutes[tag].push(route)
              }
            }
          }
        })
        this.matchingResults = Object.keys(tagsToRoutes)
          .map(tag => ({tag, routes: tagsToRoutes[tag]}))
          // .filter(r => r.tag.toLowerCase().indexOf(query.toLowerCase()) !== -1)
      } else {
        this.matchingResults = []
      }

      // Update the display
      this.editValue = (this.matchingResults &&
          this.matchingResults.find(r => r.tag === this.value))
        || this.editValue
        || defaultValue(v, !this.allRoutes)
    }, 300)
  }
}

function defaultValue (tag, isLoading) {
  return {
    tag,
    routes: isLoading ? null : []
  }
}

</script>
