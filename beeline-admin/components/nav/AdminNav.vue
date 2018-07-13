<template>
<nav class="navbar navbar-inverse navbar-fixed-top">
  <!-- Fixed navbar -->
  <div class="container-fluid">
    <div class="navbar-header">
      <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </button>
    </div>
    <div id="navbar" class="navbar-collapse collapse">
      <a class="navbar-brand" href="#">Beeline Admin</a>
      <ul class="nav navbar-nav">
        <li><a :href="`#/c/${companyId}/bookings`">Bookings</a></li>
        <li><a :href="`#/c/${companyId}/route-passes`">Route Passes</a></li>

        <MenuDropdown wrapperTag="li" itemTag="a" menuTag="ul"
            :menuClass="{'dropdown-menu': true}">
          <span>
            Routes<span class="caret"></span>
          </span>

          <template slot="menu">
            <li><a :href="`#/c/${companyId}/routes`">All</a></li>
            <li><a :href="`#/c/${companyId}/extend-routes`">Extend Routes</a></li>
            <li><a :href="`#/c/${companyId}/crowdstart-summary`">Crowdstart</a></li>
            <li><a :href="`#/c/${companyId}/summary`">Ridership Summary</a></li>
            <li><a :href="`#/c/${companyId}/route-timeliness`">Timeliness Report</a></li>
          </template>
        </MenuDropdown>

        <li><a :href="`#/c/${companyId}/users`">Users</a></li>
        <li><a :href="`#/c/${companyId}/drivers`">Drivers</a></li>
        <MenuDropdown wrapperTag="li" itemTag="a" menuTag="ul"
            :menuClass="{'dropdown-menu': true}">
          <span>
            Company
            <span class="caret"></span>
          </span>

          <template slot="menu">
            <li><a :href="`#/c/${companyId}/companies`">Manage Company Profile</a></li>
            <li><a :href="`#/c/${companyId}/promotions`">Manage Promotions</a></li>
            <li><a :href="`#/c/${companyId}/contactLists`">Manage Contact Lists</a></li>
            <li><a :href="`#/c/${companyId}/admins`">Manage Admin Users</a></li>
            <li><a :href="`#/c/${companyId}/notifications`">Manage Route Event Notifications</a></li>
            <li v-if="isSuperAdmin"><a :href="`#/c/${companyId}/transactions`">Transactions</a></li>
          </template>
        </MenuDropdown>
        <li v-if="isSuperAdmin"><a :href="`#/c/${companyId}/assets`">Assets</a></li>
      </ul>
      <ul class="nav navbar-nav pull-right">
        <li>
          <a><SuperAdminCompanySelector/></a>
        </li>

        <li v-if="!idToken">
          <a @click="login()">Login</a>
        </li>
        <li v-else class="logout-button">
          <a @click="logout()">Log out <br/> {{sessionEmail}}</a>
        </li>
      </ul>
    </div>
    <!--/.nav-collapse -->
  </div>
</nav>
</template>
<script>
import {mapGetters, mapActions, mapMutations, mapState} from 'vuex'

import SuperAdminCompanySelector from './SuperAdminCompanySelector.vue'
import MenuDropdown from '@/components/nav/MenuDropdown.vue'

export default {
  components: {MenuDropdown, SuperAdminCompanySelector},
  data () {
    return {
      dropdown: null,
    }
  },
  computed: {
    ...mapState('auth', ['idToken']),
    ...mapGetters(['sessionEmail', 'isSuperAdmin']),

    companyId () {
      return this.$route.params.companyId || 'null'
    }
  },
  methods: {
    ...mapMutations('auth', ['authenticate', 'showLoginDialog']),

    toggleDropdown (name) {
      this.dropdown = (this.dropdown === name) ? null : name
    },

    login () {
      this.showLoginDialog()
    },

    logout () {
      this.authenticate(null)
      this.showLoginDialog()
    }
  }
}
</script>
