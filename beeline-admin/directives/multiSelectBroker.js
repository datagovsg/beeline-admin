import assert from 'assert';

export default function() {
  return {
    scope: {
      collection: '<',
      trackBy: '<',
      selection: '=',
    },
    link(scope, elem, attr) {
      function toggle(index) {
        if (scope.collection[index][scope.trackBy] in scope.selection.selected) {
          delete scope.selection.selected[scope.collection[index][scope.trackBy]]
        }
        else {
          scope.selection.selected[scope.collection[index][scope.trackBy]] = true;
        }
      }

      scope.$watchCollection('selection.selected', (newVal, oldVal) => {
        if (!scope.selection || !scope.selection.selected) return;
        scope.selection.length = _(scope.selection.selected).values().filter().size();


        const newKeys = _.keys(newVal).filter(k => newVal[k])
        const oldKeys = oldVal ? _.keys(oldVal).filter(k => oldVal[k]) : [];
        const newSelected = _.difference(newKeys, oldKeys);
        const newDeselected = _.difference(oldKeys, newKeys);

        for (let k of newSelected) {
          scope.selection.selectTimestamps[k] = Date.now();
        }
        for (let k of newDeselected) {
          delete scope.selection.selectTimestamps[k];
        }

      })

      // Need to ensure the selection object has all the properties it needs
      scope.$watch('selection', () => {
        if (!scope.selection) {
          return;
        }
        Object.assign(scope.selection, {
          selected: {},
          selectTimestamps: {},
          lastSelectedIndex: null,
          listStart: null,
          length: 0,

          $lastSelected() {
            const minItem = _(this.selectTimestamps)
              .toPairs()
              .maxBy(x => x[1]);

            if (minItem) {
              return scope.collection.find(s => s[scope.trackBy].toString() === minItem[0])
            }
            else {
              return null;
            }
          },

          $selectedObjects() {
            return _(scope.selection.selected)
              .keys()
              .filter(key => scope.selection.selected[key])
              .map(key => scope.collection.find(item => item[scope.trackBy].toString() === key))
              .value()
          },

          $getCollection() {
            return scope.collection;
          },
          $getTrackBy() {
            return scope.trackBy;
          },

          $selectAll() {
            for (let item of scope.collection) {
              scope.selection.selected[item[scope.trackBy]] = true;
            }
            scope.selection.lastSelectedIndex = 0;
          },

          $shiftMousedown(index) {
            if (index < scope.selection.lastSelectedIndex) {
              for (let i=scope.selection.lastSelectedIndex - (
                      (scope.selection.lastSelectedIndex == scope.selection.listStart) ? 1
                      : (scope.selection.lastSelectedIndex < scope.selection.listStart) ? 1
                      : 0);
                    i >= index;
                    i--) {
                toggle(i)
              }
            }
            else if (index > scope.selection.lastSelectedIndex) {
              for (let i = scope.selection.lastSelectedIndex + (
                      (scope.selection.lastSelectedIndex == scope.selection.listStart) ? 1
                      : (scope.selection.lastSelectedIndex > scope.selection.listStart) ? 1
                      : 0);
                    i <= index;
                    i++) {
                toggle(i)
              }
            }

            scope.selection.lastSelectedIndex = index;
          },

          $ctrlMousedown(index) {
            toggle(index);
            scope.selection.listStart = index;
            scope.selection.lastSelectedIndex = index;
          },

          $regularMousedown(index) {
            scope.selection.selected = {}
            toggle(index)
            scope.selection.listStart = index;
            scope.selection.lastSelectedIndex = index;
          },

          $mousedown($event, $index) {
            $event.preventDefault();

            assert(typeof $index === 'number');

            if ($event.ctrlKey) {
              this.$ctrlMousedown($index)
            }
            else if ($event.shiftKey) {
              this.$shiftMousedown($index)
            }
            else {
              this.$regularMousedown($index)
            }
          }
        });
      })
    }
  }
}
