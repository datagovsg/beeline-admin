<template>
  <div class="form-control tags-editor">
    <TagsView :tags="value">
      <template scope="props">
        <i class="glyphicon glyphicon-remove" @click="removeTag(props.tag)"></i>
      </template>
    </TagsView>
    <input type="text" class="no-border"
      v-model="currentNumber"
      @keydown="makeTag($event)" :placeholder="placeholder" />
  </div>
</template>

<script>
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
      currentNumber: ''
    }
  },
  components: {
    TagsView: require('./TagsView.vue'),
  },
  methods: {
    removeTag (tag) {
      this.$emit('input', (this.value || []).filter(t => t !== tag))
    },
    makeTag ($event) {
      if ($event.keyCode === 13) {
        const parsed = parseInt(this.currentNumber)
        if (isFinite(parsed)) {
          this.$emit('input', (this.value || []).concat(parsed))
          this.currentNumber = ''
        }
      } else if (this.currentNumber === '' && $event.keyCode === 8) {
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
