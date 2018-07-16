<template>
<div>

  <div class="col-lg-12">
    <h1>Manage Contact List</h1>

    <div v-if="!editContactList">
      Error loading Contact List
    </div>
    <div v-else>
      <div class="form-group">
        <label>
          Code
          <input type="text" v-model="editContactList.description"
            class="form-control"
            />
        </label>
      </div>

      <div class="flex-row">
        <div class="form-group telephone-list">
          Telephone numbers (one per line)
          <textarea type="text" v-model="editContactList.telephones"
            class="form-control">
          </textarea>
        </div>

        <div class="form-group email-list">
          Email addresses (one per line)
          <textarea type="text" v-model="editContactList.emails"
            class="form-control">
          </textarea>
        </div>
      </div>

      <button @click="save()" class="btn btn-primary">Save</button>
    </div>
  </div>
</div> <!-- .booking-page -->

</template>
<script>
import assert from 'assert'
import querystring from 'querystring'
import {mapGetters, mapActions} from 'vuex'

import filters from '@/filters'

export default {
  props: ['companyId', 'contactListId'],

  data () {
    return {
      editContactList: null
    }
  },

  computed: {
    ...mapGetters(['axios']),

    f: () => filters
  },

  watch: {
    companyId: {
      immediate: true,
      handler (h) {
        this.requery()
      }
    }
  },

  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal', 'showErrorModal', 'alert', 'confirm', 'flash']),

    requery () {
      this.spinOnPromise(
        this.axios.get(
          `/companies/${this.companyId}/contactLists/${this.contactListId}`
        )
      )
        .then((response) => {
          this.editContactList = this.makeEditable(response.data)
        })
        .catch(this.showErrorModal)
    },

    save () {
      this.spinOnPromise(
        this.axios.put(
          `/companies/${this.companyId}/contactLists/${this.contactListId}`,
          this.preSaveTransform(this.editContactList)
        )
      )
        .then((response) => {
          this.editContactList = this.makeEditable(response.data)
        })
        .catch(this.showErrorModal)
    },

    preSaveTransform (e) {
      return {
        description: e.description,
        telephones: e.telephones.split('\n')
          .map(s => s.trim())
          .filter(s => s),
        emails: e.emails.split('\n')
          .map(s => s.trim())
          .filter(s => s)
      }
    },

    makeEditable (contactList) {
      return {
        description: contactList.description,
        telephones: contactList.telephones.join('\n'),
        emails: contactList.emails.join('\n')
      }
    }
  }
}

</script>

<style>
.telephone-list, .email-list {
  flex: 1 1 50%;
}
</style>
