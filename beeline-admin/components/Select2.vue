<template>
  <Dropdown :showDropdown="dropdownShown" class="select2">
    <input type="editText" slot="dropdown-input" class="dropdown-input"
      v-model="editText"
      @keydown.down="navigateTo(selectedIndex + 1)"
      @keydown.up="navigateTo(selectedIndex - 1)"
      @keydown.down.alt="showDropdown"
      @keydown.up.alt="showDropdown"
      @keydown.esc="dropdownShown = false"
      @keydown.enter="useSelected"
      @input="showDropdown(); $emit('text_input', $event.target.value)"
      @change="$emit('text_change', $event.target.value)"
      ref="input"
      />
    <div v-if="dropdownShown"
        ref="optionElementsContainer"
        class="select2-dropdown-dropdown"
        slot="dropdown-dropdown">
      <div v-for="(entry, index) in options"
          :class="{active: index === selectedIndex}"
          class="select2-dropdown-option"
          @click="navigateTo(index); useSelected();"
          ref="optionElements">
        <slot name="option-template" :entry="entry">
          {{entry.label}}
        </slot>
      </div>
    </div>
    <button slot="dropdown-button" class="select2-dropdown-button dropdown-button"
        @click="showDropdown">
      <i class="glyphicon glyphicon-chevron-down" />
    </button>
  </Dropdown>
</template>

<style lang="scss">
.select2 {
  position: relative;

  .select2-dropdown-dropdown {
    max-height: 300px;
    overflow-y: scroll;
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;

    border: solid 1px #CCC;
    box-shadow: 0.2em 0.2em 0.4em rgba(0, 0, 0, 0.5);

    & .select2-dropdown-option {
      padding: 0.5em;
      margin: 0;
    }
    & .select2-dropdown-option.active {
      background-color: #DEF;
    }
  }
  .dropdown-group {
    display: flex;
    flex-direction: row;

    .dropdown-input {
      flex: 1 1 auto;
    }
    .dropdown-button {
      flex: 0 0 auto;
    }
  }
}
</style>

<script>
export default {
  props: ['text', 'options', 'value'],

  data () {
    return {
      dropdownShown: false,
      selectedIndex: -1,
      editText: null,
    }
  },

  mounted () {
    this.$documentClickListener = (event) => {
      if (!this.$el.contains(event.target)) {
        this.dropdownShown = false
      }
    }
    document.addEventListener('click', this.$documentClickListener)
  },

  destroyed () {
    document.removeEventListener('click', this.$documentClickListener)
  },

  watch: {
    text: {
      immediate: true,
      handler (v) {
        this.editText = v
      }
    },
  },

  methods: {
    navigateTo (index) {
      if (this.dropdownShown) {
        this.selectedIndex = Math.min(
          this.options.length - 1,
          Math.max(
            0,
            index
          )
        )
        this.ensureVisible()
      }
    },
    ensureVisible () {
      if (!this.$refs.optionElements || !this.$refs.optionElementsContainer) {
        return
      } else {
        /* Ensure that we can see the selected element, else scroll to it */
        const el = this.$refs.optionElements[this.selectedIndex]
        const container = this.$refs.optionElementsContainer

        if (el.offsetTop + el.offsetHeight >=
            container.scrollTop + container.clientHeight) {
          container.scrollTop = el.offsetTop
        } else if (el.offsetTop < container.scrollTop){
          container.scrollTop = el.offsetTop + el.offsetHeight - container.srollHeight
        }
      }
    },
    useSelected () {
      if (this.selectedIndex !== -1) {
        this.$emit('input', this.options[this.selectedIndex])
        this.dropdownShown = false;
      }
    },
    showDropdown () {
      this.dropdownShown = true
      this.$nextTick(() => {
        this.selectedIndex = this.options.indexOf(this.value)
        this.ensureVisible()
      })
    }
  }
}
</script>
