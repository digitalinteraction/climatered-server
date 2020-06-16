# ifrc-vconf-api

Coming soon...

```bash
# Run the dev server
npm run dev serve
```

```bash
# Start email login
http :3000/login/email email==rob@andrsn.uk

# Extract token from email
TOKEN=...

http :3000/login/email/callback token==$TOKEN
```

**env vars**

- `SENDGRID_API_KEY`
- `SENDGRID_FROM`
- `JWT_SECRET`
- `SELF_URL`
- `WEB_URL`
- `CORS_HOSTS`
- `ENABLE_ACCESS_LOGS`
- `DEBUG=api*`

---

> This project was set up by [puggle](https://npm.im/puggle)
