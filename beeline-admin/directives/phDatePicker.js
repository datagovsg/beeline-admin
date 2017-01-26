import _ from 'lodash';

/*
  Extends the multiple-date-picker to support span select.
*/

export default function (AdminService) {
  return {
    restrict: 'A',
    link(scope, elem, attr) {
        AdminService.beeline({
          url: `/publicHolidays`
        }).then((response) => {
          scope.publicHolidays =  response.data.map((date) => {
            return {
              date: new Date(date.date).getTime(),
              title: date.summary,
              selectable: true,
              css: 'holiday'
            }
          })
        })
    }
  }
}
