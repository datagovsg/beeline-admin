import _ from 'lodash';

export default function() {
  return {
    replace: true,
    transclude: true,
    template: `
    <div class="expandable">
      <div class="expandable-area" ng-class="{expanded: !!expanded}">
        <ng-transclude></ng-transclude>
      </div>
      <div class="expand-button" ng-click="expanded = !expanded">
        <span ng-if="!expanded">
         Show &raquo;
        </span>
        <span ng-if="expanded">
         Hide &laquo;
        </span>
      </div>
    </div>
    `,
    scope: {},
    link(scope, elem, attr) {
      scope.expanded = false;

      scope.expand = () => {
        scope.expanded = true;
      }

      scope.collapse = () => {
        scope.expanded = false;
      }
    }
  }
}
