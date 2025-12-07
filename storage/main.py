from flask import Flask, request, jsonify, send_file
from minio import Minio
from minio.error import S3Error
import os
import logging
from io import BytesIO

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MinIO Configuration
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', 'minio:9000')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'minioadmin')
MINIO_SECURE = os.getenv('MINIO_SECURE', 'false').lower() == 'true'

# Initialize MinIO client
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)

# Ensure buckets exist
BUCKETS = ['models', 'datasets', 'checkpoints', 'artifacts']

def ensure_buckets():
    """Ensure all required buckets exist"""
    for bucket in BUCKETS:
        try:
            if not minio_client.bucket_exists(bucket):
                minio_client.make_bucket(bucket)
                logger.info(f"Created bucket: {bucket}")
            else:
                logger.info(f"Bucket already exists: {bucket}")
        except S3Error as e:
            logger.error(f"Error creating bucket {bucket}: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'storage'}), 200

@app.route('/api/v1/upload/<bucket>/<path:object_name>', methods=['POST'])
def upload_file(bucket, object_name):
    """Upload a file to MinIO"""
    if bucket not in BUCKETS:
        return jsonify({'error': f'Invalid bucket: {bucket}'}), 400

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    try:
        # Read file data
        file_data = file.read()
        file_size = len(file_data)
        
        # Upload to MinIO
        minio_client.put_object(
            bucket,
            object_name,
            BytesIO(file_data),
            file_size
        )

        logger.info(f"Uploaded {object_name} to bucket {bucket} ({file_size} bytes)")
        
        return jsonify({
            'message': 'File uploaded successfully',
            'bucket': bucket,
            'object_name': object_name,
            'size': file_size
        }), 201

    except S3Error as e:
        logger.error(f"Error uploading file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/download/<bucket>/<path:object_name>', methods=['GET'])
def download_file(bucket, object_name):
    """Download a file from MinIO"""
    if bucket not in BUCKETS:
        return jsonify({'error': f'Invalid bucket: {bucket}'}), 400

    try:
        response = minio_client.get_object(bucket, object_name)
        
        # Read data
        data = response.read()
        response.close()
        response.release_conn()

        logger.info(f"Downloaded {object_name} from bucket {bucket}")
        
        return send_file(
            BytesIO(data),
            as_attachment=True,
            download_name=object_name.split('/')[-1]
        )

    except S3Error as e:
        logger.error(f"Error downloading file: {e}")
        return jsonify({'error': str(e)}), 404

@app.route('/api/v1/list/<bucket>', methods=['GET'])
def list_objects(bucket):
    """List all objects in a bucket"""
    if bucket not in BUCKETS:
        return jsonify({'error': f'Invalid bucket: {bucket}'}), 400

    try:
        objects = minio_client.list_objects(bucket, recursive=True)
        object_list = []
        
        for obj in objects:
            object_list.append({
                'name': obj.object_name,
                'size': obj.size,
                'last_modified': obj.last_modified.isoformat() if obj.last_modified else None
            })

        return jsonify({
            'bucket': bucket,
            'objects': object_list,
            'count': len(object_list)
        }), 200

    except S3Error as e:
        logger.error(f"Error listing objects: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/delete/<bucket>/<path:object_name>', methods=['DELETE'])
def delete_file(bucket, object_name):
    """Delete a file from MinIO"""
    if bucket not in BUCKETS:
        return jsonify({'error': f'Invalid bucket: {bucket}'}), 400

    try:
        minio_client.remove_object(bucket, object_name)
        logger.info(f"Deleted {object_name} from bucket {bucket}")
        
        return jsonify({
            'message': 'File deleted successfully',
            'bucket': bucket,
            'object_name': object_name
        }), 200

    except S3Error as e:
        logger.error(f"Error deleting file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/buckets', methods=['GET'])
def list_buckets():
    """List all available buckets"""
    return jsonify({
        'buckets': BUCKETS
    }), 200

if __name__ == '__main__':
    ensure_buckets()
    port = int(os.getenv('PORT', 8081))
    logger.info(f"Starting storage service on port {port}")
    app.run(host='0.0.0.0', port=port)
