import route from '../attend'
import {
  createServer,
  createAuthToken,
  mocked,
  createRegistration,
} from '../../../test-utils'

//
// Experimenting with a different style of unit test setup
// -> Manually call setup in test and destructure return value
//

function setup() {
  const chow = createServer()
  const attendee = createAuthToken(['attendee'])
  const reg = createRegistration()
  route(chow)

  mocked(chow.auth.fromRequest).mockResolvedValue(attendee)
  mocked(chow.users.getRegistration).mockResolvedValue(reg)

  return { chow, attendee, reg }
}

describe('POST /attend/:session', () => {
  it('should return an "ok"', async () => {
    const { chow } = setup()

    const res = await chow.http('post', '/attend/002')

    expect(res).toEqual('ok')
  })

  it('should record the attendance', async () => {
    const { chow, reg } = setup()

    await chow.http('post', '/attend/002')

    expect(chow.users.attend).toBeCalledWith(reg.id, '002')
  })
})
