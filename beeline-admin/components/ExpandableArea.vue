<template>
  <div class="expandable">
    <div class="expandable-area" :class="{expanded: expanded}">
      <slot></slot>
    </div>
    <div class="expand-button" @click="expanded = !expanded">
      <span v-if="!expanded">
       Show &raquo;
      </span>
      <span v-if="expanded">
       Hide &laquo;
      </span>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {expanded: false}
  }
}
</script>
