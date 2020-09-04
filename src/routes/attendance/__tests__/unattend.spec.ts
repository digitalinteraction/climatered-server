import route from '../unattend'
import {
  createServer,
  createAuthToken,
  mocked,
  createRegistration,
} from '../../../test-utils'
import { chown } from 'fs'

//
// Experimental format like ./attend.spec.ts
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

describe('POST /unattend/:session', () => {
  it('should return an "ok"', async () => {
    const { chow } = setup()

    const res = await chow.http('post', '/unattend/002')

    expect(res).toEqual('ok')
  })

  it('should return an "ok"', async () => {
    const { chow, reg } = setup()

    await chow.http('post', '/unattend/002')

    expect(chow.users.unattend).toBeCalledWith(reg.id, '002')
  })
})
