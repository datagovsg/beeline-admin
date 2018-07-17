<template>
  <th @click="$emit('sort', {orderBy: field, order: nextOrder})"
      :class="{
        sortable: field,
        'sort-asc': orderBy === field && order === 'asc',
        'sort-desc': orderBy === field && order === 'desc',
      }">
    <slot />
  </th>
</template>

<script>
export default {
  props: ['order', 'orderBy', 'field'],
  watch: {
    field (f) {
      console.log(f)
    }
  },
  computed: {
    nextOrder () {
      return ((this.order === 'asc') ^ (this.orderBy === this.field)) ? 'asc' : 'desc'
    }
  }
}
</script>
