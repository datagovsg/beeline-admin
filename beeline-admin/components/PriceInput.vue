<template>
  <input type="number" :step="step"
    :value="value"
    @change="$emit('input', $event.target.value ? parseFloat($event.target.value) : null)"
    />
</template>
<script>
export default {
  props: {
    value: {},
    step: {
      type: String,
      default: '0.01'
    }
  },
}
</script>
