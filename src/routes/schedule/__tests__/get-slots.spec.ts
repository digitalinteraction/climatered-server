import {
  TypedMockChow,
  createServer,
  createSlot,
  mocked,
} from '../../../test-utils'
import getSlotsRoute from '../get-slots'

let chow: TypedMockChow
let fakeSlots = [
  createSlot('001', 12),
  createSlot('002', 13),
  createSlot('003', 14),
]

beforeEach(() => {
  chow = createServer()
  getSlotsRoute(chow)

  mocked(chow.schedule.getSlots).mockResolvedValue(fakeSlots)
})

describe('GET /schedule/slots', () => {
  it('should return the available slots', async () => {
    const res = await chow.http('get', '/schedule/slots')

    expect(res.slots).toEqual(fakeSlots)
  })
})
