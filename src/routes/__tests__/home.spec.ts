import { TypedMockChow, createServer } from '../../test-utils'
import homeRoute from '../home'

let chow: TypedMockChow

beforeEach(() => {
  chow = createServer()
  homeRoute(chow)
})

describe('GET /', () => {
  it('should return basic information', async () => {
    const response = await chow.http('get', '/')

    expect(response).toEqual({
      message: expect.any(String),
      pkg: {
        name: expect.any(String),
        version: expect.any(String),
      },
    })
  })
})
