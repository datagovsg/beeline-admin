<!-- Reference: https://vuejs.org/v2/examples/modal.html -->
<template>
  <transition name="modal">
    <div class="modal-mask" v-if="value">
      <div class="modal-wrapper" @click="clickToClose && $emit('cancel')">
        <div class="modal-dialog" :style="overrideWidth ? `width: ${overrideWidth}` : ''" @click.stop>
          <slot />
        </div>
      </div>
    </div>
  </transition>
</template>
<style>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .5);
  display: table;
  transition: opacity .3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-dialog {
  width: 600px;
  margin: 0px auto;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
  transition: all .3s ease;
  font-family: Helvetica, Arial, sans-serif;
}

.modal-default-button {
  float: right;
}

/*
 * The following styles are auto-applied to elements with
 * transition="modal" when their visibility is toggled
 * by Vue.js.
 *
 * You can easily play with the modal transition by editing
 * these styles.
 */

.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>
<script>
export default {
  props: {
    'clickToClose': {
      default: true,
    },
    value: {},
    overrideWidth: {},
  },
  // created () {
  //   this.$escapeEvent = (event) => {
  //     if (this.clickToClose && event.keyCode === 27) {
  //       if (this.value) {
  //         this.$emit('cancel')
  //       }
  //     }
  //   }
  //   document.addEventListener('keypress', this.$escapeEvent)
  // },
  // destroyed () {
  //   document.removeEventListener('keypress', this.$escapeEvent)
  // }
}
</script>
