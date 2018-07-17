<template>
  <div class="dropdown">
    <div class="dropdown-group">
      <!-- the input box -->
      <slot name="dropdown-input">
        <input type="text" :value="value" v-on="$listeners" />
      </slot>

      <slot name="dropdown-button">
        <span class="dropdown-button" slot="dropdown-button">
          <button type="button" @click="handleButtonClick">
            <span>▼</span>
          </button>
        </span>
      </slot>
    </div>

    <slot name="dropdown-dropdown">
      <div class="dropdown-dropdown" v-if="showDropdown">
        Sample dropdown
        <label>
          <input type="radio" @click="$emit('input', $event.target.value)" value="Apples">
          Apples
        </label>
        <label>
          <input type="radio" @click="$emit('input', $event.target.value)" value="Oranges">
          Oranges
        </label>
      </div>
    </slot>
  </div>
</template>

<style>
.dropdown {
  position: relative;
}
.dropdown .dropdown-dropdown.left-aligned {
  top: 100%;
  left: 0;
  min-width: 100%;
  position: absolute
}
.dropdown .dropdown-dropdown.right-aligned {
  top: 100%;
  right: 0;
  min-width: 100%;
  position: absolute
}
</style>

<script>
export default {
  props: ['showDropdown', 'value'],

  data () {
    return {
      state_showDropdown: false
    }
  },

  methods: {
    handleButtonClick () {
      if (this.showDropdown === undefined) {
        this.state_showDropdown = !this.state_showDropdown
      } else {
        this.$emit('toggle-dropdown')
      }
    }
  }
}
</script>
