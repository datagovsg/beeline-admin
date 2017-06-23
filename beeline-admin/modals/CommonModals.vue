<template>
  <Modal :value="!!isShown" :title="title"
      @cancel="reject()">
    {{message}}

    <div v-if="type === 'prompt'">
      <input type="text" v-model="value" class="form-control"/>
    </div>

    <!-- custom buttons -->
    <div slot="modal-footer" class="modal-footer">
      <button type="button" class="btn btn-primary" @click="resolve(value)">OK</button>
      <button type="button" class="btn btn-default" @click="reject()"
        v-if="type !== 'alert'">Cancel</button>
    </div>
  </Modal>
</template>

<script>
import {mapState} from 'vuex'

export default {
  props: [
    'type', 'title', 'message', 'defaultValue'
  ],
  data () {
    return {
      value: null
    }
  },
  watch: {
    type: {
      immediate: true,
      handler(v) {
        if (v === 'flash') {
          setTimeout(() => this.resolve(), 1000)
        }
      }
    }
  },
  created() {
    this.value = this.defaultValue
  },
  mixins: [
    require('../modals/ModalMixin')
  ],
}
</script>
