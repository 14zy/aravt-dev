# Aravt API Guide

This document is a human-readable entry point to the Aravt API. It does not duplicate the complete endpoint reference. The OpenAPI schema is the source of truth for paths, methods, parameters, request bodies, and documented responses.

## API Reference

- [Interactive Swagger UI](https://backend.aravt.io/docs)
- [Live OpenAPI schema](https://backend.aravt.io/openapi.json)
- [Local OpenAPI snapshot](openapi.json)

The current local snapshot declares OpenAPI `3.1.0` and API version `0.1.0`.

## Base URLs

- Production: `https://backend.aravt.io`
- Local development default: `http://localhost:8001`

The frontend reads the base URL from `VITE_API_URL` and falls back to the local development URL.

## Authentication

The frontend obtains an access token from `POST /login/` and sends it on authenticated requests:

```http
Authorization: Bearer <access_token>
```

Login, registration, registration completion, and password-reset flows must be accessible before authentication. Consult the backend implementation when changing authorization rules because the current OpenAPI schema does not declare a security scheme or per-operation security requirements.

## Request Formats

Most request bodies use JSON:

```http
Content-Type: application/json
Accept: application/json
```

Avatar upload at `POST /users/user/{user_id}/avatar` uses `multipart/form-data` instead.

Use path names exactly as published in the OpenAPI schema, including trailing slashes where present.

## API Areas

The schema groups operations into these tags:

- **Auth** — registration, login, password reset, identity, and account linking
- **Users** — users, subscriptions, and skills
- **Aravts** — Aravts, membership applications, and invitations
- **Tasks** — tasks and completions
- **Offers** — offers
- **Logs** — operation logs
- **Admin** — administrative and service operations

Use Swagger UI or `docs/openapi.json` for the complete operation list and data models.

## Examples

### Log In

```bash
curl --request POST \
  --url https://backend.aravt.io/login/ \
  --header 'Content-Type: application/json' \
  --data '{"username":"example","password":"example"}'
```

### Get the Current User

```bash
curl --request GET \
  --url https://backend.aravt.io/who_am_i \
  --header 'Authorization: Bearer <access_token>'
```

### Apply to Join an Aravt

```bash
curl --request POST \
  --url https://backend.aravt.io/aravt/123/join \
  --header 'Authorization: Bearer <access_token>' \
  --header 'Content-Type: application/json' \
  --data '{"text":"I would like to join."}'
```

## Validation Errors

The OpenAPI schema documents FastAPI validation failures as HTTP `422` responses:

```typescript
type HTTPValidationError = {
  detail?: Array<{
    loc: Array<string | number>;
    msg: string;
    type: string;
  }>;
};
```

Other runtime error responses may occur even when they are not described in the current schema. Client code must handle non-successful HTTP statuses defensively.

## Refreshing the Local Schema

Refresh the snapshot whenever the backend contract changes:

```bash
curl -fsSL https://backend.aravt.io/openapi.json -o docs/openapi.json
jq empty docs/openapi.json
```

Review the resulting diff before committing it. Do not manually copy the full endpoint catalog into this file; update the backend OpenAPI definitions and refresh the snapshot instead.

## Current Schema Limitations

The published schema currently has several documentation gaps:

- It does not define an OpenAPI security scheme or identify protected operations.
- Several successful responses use an empty schema, so their response bodies are not machine-readable.
- It primarily documents `200` and `422` responses and does not comprehensively describe authentication, authorization, or server-error responses.

Treat these as backend documentation gaps rather than inventing contracts in this guide.
