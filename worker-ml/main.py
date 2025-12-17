#!/usr/bin/env python3
"""
TensorFleet ML Worker Node with MongoDB Integration
Handles ML training jobs with MongoDB dataset fetching and model persistence

Entry point for the ML Worker Service
"""

from config import get_logger
from worker_service import MLWorkerService

logger = get_logger(__name__)


def main():
    """Main entry point"""
    try:
        service = MLWorkerService()
        service.start()
    except Exception as e:
        logger.error(f"Failed to start ML Worker Service: {e}")
        raise


if __name__ == "__main__":
    main()
