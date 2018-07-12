import _ from 'lodash'
import VueRouter from 'vue-router'
import {authInitializationPromise} from '@/components/AuthHelper'

import AdminsPage from '@/pages/admins.vue'
import AssetsPage from '@/pages/assets.vue'
import BookingsPage from '@/pages/bookings.vue'
import CompaniesPage from '@/pages/companies.vue'
import ContactListPage from '@/pages/contact-list.vue'
import ContactListsPage from '@/pages/contact-lists.vue'
import CrowdstartSummaryPage from '@/pages/crowdstart-summary.vue'
import RoutesPage from '@/pages/routes.vue'
import RoutePassesPage from '@/pages/route-passes.vue'
import RoutePage from '@/pages/route.vue'
import PromotionPage from '@/pages/promotion.vue'
import PromotionsPage from '@/pages/promotions.vue'
import TransactionsPage from '@/pages/transactions.vue'
import UserPage from '@/pages/users.vue'
import NotificationsPage from '@/pages/notifications.vue'
import ExtendRoutesPage from '@/pages/extend-routes.vue'
import DriversPage from '@/pages/drivers.vue'
import SummaryPage from '@/pages/ridership-summary.vue'
import RouteTimelinessPage from '@/pages/route-timeliness.vue'

export default function () {
  function addQueryProps(...queryProps) {
    return (r) => {
      return ({
        ..._.pick(r.query, queryProps),
        ...r.params,
        companyId: (parseInt(r.params.companyId))
          ? r.params.companyId
          : null
      })
    }
  }

  const routes = [
    {
      path: `/c/:companyId/transactions`,
      component: TransactionsPage,
      name: 'TransactionsPage',
      props: addQueryProps('transactionId', 'ticketId')
    },
    {
      path: `/c/:companyId/routes`,
      component: RoutesPage,
      name: 'RoutesPage',
      props: addQueryProps()
    },
    {
      path: `/c/:companyId/extend-routes`,
      component: ExtendRoutesPage,
      name: 'ExtendRoutesPage',
      props: addQueryProps()
    },
    {
      path: `/c/:companyId/companies`,
      component: CompaniesPage,
      name: 'CompaniesPage',
      props: addQueryProps()
    },
    {
      path: `/c/:companyId/assets`,
      component: AssetsPage,
      name: 'AssetsPage',
      props: addQueryProps()
    },
    {
      path: `/c/:companyId/admins`,
      component: AdminsPage,
      name: 'AdminsPage',
      props: addQueryProps()
    },
    {
      path: `/c/:companyId/trips/:routeId/:action`,
      component: RoutePage,
      name: 'RoutePage',
      props: addQueryProps()
    },
    {
      path: `/c/:companyId/summary`,
      component: SummaryPage,
      name: 'SummaryPage',
      props: addQueryProps()
    },
    {
      path: `/c/:companyId/bookings`,
      component: BookingsPage,
      name: 'BookingsPage',
      props: addQueryProps('routeId', 'tripId', 'userId'),
    },
    {
      path: `/c/:companyId/drivers`,
      component: DriversPage,
      name: 'DriversPage',
      props: addQueryProps()
    },
    {
      path: `/c/:companyId/crowdstart-summary`,
      component: CrowdstartSummaryPage,
      name: 'CrowdstartSummaryPage',
      props: addQueryProps()
    },
    {
      path: `/c/:companyId/promotions`,
      component: PromotionsPage,
      name: 'PromotionsPage',
      props: addQueryProps()
    },
    {
      path: `/c/:companyId/promotions/:promoId`,
      component: PromotionPage,
      name: 'PromotionPage',
      props: addQueryProps()
    },
    {
      path: '/c/:companyId/contactLists',
      component: ContactListsPage,
      name: 'ContactListsPage',
      props: addQueryProps()
    },
    {
      path: '/c/:companyId/contactLists/:contactListId',
      component: ContactListPage,
      name: 'ContactListPage',
      props: addQueryProps()
    },
    {
      path: '/c/:companyId/notifications',
      component: NotificationsPage,
      name: 'NotificationsPage',
      props: addQueryProps(),
    },
    {
      path: '/c/:companyId/users',
      component: UserPage,
      name: 'UsersPage',
      props: addQueryProps()
    },
    {
      path: '/c/:companyId/users/:userId',
      component: UserPage,
      name: 'UserPage',
      props: addQueryProps()
    },
    {
      path: '/c/:companyId/route-passes',
      component: RoutePassesPage,
      name: 'RoutePassesPage',
      props: addQueryProps('userId'),
    },
    {
      path: '/c/:companyId/route-timeliness',
      component: RouteTimelinessPage,
      name: 'RouteTimelinessPage',
      props: addQueryProps()
    },
    {
      path: '*',
      component: BookingsPage
    }
  ]
  
  const router = new VueRouter({
    saveScrollPosition: true,
    routes
  })

  // Force the params to be parsed first before
  // navigation can happen
  router.beforeEach((to, from, next) => {
    authInitializationPromise.then(next)
  })

  return router
}