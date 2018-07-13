<template>
  <component :is="wrapperTag">
    <component :is="itemTag" @click="triggerDropdown" ref="item">
      <slot/>
    </component>
    <component :is="menuTag" v-show="showDropdown" :style="dropdownStyles"
        :class="menuClass || {}">
      <slot name="menu" />
    </component>
  </component>
</template>

<script>
import { mapMutations, mapState } from 'vuex';

export default {
  props: ['wrapperTag', 'menuTag', 'itemTag', 'menuClass'],

  data () {
    return {
      dropdownStyles: {
        top: 0,
        left: 0,
        position: 'absolute',
        display: 'block',
      },
      dropdown: false,
    }
  },

  computed: {
    ...mapState('dropdown', ['activeDropdown']),
    showDropdown () {
      return this.activeDropdown === this
    }
  },

  methods: {
    ...mapMutations('dropdown', ['setDropdown']),

    triggerDropdown () {
      this.$nextTick(() => {
        this.setDropdown(this)
        this.dropdownStyles = {
          top: (this.$refs.item.offsetTop + this.$refs.item.offsetHeight - 2) + 'px',
          left: (this.$refs.item.offsetLeft) + 'px',
          position: 'absolute',
        }
      })
    }
  }
}
</script>