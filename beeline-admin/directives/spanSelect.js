
/*
  Extends the multiple-date-picker to support span select.
*/

export default function () {
  return {
    scope: {
      firstDate: '=?',
      lastDate: '=?',
      ngModel: '=?',
      highlightDays: '=?',
    },
    template: `<multiple-date-picker
      highlight-days="highlightDays"
      ng-model="ngModel">
    </multiple-date-picker>`,
    link(scope, elem, attr) {
      scope.$watch('ngModel', (newValue, oldValue) => {
        console.log(newValue);


        if (!newValue || newValue.length === 0) {
          if (scope.firstDate && scope.lastDate) {
            scope.ngModel = [
              moment(scope.firstDate), moment(scope.lastDate)
            ];
          }
        }
        else {
          if (newValue.length === 1) {
            return;
          }
          else if (newValue.length === 2) {
            scope.firstDate =  new Date(Math.min(newValue[0], newValue[1]))
            scope.lastDate = new Date(Math.max(newValue[0], newValue[1]))
          }
          else {
            scope.ngModel = [newValue[newValue.length-1]]
          }
        }
      }, true)
    }
  }
}
