<template>
  <div class="container withnav drivers">

    <div class="col-lg-12">
      <h1>Manage Contact Lists</h1>

      <div v-if="!companyId">
        Please select a company from the top-right corner
      </div>
      <div v-else-if="contactLists === false">
        Error loading Telephone List
      </div>
      <div v-else-if="contactLists === null">
        Loading...
      </div>
      <div v-else-if="contactLists">
        <table class="table table-striped contact-lists">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="contactList in contactLists" :key="contactList.id">
              <td>{{contactList.id}}</td>
              <td><a :href="`#/c/${companyId}/contactLists/${contactList.id}`">{{contactList.description}}</a></td>
              <td><a :href="`#/c/${companyId}/contactLists/${contactList.id}`">{{f.date(contactList.createdAt, 'dd-mmm-yyyy HH:MM:ss')}}</a></td>
              <td>
                <a class="btn btn-default" :href="`#/c/${companyId}/contactLists/${contactList.id}`">
                  <span class="glyphicon glyphicon-edit"></span>Edit
                </a>
                <button class="btn btn-danger delete-button" @click="deleteContactList(contactList)">
                  <span class="glyphicon glyphicon-trash"></span>Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <button class="btn btn-primary new-contact-list-button" @click="createNewContactList()">
          <span class="glyphicon glyphicon-plus"></span>
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import assert from 'assert'
import querystring from 'querystring'
import {mapGetters, mapActions, mapState} from 'vuex'
import _ from 'lodash'
import * as resources from '../stores/resources'
import filters from '../filters'
import dateformat from 'dateformat'

export default {
  props: ['companyId', 'contactListId'],
  data: () => ({
    contactLists: null
  }),
  mounted () {
    return this.requery()
  },
  computed: {
    ...mapGetters(['axios']),
    f: () => filters
  },
  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal', 'showErrorModal']),

    requery () {
      this.spinOnPromise(this.axios.get(`/companies/${this.companyId}/contactLists`)
        .then((response) => {
          this.contactLists = response.data
        }))
        .catch((err) => {
          this.contactLists = false
          console.log(err.response)
        })
    },

    addAdmin () {
      this.admins.push(this.blankAdmin())
    },

    createNewContactList () {
      return this.spinOnPromise(
        this.axios.post(
          `/companies/${this.companyId}/contactLists`,
          {
            description: `New Telephone List ${this.f.date(Date.now(), 'dd mmm yyyy')}`,
            telephones: [],
            emails: []
          })
      )
        .then(() => this.requery())
        .catch(this.showErrorModal)
    },

    deleteContactList (contactList) {
      return this.showModal({
        component: 'CommonModals',
        props: {
          type: 'confirm',
          title: 'Delete contact list',
          message: `Are you sure you want to delete "${contactList.description}"`
        }
      })
        .then((response) => {
          if (response) {
            return this.spinOnPromise(
              this.axios.delete(`/companies/${this.companyId}/contactLists/${contactList.id}`)
            )
              .then(() => this.requery())
          }
        }, () => {})
        .catch(this.showErrorModal)
    }
  }
}

</script>
