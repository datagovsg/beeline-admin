
<template>
  <ul class="pagination">
   <li v-if="boundaryLinks" @click="goTo(0)" aria-label="Jump to First">
     <span aria-hidden="true">&laquo;</span>
   </li>
   <li @click="goTo(value - 1)" aria-label="Previous">
     <span aria-hidden="true">&lsaquo;</span>
   </li>

   <li v-for="page in pages" @click="goTo(page)"
     v-if="isNearCurrentPage(page) || displayAllPages"
     :class="{active: page === value}">
     <a>{{page + 1}}</a>
   </li>
   <li v-else-if="isAlmostNearCurrentPage(page)">
     <a>...</a>
   </li>

   <li @click="goTo(value + 1)" aria-label="Next">
     <span aria-hidden="true">&rsaquo;</span>
   </li>
   <li v-if="boundaryLinks" @click="goTo(totalPages - 1)" aria-label="Jump to Last">
     <span aria-hidden="true">&raquo;</span>
   </li>
 </ul>
</template>

<script>
import _ from 'lodash'

const VISIBLE_PAGE_COUNT = 10 // 5 pages on either side of current page

export default {
  props: [
    'boundaryLinks', 'displayAllPages', 'totalItems', 'itemsPerPage', 'value'
  ],
  computed: {
    totalPages () {
      return Math.max(
        1,
        Math.floor(((this.totalItems || 0) + ((this.itemsPerPage || 30) - 1)) / (this.itemsPerPage || 30)))
    },
    pages () {
      return _.range(0, this.totalPages)
    }
  },
  methods: {
    goTo (page) {
      this.$emit('input', page)
    },
    isNearCurrentPage (page) {
      return Math.abs(page - this.value) <= (VISIBLE_PAGE_COUNT / 2)
    },
    isAlmostNearCurrentPage (page) {
      return Math.abs(page - this.value) === (VISIBLE_PAGE_COUNT / 2) + 1
    }
  }
}
</script>
