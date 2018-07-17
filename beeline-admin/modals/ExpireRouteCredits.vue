<template>
<Modal @cancel="reject()" :name="name" :value="returnValue">
  <div class="modal-header">
    <h3>Expire Route Credits</h3>
  </div>

  <div class="modal-body">
    <div class="row">
      <label class="col-sm-3 control-label">Expire For: </label>
      <div class="col-sm-9">
        <p class="form-control-static">{{ tag }}</p>
      </div>
    </div>
    <div class="row">
      <label class="col-sm-3 control-label">User affected: </label>
      <div class="col-sm-9">
        <p class="form-control-static" v-if="user">
          {{ user.name || 'no name' }} - (tel: {{ user.telephone || '-' }};
          email: {{ user.email || '-' }})
        </p>
      </div>
    </div>
    <div class="row">
      <label class="col-sm-3 control-label">Quantity: </label>
      <div class="col-sm-4">
        <div class="input-group">
          <input type="number" step="1" name="quantity" class="form-control" v-model.number="data.quantity">
        </div>
      </div>
    </div>
  </div>
  <div class="modal-footer">
    <div class="row">
      <div class="col-sm-12">
        <button class="btn btn-default" @click="reject(null)">
          Cancel
        </button>
        <button class="btn btn-primary" @click="resolve(returnValue)"
            :disabled="data.quantity < 1">
          Expire Credits
        </button>
      </div>
    </div>
  </div>
</Modal>
</template>

<script>
import {mapGetters} from 'vuex'

import Modal from '@/modals/MyModal.vue'
import ModalMixin from '@/modals/ModalMixin'

export default {
  props: {
    userId: {type: Number},
    tag: {type: String}
  },

  components: {
    Modal
  },

  mixins: [ModalMixin],

  data () {
    return {
      data: {
        quantity: 1
      }
    }
  },

  computed: {
    ...mapGetters(['axios']),

    returnValue () {
      return {
        quantity: this.data.quantity
      }
    }
  },

  asyncComputed: {
    user () {
      return this.axios.get(`/user/${this.userId}`)
        .then(r => r.data)
    }
  },

  created () {
    if (this.tag) this.data.tag = this.tag
  }
}
</script>
