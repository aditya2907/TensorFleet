# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install protoc and Go plugins
RUN apk add --no-cache protobuf-dev git
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.31.0
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0

# Copy proto files first
COPY proto/ ./proto/

# Generate proto files for orchestrator
RUN mkdir -p orchestrator/proto/orchestrator orchestrator/proto/worker && \
    protoc --proto_path=proto \
    --go_out=orchestrator/proto/orchestrator --go_opt=paths=source_relative \
    --go-grpc_out=orchestrator/proto/orchestrator --go-grpc_opt=paths=source_relative \
    proto/orchestrator.proto && \
    protoc --proto_path=proto \
    --go_out=orchestrator/proto/worker --go_opt=paths=source_relative \
    --go-grpc_out=orchestrator/proto/worker --go-grpc_opt=paths=source_relative \
    proto/worker.proto

# Copy go mod files
COPY orchestrator/go.mod orchestrator/go.sum* ./orchestrator/
WORKDIR /app/orchestrator
RUN go mod download || true

# Copy source code
COPY orchestrator/ ./

RUN go mod tidy || true
RUN CGO_ENABLED=0 GOOS=linux go build -o orchestrator .

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/orchestrator/orchestrator .

EXPOSE 50051

CMD ["./orchestrator"]
