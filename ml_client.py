#!/usr/bin/env python3
"""
TensorFleet ML Job Submission Client
Submits ML training jobs to the MongoDB-enabled TensorFleet platform
"""

import requests
import json
import time
import sys
from typing import Dict, Any

class MLJobClient:
    """Client for submitting ML training jobs"""
    
    def __init__(self, base_url: str = "http://localhost:8083"):
        self.base_url = base_url
        self.model_service_url = base_url
    
    def submit_training_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Submit a training job to the worker-ml service"""
        # For demonstration, we'll simulate job submission by directly calling the worker
        # In a real implementation, this would go through the API Gateway and Orchestrator
        
        worker_url = "http://localhost:8000"  # Direct to worker for demo
        
        try:
            response = requests.post(f"{worker_url}/train", json=job_data, timeout=300)
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
        except requests.exceptions.RequestException as e:
            return {"error": f"Request failed: {str(e)}"}
    
    def list_models(self, page: int = 1, limit: int = 10, algorithm: str = None) -> Dict[str, Any]:
        """List available models"""
        try:
            params = {"page": page, "limit": limit}
            if algorithm:
                params["algorithm"] = algorithm
                
            response = requests.get(f"{self.model_service_url}/api/v1/models", params=params)
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
        except requests.exceptions.RequestException as e:
            return {"error": f"Request failed: {str(e)}"}
    
    def get_model_metadata(self, model_id: str) -> Dict[str, Any]:
        """Get model metadata"""
        try:
            response = requests.get(f"{self.model_service_url}/api/v1/models/{model_id}")
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
        except requests.exceptions.RequestException as e:
            return {"error": f"Request failed: {str(e)}"}
    
    def download_model(self, model_id: str, output_path: str = None) -> bool:
        """Download a model"""
        try:
            response = requests.get(f"{self.model_service_url}/api/v1/models/{model_id}/download", stream=True)
            if response.status_code == 200:
                # Get filename from Content-Disposition header
                filename = "model.pkl"
                if 'Content-Disposition' in response.headers:
                    content_disp = response.headers['Content-Disposition']
                    if 'filename=' in content_disp:
                        filename = content_disp.split('filename=')[1].strip('"')
                
                if output_path:
                    filename = output_path
                
                with open(filename, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                print(f"Model downloaded to {filename}")
                return True
            else:
                print(f"Error downloading model: HTTP {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"Download failed: {str(e)}")
            return False
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get model statistics"""
        try:
            response = requests.get(f"{self.model_service_url}/api/v1/statistics")
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
        except requests.exceptions.RequestException as e:
            return {"error": f"Request failed: {str(e)}"}

def demo_training_jobs():
    """Demonstrate training different ML models"""
    client = MLJobClient()
    
    # Training job configurations
    training_jobs = [
        {
            "job_id": "rf_iris_001",
            "dataset_name": "iris",
            "algorithm": "random_forest",
            "target_column": "species",
            "model_name": "iris_random_forest",
            "hyperparameters": {
                "n_estimators": 100,
                "max_depth": 5,
                "random_state": 42
            }
        },
        {
            "job_id": "lr_iris_001", 
            "dataset_name": "iris",
            "algorithm": "logistic_regression",
            "target_column": "species",
            "model_name": "iris_logistic_regression",
            "hyperparameters": {
                "max_iter": 1000,
                "random_state": 42
            }
        },
        {
            "job_id": "svm_wine_001",
            "dataset_name": "wine", 
            "algorithm": "svm",
            "target_column": "wine_class",
            "model_name": "wine_svm_classifier",
            "hyperparameters": {
                "kernel": "rbf",
                "C": 1.0,
                "random_state": 42
            }
        }
    ]
    
    print("🚀 TensorFleet ML Training Demo")
    print("=" * 50)
    
    trained_models = []
    
    # Submit training jobs
    for i, job in enumerate(training_jobs, 1):
        print(f"\n📊 Training Job {i}/{len(training_jobs)}")
        print(f"Algorithm: {job['algorithm']}")
        print(f"Dataset: {job['dataset_name']}")
        print(f"Model: {job['model_name']}")
        
        print("Submitting job...")
        result = client.submit_training_job(job)
        
        if "error" in result:
            print(f"❌ Job failed: {result['error']}")
        else:
            print(f"✅ Job completed successfully!")
            print(f"   Model ID: {result.get('model_id')}")
            print(f"   Test Accuracy: {result.get('metrics', {}).get('test_accuracy', 'N/A'):.4f}")
            trained_models.append(result.get('model_id'))
        
        time.sleep(2)  # Brief pause between jobs
    
    print(f"\n📋 Summary: {len(trained_models)} models trained successfully")
    
    # List all models
    print("\n📚 Available Models:")
    models_list = client.list_models(limit=20)
    if "error" not in models_list:
        for model in models_list.get('models', []):
            print(f"   • {model['name']} ({model['algorithm']}) - {model.get('metrics', {}).get('test_accuracy', 'N/A'):.4f} accuracy")
    
    # Get statistics
    print("\n📈 Platform Statistics:")
    stats = client.get_statistics()
    if "error" not in stats:
        print(f"   Total Models: {stats.get('total_models', 0)}")
        for algo_stat in stats.get('algorithm_stats', []):
            print(f"   {algo_stat['_id']}: {algo_stat['count']} models, avg accuracy: {algo_stat.get('avg_accuracy', 0):.4f}")
    
    # Download a model
    if trained_models:
        print(f"\n💾 Downloading model: {trained_models[0]}")
        success = client.download_model(trained_models[0], f"downloaded_model_{trained_models[0]}.pkl")
        if success:
            print("✅ Model downloaded successfully!")
        else:
            print("❌ Model download failed!")
    
    print("\n🎉 Demo completed!")

def main():
    """Main function"""
    if len(sys.argv) > 1:
        command = sys.argv[1]
        client = MLJobClient()
        
        if command == "list":
            result = client.list_models()
            print(json.dumps(result, indent=2))
        elif command == "stats":
            result = client.get_statistics()
            print(json.dumps(result, indent=2))
        elif command == "download" and len(sys.argv) > 2:
            model_id = sys.argv[2]
            filename = sys.argv[3] if len(sys.argv) > 3 else None
            client.download_model(model_id, filename)
        elif command == "demo":
            demo_training_jobs()
        else:
            print("Usage: python ml_client.py [list|stats|download <model_id> [filename]|demo]")
    else:
        demo_training_jobs()

if __name__ == "__main__":
    main()
