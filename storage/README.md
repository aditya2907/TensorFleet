# 💾 Storage Service

The Storage Service provides scalable, S3-compatible object storage for TensorFleet, handling datasets, models, checkpoints, and artifacts with comprehensive file management, metadata tracking, and integration with MinIO backend storage.

## 🚀 Overview

This service acts as the centralized storage layer for all TensorFleet assets, providing RESTful APIs for file operations, bucket management, and storage analytics. It supports both local file storage and distributed MinIO deployments with automatic failover and redundancy.

## 🏗️ Architecture

```
┌─────────────────┐     REST API     ┌─────────────────┐     S3 API      ┌─────────────────┐
│   TensorFleet   │◄────────────────►│  Storage Service│◄───────────────►│  MinIO Cluster  │
│   Services      │  Upload/Download │  (Flask/Python) │  Object Storage │  (S3 Compatible)│
└─────────────────┘                  └─────────────────┘                 └─────────────────┘
                                             │
                                             ▼ Metadata
                                     ┌─────────────────┐
                                     │   File Index    │
                                     │   (SQLite/JSON) │
                                     └─────────────────┘
```

## 🔌 Key Features

- **S3-Compatible Storage**: Full MinIO integration with bucket management
- **File Lifecycle Management**: Automated cleanup, archiving, and retention policies
- **Metadata Tracking**: Comprehensive file metadata, versioning, and tagging
- **Multi-format Support**: Datasets (CSV, JSON), models (pkl, h5), checkpoints
- **Access Control**: Secure file access with authentication and permissions
- **Storage Analytics**: Usage metrics, capacity monitoring, and performance insights
- **Batch Operations**: Bulk upload/download with progress tracking
- **Data Integrity**: Checksums, validation, and corruption detection

## � API Endpoints

### File Operations
- `POST /api/v1/files/upload` - Upload single or multiple files
- `GET /api/v1/files/download/{file_id}` - Download file by ID
- `GET /api/v1/files/{file_id}` - Get file metadata
- `DELETE /api/v1/files/{file_id}` - Delete file
- `PUT /api/v1/files/{file_id}` - Update file metadata

### Bucket Management
- `GET /api/v1/buckets` - List all buckets
- `POST /api/v1/buckets` - Create new bucket
- `GET /api/v1/buckets/{name}/files` - List files in bucket
- `DELETE /api/v1/buckets/{name}` - Delete bucket

### Storage Analytics
- `GET /api/v1/storage/stats` - Storage usage statistics
- `GET /api/v1/storage/health` - Storage system health
- `GET /api/v1/storage/metrics` - Detailed storage metrics

### Legacy MinIO Endpoints
- `GET /health` - Service health check
- `POST /upload` - Legacy file upload
- `GET /download/{filename}` - Legacy file download

## �️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `8083` |
| `MINIO_ENDPOINT` | MinIO server endpoint | `minio:9000` |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO secret key | `minioadmin` |
| `MINIO_SECURE` | Use HTTPS for MinIO | `false` |
| `STORAGE_TYPE` | Storage backend type | `minio` |
| `DEFAULT_BUCKET` | Default storage bucket | `tensorfleet` |
| `MAX_FILE_SIZE` | Maximum file size | `100MB` |
| `RETENTION_DAYS` | File retention period | `30` |

### Example Configuration

```bash
export PORT=8083
export MINIO_ENDPOINT=minio:9000
export MINIO_ACCESS_KEY=tensorfleet-access
export MINIO_SECRET_KEY=tensorfleet-secret-key
export MINIO_SECURE=false
export DEFAULT_BUCKET=tensorfleet-data
export MAX_FILE_SIZE=1GB
export RETENTION_DAYS=90
```

## 🚀 Running the Service

### Using Docker (Recommended)

```bash
# Build and run with docker-compose (includes MinIO)
docker-compose up storage minio

# Or build separately
docker build -t tensorfleet-storage .
docker run -p 8083:8083 \
  -e MINIO_ENDPOINT=minio:9000 \
  -e MINIO_ACCESS_KEY=minioadmin \
  tensorfleet-storage
```

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start MinIO (if not using Docker)
# Download from https://min.io/download
minio server /data --console-address ":9001"

