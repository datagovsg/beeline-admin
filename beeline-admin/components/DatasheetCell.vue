<!--
DatasheetCell
=============

A meta-component for displaying editable pieces of information. Use this
when your input field is expensive to render.

For example, if you have a table of 100x100 lat-lngs, and you need to allow
the user to edit each of them, using a GoogleMaps component with 500 markers
each, the traditional way would require you to create 100x100x500 markers,
which would crash any system.

Instead, use this component to only spin up the editor component when the
cell is clicked / in focus.

-->
<template>
  <div @click="showComponent"
    ref="cell"
    class="datasheet-cell" tabindex="1">

    <a href="#" @focus="showComponent" class="mock-focusable"
        @click.prevent="1 == 0"
        :tabindex="isEditing ? -1 : 0">
      <slot>
        {{ value }}
      </slot>
    </a>

    <template v-if="isEditing">
      <slot name="editor">
        <input
          :value="value"
          @input="$emit('input', $event.target.value)"
          class="the-editor"
          />
      </slot>
    </template>
  </div>
</template>
<style lang="scss">
.mock-focusable {
  text-decoration: none;
  color: #000;
}
.datasheet-cell {
  position: relative;
}
.the-editor {
  position: absolute;
  top: 0;
  min-height: 100%;
  left: 0;
  width: 100%;
}
</style>
<script>
import _ from 'lodash'
export default {
  props: {
    value: {},
  },
  data () {
    return {
      edit: false,
      isEditing: false,
      editorStyle: null
    }
  },
  watch: {
    value: {
      immediate: true,
      handler (v) {
        this.edit = v
      }
    }
  },
  methods: {
    showComponent (field, value) {
      this.isEditing = true
      this.$nextTick(() => {
        const child = _.get(this.$children, '0.$el').querySelector('input, select, a[href], textarea')
        child.focus()
        child.select()
        child.addEventListener('blur', () => {
          this.$nextTick(() => this.commit())
        })
      })
    },
    commit (v) {
      this.isEditing = false
    }
  }
}
</script>
