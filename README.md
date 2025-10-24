# Requests

## No scope required
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

## Scopes required

### Read single user
curl -X GET http://localhost:3000/users/1 \
  -H "x-user-scopes: users:read"

### Read all users
curl -X GET http://localhost:3000/users \
  -H "x-user-scopes: users:read:all"

# Observability

## Jaeger

Jaeger UI at http://localhost:16686

API http://localhost:14268/api/traces

## Prometheus

Prometheus UI at http://localhost:9090
