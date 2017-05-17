import querystring from 'querystring';

export default function (AdminService) {
  return {
    template: `
<ui-select ng-model="data.user">
  <ui-select-match placeholder="Enter a name or telephone or email">
    <span>
      ({{$select.selected.id}})
      {{$select.selected.name}}
      {{$select.selected.telephone}}
      {{$select.selected.email}}
    </span>
  </ui-select-match>
  <ui-select-choices repeat="user in users track by user.id"
     refresh="refreshUsers($select.search)"
     refresh-delay="300">
    <span>
      ({{user.id}})
      {{user.name}}
      {{user.telephone}}
      {{user.email}}
    </span>
  </ui-select-choices>
  <ui-select-no-choice>
    No results found
  </ui-select-no-choice>
</ui-select>
    `,
    scope: {
      ngModel: '=?',
      user: '<initialUser',
      includeEphemeral: '<includeEphemeral'
    },
    controller($scope) {
      var displayUser =
        $scope.user ? $scope.user
        : $scope.ngModel ? {id: $scope.ngModel, name: `(User #${$scope.ngModel})`}
        : null;
      $scope.users = displayUser ? [displayUser] : [];
      $scope.data = {
        user: displayUser,
      };

      $scope.$watch('data.user', (val) => $scope.ngModel = val ? val.id : val);

      var lastPromise = null;
      $scope.refreshUsers = function (search) {
        if(search.length < 3) return

        var promise = AdminService.beeline({
          method: 'GET',
          url: `/users/search?` + querystring.stringify({
            q: search,
            includeEphemeral: $scope.includeEphemeral,
          })
        })
        .then((response) => {
          if (lastPromise === promise) {
            $scope.users = response.data;

            // // If there's a pre-set user id
            // $scope.data.ngModal = scope.users.find(u => u.id === scope.userId)
          }
        });
        lastPromise = promise;
      }
    }
  }
}