# Run the service
python main.py
│   │   └── model_v2.pkl
│   └── user2/
├── datasets/
│   ├── mnist/
│   ├── cifar10/
│   └── custom_dataset.csv
├── checkpoints/
│   └── job_123/
│       ├── epoch_1.ckpt
│       └── epoch_5.ckpt
├── artifacts/
│   └── training_logs/
└── jobs/
    ├── job_123/
    └── job_456/
```

## 📚 API Endpoints

### File Upload

**POST /api/v1/upload** - Upload file to bucket
```bash
curl -X POST http://localhost:8081/api/v1/upload \
  -F "file=@model.pkl" \
  -F "bucket=models" \
  -F "key=user1/model_v1.pkl"
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully", 
  "bucket": "models",
  "key": "user1/model_v1.pkl",
  "size": 1048576,
  "etag": "d41d8cd98f00b204e9800998ecf8427e"
}
```

### File Download

**GET /api/v1/download/{bucket}/{key}** - Download file
```bash
# Download file
curl -O "http://localhost:8081/api/v1/download/models/user1/model_v1.pkl"

# Get file info (HEAD request)
curl -I "http://localhost:8081/api/v1/download/models/user1/model_v1.pkl"
```

**Response Headers:**
```
Content-Type: application/octet-stream
Content-Length: 1048576
Content-Disposition: attachment; filename="model_v1.pkl"
ETag: "d41d8cd98f00b204e9800998ecf8427e"
```

### File Listing

**GET /api/v1/list/{bucket}** - List files in bucket
```bash
curl "http://localhost:8081/api/v1/list/models?prefix=user1/&limit=10"
```

**Response:**
```json
{
  "bucket": "models",
  "prefix": "user1/",
  "objects": [
    {
      "key": "user1/model_v1.pkl",
      "size": 1048576,
      "last_modified": "2024-01-01T12:00:00Z",
      "etag": "d41d8cd98f00b204e9800998ecf8427e",
      "content_type": "application/octet-stream"
    }
  ],
  "truncated": false,
  "next_marker": ""
}
```

### File Management

**DELETE /api/v1/delete/{bucket}/{key}** - Delete file
```json
{
  "success": true,
  "message": "File deleted successfully",
  "bucket": "models", 
  "key": "user1/model_v1.pkl"
}
```

**GET /api/v1/buckets** - List all buckets
```json
{
  "buckets": [
    {
      "name": "models",
      "creation_date": "2024-01-01T10:00:00Z",
      "objects": 156,
      "size": "2.3 GB"
    }
  ]
}
```

### Storage Statistics

**GET /api/v1/stats** - Get storage statistics
```json
{
  "total_buckets": 5,
  "total_objects": 1250,
  "total_size": "15.7 GB",
  "buckets": {
    "models": {
      "objects": 156,
      "size": "2.3 GB"
    },
    "datasets": {
      "objects": 45,
      "size": "8.4 GB"
    }
  },
  "storage_usage": {
    "used_space": "15.7 GB",
    "free_space": "84.3 GB",
    "usage_percentage": 15.7
  }
}
```

### Health & Monitoring

**GET /health** - Service health check
```json
{
  "status": "healthy",
  "service": "storage",
  "minio_connected": true,
  "buckets_available": 5,
  "total_objects": 1250,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🗄️ Storage Manager

### Abstracted Storage Interface

```python
class StorageManager:
    """Unified storage interface supporting multiple backends"""
    
    def __init__(self, backend='minio'):
        if backend == 'minio':
            self.client = MinioStorageClient()
        elif backend == 'aws_s3':
            self.client = S3StorageClient()
        elif backend == 'gcs':
            self.client = GCSStorageClient()
    
    def upload_file(self, bucket, key, file_data):
        """Upload file to storage backend"""
        return self.client.upload(bucket, key, file_data)
    
    def download_file(self, bucket, key):
        """Download file from storage backend"""
        return self.client.download(bucket, key)
```

### MinIO Integration

```python
class MinioStorageClient:
    """MinIO-specific storage client"""
    
    def __init__(self):
        self.client = Minio(
            endpoint=os.getenv('MINIO_ENDPOINT', 'minio:9000'),
            access_key=os.getenv('MINIO_ACCESS_KEY', 'minioadmin'),
            secret_key=os.getenv('MINIO_SECRET_KEY', 'minioadmin'),
            secure=os.getenv('MINIO_SECURE', 'false').lower() == 'true'
        )
        self._ensure_buckets()
    
    def upload(self, bucket, key, file_data):
        """Upload file to MinIO"""
        try:
            result = self.client.put_object(
                bucket_name=bucket,
                object_name=key,
                data=file_data,
                length=len(file_data)
            )
            return {
                'success': True,
                'etag': result.etag,
                'bucket': bucket,
                'key': key
            }
        except S3Error as e:
            raise StorageError(f"Upload failed: {e}")
```

## 📊 File Operations

### Streaming Uploads

```python
@app.route('/api/v1/upload/stream', methods=['POST'])
def stream_upload():
    """Handle large file uploads with streaming"""
    bucket = request.form.get('bucket')
    key = request.form.get('key')
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    try:
        # Stream upload to MinIO
        result = minio_client.put_object(
            bucket_name=bucket,
            object_name=key,
            data=file.stream,
            length=-1,  # Unknown length for streaming
            part_size=10*1024*1024  # 10MB chunks
        )
        
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'etag': result.etag
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

### Streaming Downloads

```python
@app.route('/api/v1/download/<bucket>/<path:key>')
def stream_download(bucket, key):
    """Stream large file downloads"""
    try:
        # Get object from MinIO
        response = minio_client.get_object(bucket, key)
        
        def generate():
            """Stream file in chunks"""
            try:
                while True:
                    chunk = response.read(8192)  # 8KB chunks
                    if not chunk:
                        break
                    yield chunk
            finally:
                response.close()
                response.release_conn()
        
        return Response(
            generate(),
            mimetype='application/octet-stream',
            headers={
                'Content-Disposition': f'attachment; filename="{os.path.basename(key)}"'
            }
        )
    except S3Error as e:
        return jsonify({'error': str(e)}), 404
```

## 🧪 Testing

### Unit Tests
```bash
# Run tests
python -m pytest tests/

# Test with coverage
python -m pytest --cov=storage tests/
```

### API Testing
```bash
# Test health endpoint
curl http://localhost:8081/health

# Test bucket listing
curl http://localhost:8081/api/v1/buckets

# Test file upload
curl -X POST http://localhost:8081/api/v1/upload \
  -F "file=@test.txt" \
  -F "bucket=models" \
  -F "key=test/test.txt"

# Test file download
curl -O "http://localhost:8081/api/v1/download/models/test/test.txt"
```

### MinIO Testing
```bash
# Test MinIO connectivity
mc alias set local http://localhost:9000 minioadmin minioadmin

# List buckets
mc ls local

# Upload test file
echo "test" | mc pipe local/models/test.txt
```

## 🔗 Dependencies

### Python Packages

```txt
Flask==2.3.3
Flask-CORS==4.0.0
minio==7.1.17
```

### External Services

- **MinIO**: Object storage backend
- **API Gateway**: Routes storage requests
- **ML Workers**: Store/retrieve models and datasets
- **Frontend**: File upload/download operations

## 🛠️ Development

### Project Structure

```
storage/
├── main.py              # Flask application and API endpoints (488 lines)
├── storage_manager.py   # Storage abstraction layer
├── requirements.txt     # Python dependencies
├── Dockerfile          # Container configuration
└── tests/              # Unit tests (optional)
    ├── test_api.py
    ├── test_storage.py
    └── conftest.py
```

### Development Setup

```bash
# Start MinIO server (local development)
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# Install dependencies
pip install -r requirements.txt

# Run storage service
python main.py
```

## 🐛 Troubleshooting

### Common Issues

1. **MinIO Connection Failed**
   ```bash
   # Test MinIO connectivity
   curl http://localhost:9000/minio/health/live
   ```

2. **Bucket Access Denied**
   ```bash
   # Check MinIO credentials
   mc admin info local
   ```

3. **Large File Upload Failures**
   ```python
   # Increase upload timeout
   app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB
   ```

4. **Storage Space Issues**
   ```bash
   # Check disk usage
   df -h /data
   ```

### Debug Mode

```python
# Enable Flask debug mode
app.debug = True

# Enable MinIO debug logging
import logging
logging.getLogger('urllib3').setLevel(logging.DEBUG)
```

## 🔒 Security

### Access Control

```python
# Add authentication to sensitive endpoints
@app.before_request
def require_auth():
    protected_paths = ['/api/v1/upload', '/api/v1/delete']
    if request.path in protected_paths:
        token = request.headers.get('Authorization')
        if not validate_token(token):
            return jsonify({'error': 'Unauthorized'}), 401
```

### File Validation

```python
def validate_file_upload(file, bucket):
    """Validate file uploads"""
    # Check file size
    if file.content_length > MAX_FILE_SIZE:
        raise ValidationError("File too large")
    
    # Check file type
    allowed_types = {
        'models': ['.pkl', '.h5', '.pt'],
        'datasets': ['.csv', '.json', '.parquet']
    }
    
    if bucket in allowed_types:
        ext = os.path.splitext(file.filename)[1]
        if ext not in allowed_types[bucket]:
            raise ValidationError(f"File type {ext} not allowed for bucket {bucket}")
```

## 📈 Performance Optimization

### Caching Strategy

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_bucket_stats(bucket_name):
    """Cache bucket statistics for better performance"""
    return calculate_bucket_stats(bucket_name)
```

### Connection Pooling

```python
# MinIO client with connection pooling
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE,
    http_client=urllib3.PoolManager(
        timeout=urllib3.Timeout(connect=5, read=10),
        maxsize=10,
        retries=urllib3.Retry(
            total=3,
            backoff_factor=0.2,
            status_forcelist=[500, 502, 503, 504]
        )
    )
)
```

## 📊 Monitoring & Analytics

### Storage Metrics

```python
# Prometheus metrics for storage service
from prometheus_client import Counter, Gauge, Histogram

upload_counter = Counter('storage_uploads_total', 'Total file uploads', ['bucket'])
download_counter = Counter('storage_downloads_total', 'Total file downloads', ['bucket'])
storage_usage = Gauge('storage_usage_bytes', 'Storage usage in bytes', ['bucket'])
operation_duration = Histogram('storage_operation_seconds', 'Storage operation duration', ['operation'])
```

### Health Monitoring

```python
@app.route('/api/v1/health/detailed')
def detailed_health():
    """Comprehensive health check"""
    health = {
        'service': 'storage',
        'status': 'healthy',
        'checks': {
            'minio_connection': check_minio_connection(),
            'bucket_access': check_bucket_access(),
            'disk_space': check_disk_space(),
            'response_time': measure_response_time()
        }
    }
    
    # Determine overall status
    if any(check == 'unhealthy' for check in health['checks'].values()):
        health['status'] = 'unhealthy'
    
    return jsonify(health)
```

## 🔄 Related Services

- [API Gateway](../api-gateway/README.md) - Routes storage requests and handles authentication
- [Worker](../worker/README.md) - Stores and retrieves models, datasets, and checkpoints
- [Model Service](../model-service/README.md) - Manages trained model artifacts
- [Monitoring](../monitoring/README.md) - Collects storage metrics and health data

## 🚀 Future Enhancements

- **Multi-region replication**: Automatic data replication across regions
- **Advanced versioning**: Git-like versioning for models and datasets
- **Data encryption**: At-rest and in-transit encryption
- **Content delivery**: CDN integration for faster downloads
- **Data lifecycle policies**: Automated archiving and cleanup
        if ext not in allowed_types[bucket]:
            raise ValidationError(f"File type {ext} not allowed in bucket {bucket}")
```

### Secure Storage

```python
# Enable MinIO TLS in production
minio_client = Minio(
    endpoint='storage.company.com',
    access_key=access_key,
    secret_key=secret_key,
    secure=True  # Enable HTTPS
)
```

## 📄 License

Part of the TensorFleet project - see root LICENSE file.
