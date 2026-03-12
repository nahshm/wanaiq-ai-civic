#!/usr/bin/env python3
import os
import sys

# Set environment variable before importing anything
os.environ['BARAZA_ENABLED'] = 'false'

# Now import the app
sys.path.insert(0, 'src')
from main import app
import json

def test_baraza_disabled():
    """Test that Baraza API is disabled when BARAZA_ENABLED=false"""
    app.config['TESTING'] = True
    client = app.test_client()

    # Test health check to see if Baraza is disabled
    response = client.get('/health')
    health_data = json.loads(response.data.decode('utf-8'))
    print("Health check status:", response.status_code)
    print("Baraza module status:", health_data['components']['baraza_module'])

    # Try to access Baraza API - should return 404
    data = {'title': 'Test Space', 'description': 'Test', 'host_user_id': 'user123'}
    response = client.post('/api/baraza/create', json=data)
    print("Baraza create status:", response.status_code)
    if response.status_code == 404:
        print("✅ Baraza API correctly disabled")
    else:
        print("❌ Baraza API still accessible when disabled")

if __name__ == '__main__':
    test_baraza_disabled()
