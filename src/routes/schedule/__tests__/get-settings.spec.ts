import { TypedMockChow, createServer, mocked } from '../../../test-utils'
import getSettings from '../get-settings'
import { ConfigSettings } from '../../../structs'
import { HttpMessage } from '@robb_j/chowchow/dist'

let chow: TypedMockChow

const fakeSettings: ConfigSettings = {
  scheduleLive: true,
  enableHelpdesk: true,
  enableCoffeechat: true,
  conferenceIsOver: true,
}

beforeEach(() => {
  chow = createServer()
  getSettings(chow)
})

describe('GET /schedule/settings', () => {
  it('should return the schedule', async () => {
    mocked(chow.schedule.getSettings).mockResolvedValue(fakeSettings)

    const res = await chow.http('get', '/schedule/settings')

    expect(res.settings).toEqual(fakeSettings)
  })

  it("should fail if settings aren't loaded", async () => {
    mocked(chow.schedule.getSettings).mockResolvedValue(null)

    const res: HttpMessage = await chow.http('get', '/schedule/settings')

    expect(res).toBeInstanceOf(HttpMessage)
    expect(res.status).toEqual(400)
  })
})
