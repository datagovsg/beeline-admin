<template>
<Modal class="asset-editor" @cancel="reject()" :value="editAsset" :clickToClose="false">
  <div class="modal-header">
    <h3>{{title}}</h3>
  </div>
  <div class="modal-body" v-if="editAsset">
    <label>
      Asset ID:
      <input type="text" class="asset-id form-control" v-model="editAsset.id">
    </label>
    <textarea class="form-control" v-model="editAsset.data">
    </textarea>
  </div>
  <div class="modal-body" v-else>
    Loading...
  </div>
  <div class="modal-footer">
    <button class="btn btn-primary" @click="resolve(editAsset)">Save</button>
    <button class="btn btn-default" @click="reject()">Cancel</button>
  </div>
</Modal>
</template>

<script>
import Modal from './MyModal.vue'
import ModalMixin from './ModalMixin'
import {mapGetters} from 'vuex'

export default {
  props: ['title', 'assetId'],

  components: { Modal },

  data () {
    return { editAsset: null }
  },

  mixins: [ModalMixin],

  computed: {
    ...mapGetters(['axios'])
  },

  created () {
    if (this.assetId === null) {
      this.editAsset = {id: '', data: ''}
    } else {
      this.axios.get(`/assets/${this.assetId}`)
        .then((response) => {
          this.editAsset = response.data
        })
    }
  },

  methods: {
  }
}
</script>
