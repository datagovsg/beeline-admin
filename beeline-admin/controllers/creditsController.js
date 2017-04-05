import assert from 'assert';
import querystring from 'querystring';


angular.module('beeline-admin')
  .controller('creditsController', function($scope, $stateParams, AdminService, 
    LoadingSpinner
){
  const now = new Date()
  const debouncedLoadTransactions = _.debounce(loadTransactions, 1000)
  const debouncedloadTransactionSummary = _.debounce(loadTransactionSummary, 1000)

  $scope.companyId = $stateParams.companyId || null
  $scope.filter = { 
    userId: $stateParams.userId || null, 
    startDate: new Date(now.getFullYear(), now.getMonth(), 1),
    endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
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

  $scope.$watchCollection('filter', () => {
    $scope.paging.page = 1
    if($scope.companyId){
      debouncedLoadTransactions()
      debouncedloadTransactionSummary()
    } else {
      console.log("Select a company")
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

  $scope.$watch('paging.page', loadTransactions)

  function loadTransactions () {
    let queryOptions = buildQuery()
    const queryString = querystring.stringify(queryOptions)

    return LoadingSpinner.watchPromise(
      AdminService.beeline({
        method: 'GET',
        url: `/companies/${$scope.companyId}/transactionItems/routeCredits?`+queryString
      }).then(resp => {
        if(resp) {
          $scope.disp.transactions = resp.data
        } 
      }).catch(err => {
        commonModals.alert(
          `${err && err.data && err.data.message}`
        )
      })
    )
  }

  function loadTransactionSummary() {
    let queryOptions = _.omit(buildQuery(), ['page', 'order', 'orderBy'])
    const queryString = querystring.stringify(queryOptions)

    return AdminService.beeline({
      method: 'GET',
      url: `/companies/${$scope.companyId}/transactionItems/transactionSummary?`+queryString
    }).then(resp => {
      if(resp) {
        $scope.disp = _.assign($scope.disp, resp.data)
      } 
    }).catch(err => {
      commonModals.alert(
        `${err && err.data && err.data.message}`
      )
    })
  }

  function buildQuery (override) {
    let queryOptions = {}

    if($scope.paging.page) {
      queryOptions.page = $scope.paging.page
    }

    if($scope.paging.perPage) {
      queryOptions.perPage = $scope.paging.perPage
    }

    if($scope.filter.userId) {
      queryOptions.userId = $scope.filter.userId
    }

    if($scope.filter.startDate) {
      queryOptions.startDate = $scope.filter.startDate.getTime()
    }

    if($scope.filter.endDate) {
      queryOptions.endDate = $scope.filter.endDate.getTime()
    }

    if($scope.filter.tag) {
      queryOptions.tag = $scope.filter.tag
    }

    if($scope.filter.hideUncommittedTransactions){
      queryOptions.hideUncommittedTransactions = $scope.filter.hideUncommittedTransactions
    }

    if($scope.filter.transactionType) {
      queryOptions.transactionType = $scope.filter.transactionType
    }


    return queryOptions
  }

  $scope.monthChanged = function(newMonth) {
    $scope.filter.startDate = newMonth.clone().startOf('month').toDate()
    $scope.filter.endDate = newMonth.clone().startOf('month')
                              .add(1, 'month').add(-1, 'day').toDate()
    $scope.filter.page = 1
  }

  }

})