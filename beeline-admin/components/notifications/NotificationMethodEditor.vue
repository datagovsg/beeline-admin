<template>
  <div class="form-inline">
    <label>
      Notify by:
      <select
        @input="$emit('input', $event.target.value)"
        class="form-control" :required="required">
        <option value=""></option>
        <option v-for="notificationMethod in notificationMethods"
          :value="notificationMethod"
          :key="notificationMethod"
          :selected="notificationMethod === value">
          {{notificationMethod}}
        </option>
      </select>
    </label>

    <label v-if="value === 'email'">
      Email:
      <input type="email" @input="update('email', $event.target.value)"
        :value="f._.get(agent, 'email')"
        placeholder="john@example.com" 
        :required="required" />
    </label>

    <label v-else-if="value === 'telegram'">
      Telegram Chat ID:
      <input type="tel" @input="update('notes.telegramChatId', $event.target.value)"
        :value="f._.get(agent, 'notes.telegramChatId')"
        placeholder="123456"
        :required="required" />
    </label>

    <label v-else-if="value === 'sms'">
      Telephone number:
      <input type="tel" @input="update('telephone', $event.target.value)"
        :value="f._.get(agent, 'telephone')"
        placeholder="+65 8111 2222" 
        :required="required" />
    </label>

    <label >
      Name (optional):
      <input type="text" name="name" @input="update('name', $event.target.value)"
        :value="f._.get(agent, 'name')"
        placeholder="John"
        :required="false" />
    </label>
  </div>
</template>
<script>
import filters from '@/filters'

export default {
  props: ['value', 'agent', 'required'],

  computed: {
    f: () => filters,

    notificationMethods () {
      return [
        'telegram',
        'email',
        'sms'
      ]
    }
  },

  methods: {
    update (s, v) {
      const clone = {...this.agent}
      const parts = s.split(/\./)

      let iterator = clone
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in iterator)) {
          iterator[parts[i]] = {}
        } else {
          iterator[parts[i]] = {...iterator[parts[i]]}
        }
        iterator = iterator[parts[i]]
      }
      iterator[parts[parts.length - 1]] = v

      this.$emit('agent-input', clone)
    }
  }
}
</script>
