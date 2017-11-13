<template>
  <div class="form-control tags-editor">
    <TagsView :tags="value">
      <template scope="props">
        <i class="glyphicon glyphicon-remove" @click="removeTag(props.tag)"></i>
      </template>
    </TagsView>
    <input type="text" class="no-border" v-model="currentTag"
      @keydown="makeTag($event)" :placeholder="placeholder" />
  </div>
</template>

<script>
import dateformat from 'dateformat'

export default {
  props: {
    value: {
      type: Array
    },
    placeholder: {
      type: String
    }
  },
  data () {
    return {
      currentTag: ''
    }
  },
  components: {
    TagsView: require('./TagsView.vue').default,
  },
  methods: {
    removeTag (tag) {
      this.$emit('input', (this.value || []).filter(t => t !== tag))
    },
    makeTag ($event) {
      if ($event.keyCode === 13) {
        this.$emit('input', (this.value || []).concat([this.currentTag]))
        this.currentTag = ''
      } else if (this.currentTag === '' && $event.keyCode === 8) {
        this.$emit('input', this.value && this.value.slice(0, this.value.length - 1))
      }
    },
  }
}
</script>
<style>
.no-border {
  border: none;
  box-shadow: none;
}
.tags-editor .tags {
  display: inline;
}
</style>
