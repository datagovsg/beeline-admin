<template>
  <img :src="src" />
</template>

<script>
export default {
  props: ['companyId'],

  computed: {
    src () {
      return `${process.env.BACKEND_URL}/companies/${this.companyId}/logo`
    }
  }
}
</script>