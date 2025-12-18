import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import NoteCard from '../NoteCard.vue'
import type { Note } from '../../types'

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: 'My title',
    content: 'My content',
    x: 10,
    y: 20,
    updatedBy: 'alice',
    comments: [],
    ...overrides,
  }
}

describe('NoteCard', () => {
  it('renders title and content from props', () => {
    const note = makeNote({ title: 'Plan sprint Q4', content: 'Detalle de tareas...' })

    const wrapper = mount(NoteCard, {
      props: {
        note,
        bounds: { width: 1600, height: 1200 },
      },
      global: {
        plugins: [
          createTestingPinia({
            stubActions: true,
            initialState: {
              board: {
                currentUser: { name: 'bob' },
                notes: [],
                users: [],
                isConnected: true,
              },
            },
          }),
        ],
      },
    })

    const titleInput = wrapper.find('input')
    const contentTextarea = wrapper.find('textarea')

    expect((titleInput.element as HTMLInputElement).value).toBe('Plan sprint Q4')
    expect((contentTextarea.element as HTMLTextAreaElement).value).toBe('Detalle de tareas...')
  })

  it('shows "Editado por [usuario]" when updatedBy is provided', () => {
    const note = makeNote({ updatedBy: 'carlos' })

    const wrapper = mount(NoteCard, {
      props: {
        note,
        bounds: { width: 1600, height: 1200 },
      },
      global: {
        plugins: [
          createTestingPinia({
            stubActions: true,
            initialState: {
              board: {
                currentUser: { name: 'bob' },
                notes: [],
                users: [],
                isConnected: true,
              },
            },
          }),
        ],
      },
    })

    expect(wrapper.text()).toContain('Editado por carlos')
  })
})
