<template>
  <Modal :name="name" @cancel="reject()" :value="value">
    <div class="modal-header">
      <h3>{{title}}</h3>
    </div>

    <div class="modal-body">
      {{message}}

      <div v-if="type === 'prompt'">
        <input type="text" v-model="dataValue" class="form-control"/>
      </div>
    </div>

    <!-- custom buttons -->
    <div class="modal-footer">
      <button type="button" class="btn btn-primary" @click="resolve(dataValue)">OK</button>
      <button type="button" class="btn btn-default" @click="resolve(false)"
        v-if="type === 'confirm'">Cancel</button>
      <button type="button" class="btn btn-default" @click="reject()"
        v-if="type === 'prompt'">Cancel</button>
    </div>
  </modal>
</template>

<script>
import Modal from '@/modals/MyModal.vue'
import ModalMixin from '@/modals/ModalMixin'

export default {
  props: [
    'type', 'title', 'message', 'defaultValue'
  ],
  components: { Modal },
  data () {
    return {
      dataValue: null
    }
  },
  watch: {
    type: {
      immediate: true,
      handler (v) {
        if (v === 'flash') {
          setTimeout(() => this.resolve(), 1000)
        }
      }
    }
  },
  created () {
    if (this.type === 'prompt') {
      this.dataValue = this.defaultValue
    } else if (this.type === 'confirm') {
      this.dataValue = true
    }
  },
  mixins: [ModalMixin]
}
</script>
