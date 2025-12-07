#!/bin/bash

# Generate gRPC stubs for Go services

echo "Generating gRPC stubs..."

# Install protoc-gen-go if not already installed
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Generate Go code for gateway
protoc --go_out=../api-gateway --go_opt=paths=source_relative \
    --go-grpc_out=../api-gateway --go-grpc_opt=paths=source_relative \
    gateway.proto

# Generate Go code for orchestrator
protoc --go_out=../orchestrator --go_opt=paths=source_relative \
    --go-grpc_out=../orchestrator --go-grpc_opt=paths=source_relative \
    orchestrator.proto

# Generate Go code for worker
protoc --go_out=../worker --go_opt=paths=source_relative \
    --go-grpc_out=../worker --go-grpc_opt=paths=source_relative \
    worker.proto

echo "✓ gRPC stubs generated successfully"
