# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install protoc and Go plugins
RUN apk add --no-cache protobuf-dev git
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.31.0
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0

# Copy proto files first
COPY proto/ ./proto/

# Generate proto files for api-gateway
RUN mkdir -p api-gateway/proto/gateway api-gateway/proto/orchestrator && \
    protoc --proto_path=proto \
    --go_out=api-gateway/proto/gateway --go_opt=paths=source_relative \
    --go-grpc_out=api-gateway/proto/gateway --go-grpc_opt=paths=source_relative \
    proto/gateway.proto && \
    protoc --proto_path=proto \
    --go_out=api-gateway/proto/orchestrator --go_opt=paths=source_relative \
    --go-grpc_out=api-gateway/proto/orchestrator --go-grpc_opt=paths=source_relative \
    proto/orchestrator.proto

# Copy go mod files
COPY api-gateway/go.mod api-gateway/go.sum* ./api-gateway/
WORKDIR /app/api-gateway
RUN go mod download || true

# Copy source code
COPY api-gateway/ ./

# Build the application
RUN go mod tidy || true
RUN CGO_ENABLED=0 GOOS=linux go build -o api-gateway .

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/api-gateway/api-gateway .

EXPOSE 8080

CMD ["./api-gateway"]
