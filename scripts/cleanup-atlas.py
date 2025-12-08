#!/usr/bin/env python3

"""
MongoDB Atlas Cleanup Script
Connects to MongoDB Atlas and drops all TensorFleet collections for a fresh start
"""

import os
from pymongo import MongoClient
from datetime import datetime

def cleanup_mongodb_atlas():
    """Clean all TensorFleet collections in MongoDB Atlas"""
    
    # Get MongoDB Atlas connection from environment
    mongodb_url = os.getenv('MONGODB_URL', 'mongodb+srv://aditya:N6dZepf9h6v8hSyQ@cluster0.poidcg0.mongodb.net')
    db_name = os.getenv('MONGODB_DB', 'tensorfleet')
    
    print(f"🗄️  Connecting to MongoDB Atlas...")
    
    try:
        # Connect to MongoDB Atlas
        client = MongoClient(mongodb_url)
        db = client[db_name]
        
        # Test connection
        db.admin.command('ping')
        print(f"✅ Connected to MongoDB Atlas database: {db_name}")
        
        # List current collections
        collections = db.list_collection_names()
        print(f"📋 Found {len(collections)} collections: {collections}")
        
        if not collections:
            print("🎉 Database is already clean!")
            return
        
        # Drop all TensorFleet collections
        collections_to_drop = ['models', 'datasets', 'checkpoints', 'artifacts', 'jobs']
        
        dropped_count = 0
        for collection_name in collections_to_drop:
            if collection_name in collections:
                # Get document count before dropping
                count = db[collection_name].count_documents({})
                db[collection_name].drop()
                print(f"🗑️  Dropped collection '{collection_name}' (had {count} documents)")
                dropped_count += 1
            else:
                print(f"⏭️  Collection '{collection_name}' doesn't exist, skipping")
        
        print(f"✅ MongoDB Atlas cleanup complete! Dropped {dropped_count} collections")
        
        # Verify cleanup
        remaining_collections = db.list_collection_names() 
        tensorfleet_collections = [c for c in remaining_collections if c in collections_to_drop]
        
        if tensorfleet_collections:
            print(f"⚠️  Warning: Some collections still exist: {tensorfleet_collections}")
        else:
            print("🎉 All TensorFleet collections successfully removed!")
            
    except Exception as e:
        print(f"❌ Error cleaning MongoDB Atlas: {e}")
        return False
    
    finally:
        client.close()
    
    return True

if __name__ == "__main__":
    print("🧹 MongoDB Atlas Cleanup Script")
    print("=" * 50)
    
    success = cleanup_mongodb_atlas()
    
    if success:
        print("\n✅ MongoDB Atlas is now clean and ready for fresh data!")
    else:
        print("\n❌ Atlas cleanup failed. Check your connection and credentials.")
        exit(1)
