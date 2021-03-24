import { TypedChow } from '../server'

import { HttpResponse } from '@robb_j/chowchow'

export default function postcard(chow: TypedChow) {
  //
  // GET /postcard
  //
  chow.route('get', '/postcard', async (ctx) => {
    const body = `
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solferino Air | Postcard</title>
    <meta content="Solferino Air | Postcard" property="og:title" />
    <meta content="website" property="og:type" />
    <meta content="https://solferinoair.com/postcard.jpg" property="og:image" />
    <meta content="https://solferinoair.com/api/postcard" property="og:url" />
    <meta content="summary" name="twitter:card" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body style="background: #111111;">
    <img src="https://solferinoair.com/postcard.jpg" style="display: block;  height: 500px; width: auto; margin: 50px auto;" />
    <a href="https://solferinoair.com/" target="_self" style="background-color: #F20262; border-radius: 6px; color: white; display: block; margin: 0 auto; padding: 10px 20px; text-align: center; text-decoration: none; width: 200px;">Join the Tour</a>
  </body>
  </html>
`

    return new HttpResponse(200, body, {
      'content-type': 'text/html; charset=UTF-8',
    })
  })
}
