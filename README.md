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

### 1 - Traffic
Request rate per second for /users endpoint
rate(http_server_duration_count{http_route="/users"}[5m])

Request rate by endpoint
sum(rate(http_server_duration_count[5m])) by (http_route)

### 2 - Latency
Average response time for /users
rate(http_server_duration_sum{http_route="/users"}[5m]) / rate(http_server_duration_count{http_route="/users"}[5m])

95th percentile response time
histogram_quantile(0.95, rate(http_server_duration_bucket{http_route="/users"}[5m]))

### 3 - Errors
Error rate for /users endpoint
(
  sum(rate(http_server_duration_count{http_route="/users",http_status_code=~"[45].."}[5m])) / 
  sum(rate(http_server_duration_count{http_route="/users"}[5m]))
) * 100

### 4 - Saturation
# Total requests to /users
sum(http_server_duration_count{http_route="/users"})

# Request rate by status code
sum(rate(http_server_duration_count{http_route="/users"}[5m])) by (http_status_code)


# Demo

## Step 1 - Autoconfig

- Fire requests
- Check Jaeger
- Check logs (traceId and spanId)

## Step 2 - Delayed Query (bug)

- Add metrics endpoint using prom-client
- Configure 4 golden signs on Prometheus
- Check prometheus data
- Look into traces
- Look into logs
- Find issue
