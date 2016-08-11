
/*
  Extends the multiple-date-picker to support span select.
*/
var offset = new Date().getTimezoneOffset() * 60000;
export default function () {
  return {
    scope: {
      firstDate: '=?',
      lastDate: '=?',
      ngModel: '=?',
      highlightDays: '=?',
    },
    template: `<multiple-date-picker
      highlight-days="combineHD"
      ng-model="ngModel">
    </multiple-date-picker>`,
    link(scope, elem, attr) {
      scope.phs = [
        {date:(moment('20160811')).valueOf(),css: 'holiday',title:'national holiday'},
        {date:(moment('20160912')).valueOf(),css: 'holiday',title:'hari raya'}
      ]
      scope.$watch('highlightDays',(hds)=>{
        for (var ph in scope.phs){
          for (var hd in hds){
            console.log(scope.phs[ph].date);
            console.log(hds[hd].date);
            if (moment(scope.phs[ph].date).isSame(hds[hd].date,'day')){
            	console.log("same date");
              _.assign(scope.phs[ph], hds[hd]);
              console.log("merged as");
              console.log(scope.phs[ph]);
              hds.splice(hd,1);
              break;
            }
          }
        }
        console.log('phs are ');
        console.log(scope.phs);
        console.log('hds are ');
        console.log(hds);
        scope.combineHD = _.concat(scope.phs, hds);
        console.log('combine HDs are ');
        console.log(scope.combineHD);
      },true);
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
