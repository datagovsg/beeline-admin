import assert from 'assert';
import querystring from 'querystring';


angular.module('beeline-admin')
.controller(
'creditsController',
function($scope, $stateParams, AdminService, LoadingSpinner, commonModals) {
  const now = new Date()
  const debouncedLoadTransactions = _.debounce(loadTransactions, 1000)
  const debouncedloadTransactionSummary = _.debounce(loadTransactionSummary, 1000)

  $scope.companyId = $stateParams.companyId || null
  $scope.filter = {
    user: { id: $stateParams.userId } || {},
    startDate: null,
    endDate: null,
    selectedMonth: new Date(),
    tag: null,
    transactionType: null,
    hideUncommittedTransactions: false,
  }
  $scope.disp = {
    transactions: null,
    highlightDays: []
  }
  $scope.paging = {
    page: 1,
    perPage: 20,
  }
  $scope.refund = {
    transactionItems: null,
    paymentResource : null
  }

  $scope.$watchCollection('filter', () => {
    $scope.paging.page = 1
    if($scope.companyId){
      debouncedLoadTransactions()
      debouncedloadTransactionSummary()
    }
  })

  $scope.$watch('disp.txnCountByDay', (counts) => {
    $scope.disp.highlightDays = _.keys(counts).map((date) => {
      return {
        date: parseInt(date),
        annotation: counts[date],
        selectable: true,
      }
    })
  })

  $scope.$watch('paging.page', () => {
    if($scope.companyId){
      loadTransactions()
    }
  })

  function loadTransactions () {
    let queryOptions = buildQuery($scope.paging, $scope.filter)

    return LoadingSpinner.watchPromise(
      AdminService.beeline({
        method: 'GET',
        url: `/companies/${$scope.companyId}/transactionItems/routeCredits?`
          + querystring.stringify(queryOptions)
      }).then(async resp => {
        $scope.disp.transactions = await postProcessTransaction(resp.data)
      }).catch(err =>
        commonModals.alert(
          `${err && err.data && err.data.message}`
        )
      )
    )
  }

  function postProcessTransaction (txns) {
    return Promise.all(_.map(txns, (txn) => {
      // to speed up, skip the query transaction items for non-purchase / non-conversion ones
      if (txn.transaction.type !== 'routeCreditPurchase' && txn.transaction.type !== 'conversion') {
        return Promise.resolve(txn)
      }
      else
        return queryTransactionItems(txn)
    }))
  }

  function loadTransactionSummary() {
    let queryOptions = buildQuery({}, {
      ...$scope.filter
    })
    return AdminService.beeline({
      method: 'GET',
      url: `/companies/${$scope.companyId}/transactionItems/routeCredits/summary?`
        + querystring.stringify(queryOptions)
    }).then(resp => {
      _.assign($scope.disp, _.pick(resp.data, ['totalItems', 'txnCountByDay']))
    }).catch(err =>
      commonModals.alert(
        `${err && err.data && err.data.message}`
      )
    )
  }

  function buildQuery (paging, filter) {
    let queryOptions = {}

    if(paging.page) {
      queryOptions.page = paging.page
    }

    if(paging.perPage) {
      queryOptions.perPage = paging.perPage
    }

    if(filter.userId) {
      queryOptions.userId = filter.userId
    }

    if(filter.startDate) {
      queryOptions.startDateTime = filter.startDate.getTime()
    } else {
      queryOptions.startDateTime = new Date(
        $scope.filter.selectedMonth.getFullYear(),
        $scope.filter.selectedMonth.getMonth(),
        1
      ).getTime()
    }

    if(filter.endDate) {
      // Because we want less-then-equals semantics
      queryOptions.endDateTime = filter.endDate.getTime() + 24 * 3600 * 1000
    } else {
      queryOptions.endDateTime = new Date(
        $scope.filter.selectedMonth.getFullYear(),
        $scope.filter.selectedMonth.getMonth() + 1,
        0
      ).getTime()
    }

    if(filter.tag) {
      queryOptions.tag = filter.tag
    }

    if(filter.hideUncommittedTransactions){
      queryOptions.hideUncommittedTransactions = filter.hideUncommittedTransactions
    }

    if(filter.transactionType) {
      queryOptions.transactionType = filter.transactionType
    }

    return queryOptions
  }

  $scope.monthChanged = function(newMonth) {
    $scope.filter.selectedMonth = newMonth.clone().toDate()
    $scope.filter.startDate = $scope.filter.endDate = null
  }

  $scope.refund = async function(txn) {
    await LoadingSpinner.watchPromise(queryTransactionItems(txn))
    console.log(txn)
    console.log(txn.refund.transactionItems)
    console.log(txn.refund.paymentResource)
    console.log(txn.refund.paymentAmount)
  }

  function queryTransactionItems (txn) {
    let queryOptions = {
      transactionId: txn.transactionId
    }
    return AdminService.beeline({
      method: 'GET',
      url: `/transactionItems?`
        + querystring.stringify(queryOptions)
    }).then(resp => {
      let transactionItems = resp.data.rows
      let paymentItem = transactionItems.find((ti)=>{
        return ti.itemType === 'payment'
      })
      txn.refund = {
        paymentResource : _.get(paymentItem, 'payment.paymentResource'),
        transactionItems: resp.data,
        paymentAmount : _.get(paymentItem, 'debit')
      }
      return txn

    }).catch(err =>
      commonModals.alert(
        `${err && err.data && err.data.message}`
      )
    )
  }

})
