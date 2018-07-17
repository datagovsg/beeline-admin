<template>
<Modal @cancel="reject()" :value="returnValue">
  <div class="modal-header">
    <h3>Issue Route Credits</h3>
  </div>
  <div class="modal-body">
    <div class="row">
      <label class="col-sm-3 control-label">Issue For: </label>
      <div class="col-sm-9">
        <input type="text" name="tag" class="form-control" placeholder="tag"
          v-model="data.tag">
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
      <label class="col-sm-3 control-label"># of Trips: </label>
      <div class="col-sm-4">
        <input type="number" name="quantity" class="form-control" min="1" v-model.number="data.quantity">
      </div>
    </div>
    <div class="row">
      <label class="col-sm-3">Description: </label>
      <div class="col-sm-9">
        <textarea type="text" name="description" class="form-control"
          v-model="data.description" placeholder="Please enter a description" required></textarea>
      </div>
    </div>
  </div>
  <div class="modal-footer">
    <div class="row">
      <div class="col-sm-12">
        <button class="btn btn-default" @click="reject()">
          Cancel
        </button>
        <!-- TODO: validation -->
        <button class="btn btn-primary" @click="resolve(returnValue)"
          :disabled="data.quantity < 1 || !data.description">
          Issue Credits
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
        tag: '',
        description: '',
        quantity: 1
      }
    }
  },

  computed: {
    ...mapGetters(['axios']),
    returnValue () {
      return {
        userId: this.userId,
        quantity: this.data.quantity,
        tag: this.data.tag,
        description: this.data.description
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
