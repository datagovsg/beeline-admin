<template>
  <Dropdown :showDropdown="dropdownShown" class="select2">
    <a href="#" @click.prevent slot="dropdown-input"
        class="select2-dropdown-display form-control"
        style="height: auto"
        @focus="showDropdown">
      <slot name="display-template" :entry="value">
        {{value}}
      </slot>
    </a>

    <div v-if="dropdownShown"
        class="select2-dropdown-dropdown"
        slot="dropdown-dropdown">

      <input type="text" slot="dropdown-input"
          class="select2-dropdown-input"
        v-model="editText"
        @keydown.delete="handleDelete"
        @keydown.down="navigateTo(selectedIndex + 1)"
        @keydown.up="navigateTo(selectedIndex - 1)"
        @keydown.down.alt="showDropdown"
        @keydown.up.alt="showDropdown"
        @keydown.esc="dropdownShown = false"
        @keydown.enter="useSelected"
        @input="showDropdown(); $emit('text-input', $event.target.value)"
        @change="$emit('text-change', $event.target.value)"
        ref="input"
        :placeholder="placeholder"
        />

      <div ref="optionElementsContainer" class="select2-dropdown-scroll-pane">
        <div v-for="(entry, index) in options"
            :key="index"
            :class="{active: index === selectedIndex}"
            class="select2-dropdown-option"
            @click="navigateTo(index); useSelected();"
            ref="optionElements">
          <slot name="option-template" :entry="entry">
            {{entry}}
          </slot>
        </div>
      </div>
    </div>

    <button slot="dropdown-button" class="select2-dropdown-button dropdown-button"
        @click="showDropdown" type="button">
      <i class="glyphicon glyphicon-chevron-down" />
    </button>
  </Dropdown>
</template>

<style lang="scss">
.select2 {
  position: relative;

  .dropdown-group {
    display: flex;
    flex-direction: row;

    .select2-dropdown-display {
      flex: 1 1 auto;
      width: auto; /* override width: 100% of form-control */
      overflow: hidden;
    }
    .select2-dropdown-button {
      flex: 0 0 auto;
    }
  }

  .select2-dropdown-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    border: solid 1px #CCC;
    box-shadow: 0.2em 0.2em 0.4em rgba(0, 0, 0, 0.5);
    z-index: 1;
    background-color: white;

    .select2-dropdown-input {
      width: 100%;
      display: block;
    }

    .select2-dropdown-scroll-pane {
      max-height: 300px;
      overflow-y: scroll;
      position: relative;

      & .select2-dropdown-option {
        padding: 0.5em;
        margin: 0;
      }
      & .select2-dropdown-option.active {
        background-color: #DEF;
      }
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
import Dropdown from '@/components/Dropdown.vue'

export default {
  props: ['text', 'options', 'value', 'placeholder', 'persistAfterSelect'],

  data () {
    return {
      dropdownShown: false,
      selectedIndex: -1,
      editText: null
    }
  },

  components: { Dropdown },

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
    }
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

        // el may be unavailable if there are zero elements
        if (!el) return

        if (el.offsetTop + el.offsetHeight >=
            container.scrollTop + container.clientHeight) {
          container.scrollTop = el.offsetTop
        } else if (el.offsetTop < container.scrollTop) {
          container.scrollTop = el.offsetTop + el.offsetHeight - container.srollHeight
        }
      }
    },
    useSelected () {
      if (this.selectedIndex >= 0 && this.selectedIndex < this.options.length) {
        this.$emit('input', this.options[this.selectedIndex])

        if (!this.persistAfterSelect) {
          this.dropdownShown = false
        }
        this.editText = ''
      }
    },
    showDropdown () {
      this.dropdownShown = true
      this.$nextTick(() => {
        this.$refs.input.focus()
        /* Math.max --
          - if we have a value, and it's in the list, then stick with it
          - else (indexOf == -1), use the first available value
        */
        this.selectedIndex = Math.max(0, this.options.indexOf(this.value))
        this.ensureVisible()
      })
    },

    handleDelete () {
      if (this.editText === '') {
        this.$emit('input', null)
      }
    }
  }
}
</script>
