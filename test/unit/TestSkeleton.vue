<template>
  <div>
    <!-- mirrors App.vue -->
    <ModalHelper />
    <LoadingSpinner />

    <div class="row container-fluid withnav">
      <component :is="skelComponent"
        ref="testedComponent"
        v-on="$listeners"
        v-bind="$attrs"
        />
    </div>
  </div>
</template>
<script>
import _ from 'lodash'

import ModalHelper from '@/components/ModalHelper'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

export default {
  props: ['skelComponent'],
  components: {LoadingSpinner, ModalHelper}
}
</script>
