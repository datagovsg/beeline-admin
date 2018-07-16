<template>
  <input type="number" :step="step"
    :value="(value * 100)"
    @change="$emit('input', $event.target.value ? parseFloat($event.target.value) / 100 : null)"
    />
</template>
<script>
export default {
  props: {
    value: {},
    step: {
      type: String,
      default: '1'
    }
  }
}
</script>
