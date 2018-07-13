import { mount } from '@vue/test-utils'
import NotificationMethodEditor from '@/components/notifications/NotificationMethodEditor.vue'
import _ from 'lodash'
import { delay, mockAjax, testStore, mountTestPage } from '../util'

describe('NotificationMethodEditor.vue', () => {
  let editor = null
  let lastInput = null
  let lastAgent = null

  beforeEach(async () => {
    const props = {
      value: lastInput,
      agent: lastAgent,
    }

    function updateProps () {
      editor.find({ref: 'testedComponent'}).setProps({
        value: lastInput,
        agent: lastAgent,
      })
    }

    editor = await mountTestPage(NotificationMethodEditor, {
      sync: false,

      listeners: {
        input (e) {
          lastInput = e
          editor.vm.$nextTick(updateProps)
        },
        'agent-input' (e) {
          lastAgent = e
          editor.vm.$nextTick(updateProps)
        }
      },
      propsData: props
    })
    await delay(1)
  })

  it('should emit agent and value correctly', async () => {
    editor.find('select option[value="telegram"]').element.selected = true
    editor.find('select').trigger('input')
    await delay(1)

    editor.find('input:not([name="name"])').element.value = 'Hello world'
    editor.find('input:not([name="name"])').trigger('input')
    await delay(1)

    expect(lastInput).toBe('telegram')
    console.log(lastAgent)
    expect(_.get(lastAgent, 'notes.telegramChatId')).toBe('Hello world')

    // Switch to SMS
    editor.find('select option[value="sms"]').element.selected = true
    editor.find('select').trigger('input')
    await delay(1)

    editor.find('input:not([name="name"])').element.value = '98765432'
    editor.find('input:not([name="name"])').trigger('input')
    await delay(1)

    expect(lastInput).toBe('sms')
    expect(_.get(lastAgent, 'telephone')).toBe('98765432')

    // Switch to email
    editor.find('select option[value="email"]').element.selected = true
    editor.find('select').trigger('input')
    await delay(1)

    editor.find('input:not([name="name"])').element.value = 'email@example.com'
    editor.find('input:not([name="name"])').trigger('input')
    await delay(1)

    expect(lastInput).toBe('email')
    expect(_.get(lastAgent, 'email')).toBe('email@example.com')

    // Switch back to SMS -- data should be saved
    editor.find('select option[value="sms"]').element.selected = true
    editor.find('select').trigger('input')
    await delay(1)
    expect(editor.find('input:not([name="name"])').element.value).toBe('98765432')
  })
})

