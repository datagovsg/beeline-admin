<template>
<div>
  <div class="row">
    <div class="col-sm-3">
      <h1>Users</h1>
    </div>
  </div>
  <div class="row">
    <div class="col-sm-6">
      <UserIdSelector :value="Number(userId)"
        @input="goToUserId($event)"
        :includeEphemeral="false" />
    </div>
  </div>
  <div class="row" v-if="user && user.id">
    <div class="col-sm-3">
      <div>
        <table class="table">
          <h2>Information</h2>
          <tr>
            <th>UserId:</th>
            <td>{{user.id}}</td>
          </tr>
          <tr>
            <th>Name:</th>
            <td>{{user.name}}</td>
          </tr>
          <tr>
            <th>Email:</th>
            <td>{{user.email}}</td>
          </tr>
          <tr>
            <th>Telephone:</th>
            <td>{{user.telephone}}</td>
          </tr>
          <tr>
            <th>Registered:</th>
            <td>{{ f.date(user.createdAt, 'dd-mmm-yyyy HH:MM:ss')}}</td>
          </tr>
          <tr>
            <th>Last Login:</th>
            <td>{{ f.date(user.lastLogin, 'dd-mmm-yyyy HH:MM:ss')}}</td>
          </tr>
          <tr>
            <th>Last App Used:</th>
            <td>{{user.lastUsedAppName}}</td>
          </tr>
          <tr>
            <th>Saved Payment Methods</th>
            <td>
              <span v-if="!f._.get(user, 'savedPaymentInfo.sources.data.length')">
                (none)
              </span>
              <div v-else>
                <div v-for="(source, index) in user.savedPaymentInfo.sources.data" :key="index">
                  {{source.brand}},
                  <i>...{{source.last4}}</i>
                </div>
              </div>
            </td>
          </tr>
        </table>
        <div class="row">
          <div class="col-sm-12" v-if="user">
            <a :href="`#/c/${companyId}/bookings?userId=${user.id}`"
              class="btn btn-primary btn-block">
              User booking for this month
            </a>
            <a :href="`#/c/${companyId}/route-passes?userId=${user.id}`"
              class="btn btn-primary btn-block">
              Route pass for this month
            </a>
            <button class="btn btn-primary btn-block"
              @click="getUserPin()" v-if="isSuperAdmin">
              Get PIN
            </button>
            <button class="btn btn-warning btn-block" @click="showIssueRouteCreditsModal({tag: '', userId: userId})">
              <span class="glyphicon glyphicon-piggy-bank" aria-hidden="true"></span>
              Issue passes...
            </button>
          </div>
          <br/>
        </div>

      </div>
    </div>

    <div class="col-sm-9" v-if="userId">
      <h2>Crowdstart Routes</h2>
      <CrowdstartHistoryTable :userId="Number(userId)" :companyId="companyId" />

      <h2>Route Passes</h2>
      <div v-if="!companyId">
        Please select a company from the top right hand corner to manage route passes
      </div>
      <AllRoutePassesTable v-else
        @route-pass-history-requested="showRoutePassHistory($event)"
        @show-issue-credits="showIssueRouteCreditsModal($event)"
        @show-expire-credits="showExpireRouteCreditsModal($event)"
        :userId="Number(userId)"
        :companyId="companyId" />

      <template v-if="routePassHistoryParams">
        <h2>History of '{{routePassHistoryParams.tag}}'</h2>
        <RoutePassHistory
          ref="routePassesHistory"
          :userId="Number(userId)"
          :tag="routePassHistoryParams.tag"
          :finalBalance="routePassHistoryParams.balance"
          :companyId="companyId"
          />
      </template>
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
import filters from '@/filters'
import dateformat from 'dateformat'

import AllRoutePassesTable from '@/components/users/AllRoutePassesTable.vue'
import CrowdstartHistoryTable from '@/components/users/CrowdstartHistoryTable.vue'
import RoutePassHistory from '@/components/users/RoutePassHistory.vue'
import UserIdSelector from '@/components/UserIdSelector.vue'
import IssueRouteCreditsModal from '@/modals/IssueRouteCredits.vue'
import ExpireRouteCreditsModal from '@/modals/ExpireRouteCredits.vue'

export default {
  props: ['companyId', 'userId'],
  components: {AllRoutePassesTable, CrowdstartHistoryTable, RoutePassHistory, UserIdSelector},
  data: () => ({
    routePassHistoryParams: null
  }),
  mounted () {
  },
  computed: {
    ...mapGetters(['axios', 'isSuperAdmin']),

    f: () => filters
  },
  asyncComputed: {
    user () {
      if (!this.userId) return null
      return this.axios.get(`/user/${this.userId}`).then(r => r.data)
    }
  },
  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal', 'showErrorModal', 'alert']),

    goToUserId (userId) {
      window.location.assign(`#/c/${this.companyId}/users/${userId}`)
    },

    showRoutePassHistory ({tag, balance}) {
      this.routePassHistoryParams = {tag, balance}
    },

    getUserPin () {
      return this.axios.get(`/user/${this.userId}/telephoneCode`)
        .then((response) => {
          this.alert({
            title: 'User Login PIN',
            message: response.data
          })
        })
        .catch(this.showErrorModal)
    },

    showIssueRouteCreditsModal (routeCredit) {
      this.showModal({
        component: IssueRouteCreditsModal,
        props: {
          userId: Number(this.userId),
          tag: routeCredit.tag
        }
      })
        .then((issueQuery) => {
          return this.axios.post(`/transactions/route_passes/issue_free`, issueQuery)
            .then(() => {
              this.$refs.routePassesHistory.requery()
              return this.flash({title: 'Route passes issued'})
            })
            .catch(this.showErrorModal)
        })
        .catch(() => { /* dismissed */ })
    },

    showExpireRouteCreditsModal (routeCredit) {
      this.showModal({
        component: ExpireRouteCreditsModal,
        props: {
          userId: Number(this.userId),
          tag: routeCredit.tag
        }
      })
        .then((expireResult) => {
          return this.axios.post(
            `/companies/${this.companyId}/route_passes/${routeCredit.tag}/users/${this.userId}/expire`,
            expireResult
          )
            .then(() => {
              this.$refs.routePassesHistory.requery()
              return this.flash({title: 'Route passes expired'})
            })
            .catch(this.showErrorModal)
        })
        .catch(() => { /* dismissed */ })
    }
  }
}

</script>
