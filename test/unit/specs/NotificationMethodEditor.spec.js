import NotificationMethodEditor from '@/components/notifications/NotificationMethodEditor.vue'
import _ from 'lodash'
import { delay, mountTestPage } from '../util'

describe('NotificationMethodEditor.vue', () => {
  let editor = null
  let lastInput = null
  let lastAgent = null

  beforeEach(async () => {
    const props = {
      value: lastInput,
      agent: lastAgent
    }

    function updateProps () {
      editor.find({ref: 'testedComponent'}).setProps({
        value: lastInput,
        agent: lastAgent
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
    expect(_.get(lastAgent, 'notes.telegramChatId')).toBe('Hello world')
  })
})

