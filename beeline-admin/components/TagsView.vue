<script>
export default { props: ['tags'] }
</script>
<template>
  <ul class="tags">
    <li v-for="(tag, index) in tags" :ref="index">{{tag}}</li>
  </ul>
</template>
