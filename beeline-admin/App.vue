<template>
  <div>
    <AdminNav />

    <ModalHelper />
    <AuthHelper />
    <LoadingSpinner />

    <div class="row container-fluid withnav">
      <router-view />
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

import AdminNav from '@/components/nav/AdminNav.vue'
import ModalHelper from '@/components/ModalHelper.js'
import AuthHelper from '@/components/AuthHelper.js'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

export default {
  components: {AdminNav, AuthHelper, ModalHelper, LoadingSpinner},

  created () {
    document.addEventListener('click', () => this.setDropdown(null))
  },

  methods: {
    ...mapMutations('dropdown', ['setDropdown']),
  }
}
</script>

