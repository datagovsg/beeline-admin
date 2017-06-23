<script>
export default { props: ['tags'] }
</script>
<template>
  <ul class="tags">
    <li v-for="(tag, index) in tags" :ref="index">
      {{tag}}
      <slot :tag="tag"></slot>
    </li>
  </ul>
</template>
