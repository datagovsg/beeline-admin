export default function ($rootScope, $location, uiGmapGoogleMapApi, $q,
  RoutesService) {
  return {
    template: `
    <div class="form-inline">
      <label>
        Notify by:
        <select ng-options="notificationMethod for notificationMethod in notificationMethods"
          ng-model="ngModel" class="form-control" ng-required="ngRequired">
        </select>
      </labe>

      <label  ng-if="ngModel === 'email'">
        Email:
        <input type="email" ng-model="agent.email" placeholder="john@example.com"  ng-required="ngRequired" />
      </label>

      <label  ng-if="ngModel === 'telegram'">
        Telegram Chat ID:
        <input type="tel" ng-model="agent.notes.telegramChatId" placeholder="123456"  ng-required="ngRequired" />
      </label>

      <label  ng-if="ngModel === 'sms'">
        Telephone number:
        <input type="tel" ng-model="agent.telephone" placeholder="+65 8111 2222"  ng-required="ngRequired" />
      </label>

      <label >
        Name (optional):
        <input type="text" ng-model="agent.name" placeholder="John"  ng-required="false" />
      </label>
    </div>
    `,
    scope: {
      ngModel: '=',
      agent: '=',
      ngRequired: '=',
    },
    link (scope, elem, attr) {
      scope.agent = scope.agent || {};
      scope.notificationMethods = [
        'telegram',
        'email',
        'sms'
      ]
    }
  }
}
