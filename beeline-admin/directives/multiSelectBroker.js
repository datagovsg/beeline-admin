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
          scope.selection.selected[scope.collection[index][scope.trackBy]] = scope.collection[index];
        }
      }

      scope.$watchCollection('selection.selected', () => {
        if (!scope.selection || !scope.selection.selected) return;
        scope.selection.length = Object.keys(scope.selection.selected).length;
      })

      // Need to ensure the selection object has all the properties it needs
      scope.$watch('selection', () => {
        if (!scope.selection) {
          return;
        }
        Object.assign(scope.selection, {
          selected: {},
          lastSelectedIndex: null,
          listStart: null,
          length: 0,

          $getCollection() {
            return scope.collection;
          },
          $getTrackBy() {
            return scope.trackBy;
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
