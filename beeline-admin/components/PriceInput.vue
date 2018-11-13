<template>
  <input type="number" :step="step"
    :value="value"
    :disabled="disabled"
    @change="$emit('input', $event.target.value ? parseFloat($event.target.value) : null)"
    />
</template>
<script>
export default {
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    value: {},
    step: {
      type: String,
      default: '0.01'
    }
  }
}
</script>
