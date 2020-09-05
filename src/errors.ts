import { HttpMessage } from '@robb_j/chowchow'

export class BadAuth extends HttpMessage {
  constructor() {
    super(401, 'Bad authentication')
  }
}

export class BadRequest extends HttpMessage {
  constructor() {
    super(400, 'Bad request')
  }
}
