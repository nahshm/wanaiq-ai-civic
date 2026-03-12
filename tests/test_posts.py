import pytest
import json
import uuid
import sys
import os
from io import BytesIO
from flask import Flask
from werkzeug.test import Client
from werkzeug.datastructures import FileStorage

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from main import app, db
from database.models import User, Community, Post, PostMedia, Comment

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

@pytest.fixture
def test_user():
    user = User(
        id=str(uuid.uuid4()),
        username='testuser',
        display_name='Test User',
        role='citizen'
    )
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def test_community():
    community = Community(
        id=str(uuid.uuid4()),
        name='testcommunity',
        display_name='Test Community',
        description='A test community',
        category='discussion'
    )
    db.session.add(community)
    db.session.commit()
    return community

def test_create_post_text_only(client, test_user, test_community):
    """Test creating a text-only post"""
    post_data = {
        'userId': test_user.id,
        'communityId': test_community.id,
        'title': 'Test Post Title',
        'content': 'This is a test post content',
        'contentType': 'text',
        'tags': ['test', 'post']
    }

    data = {'postData': json.dumps(post_data)}
    response = client.post('/api/posts/create', data=data)

    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert 'post' in response_data
    assert response_data['post']['title'] == 'Test Post Title'
    assert response_data['post']['content'] == 'This is a test post content'

def test_create_post_with_media(client, test_user, test_community):
    """Test creating a post with media files"""
    post_data = {
        'userId': test_user.id,
        'communityId': test_community.id,
        'title': 'Media Post Title',
        'contentType': 'media'
    }

    # Create a test file
    test_file = BytesIO(b'test image content')
    test_file.filename = 'test.jpg'

    # For Flask test client, pass both data and files in the data parameter
    data = {
        'postData': json.dumps(post_data),
        'media': (test_file, 'test.jpg')
    }

    response = client.post('/api/posts/create', data=data, content_type='multipart/form-data')

    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert 'post' in response_data
    assert len(response_data['post']['media_files']) == 1

def test_create_post_link(client, test_user, test_community):
    """Test creating a link post"""
    post_data = {
        'userId': test_user.id,
        'communityId': test_community.id,
        'title': 'Link Post Title',
        'contentType': 'link',
        'linkUrl': 'https://example.com'
    }

    data = {'postData': json.dumps(post_data)}
    response = client.post('/api/posts/create', data=data)

    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert response_data['post']['linkUrl'] == 'https://example.com'

def test_create_post_poll(client, test_user, test_community):
    """Test creating a poll post"""
    post_data = {
        'userId': test_user.id,
        'communityId': test_community.id,
        'title': 'Poll Post Title',
        'contentType': 'poll',
        'pollOptions': ['Option 1', 'Option 2', 'Option 3']
    }

    data = {'postData': json.dumps(post_data)}
    response = client.post('/api/posts/create', data=data)

    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert response_data['post']['pollOptions'] == ['Option 1', 'Option 2', 'Option 3']

def test_create_post_missing_required_fields(client):
    """Test creating a post with missing required fields"""
    post_data = {
        'title': 'Test Post'
        # Missing userId, contentType
    }

    data = {'postData': json.dumps(post_data)}
    response = client.post('/api/posts/create', data=data)

    assert response.status_code == 400
    response_data = json.loads(response.data)
    assert 'error' in response_data

def test_create_post_invalid_community(client, test_user):
    """Test creating a post with invalid community ID"""
    post_data = {
        'userId': test_user.id,
        'communityId': 'invalid-community-id',
        'title': 'Test Post Title',
        'content': 'Test content',
        'contentType': 'text'
    }

    data = {'postData': json.dumps(post_data)}
    response = client.post('/api/posts/create', data=data)

    assert response.status_code == 400
    response_data = json.loads(response.data)
    assert 'error' in response_data

def test_create_post_user_profile(client, test_user):
    """Test creating a post to user profile (no community)"""
    post_data = {
        'userId': test_user.id,
        'title': 'Profile Post Title',
        'content': 'This is a profile post',
        'contentType': 'text'
    }

    data = {'postData': json.dumps(post_data)}
    response = client.post('/api/posts/create', data=data)

    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert response_data['post']['community'] is None  # Should be a profile post

def test_get_posts(client, test_user, test_community):
    """Test retrieving posts"""
    # First create a post
    post_data = {
        'userId': test_user.id,
        'communityId': test_community.id,
        'title': 'Test Post for Retrieval',
        'content': 'Test content',
        'contentType': 'text'
    }

    data = {'postData': json.dumps(post_data)}
    client.post('/api/posts/create', data=data)

    # Then retrieve posts
    response = client.get('/api/posts/')

    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert 'posts' in response_data
    assert len(response_data['posts']) > 0

def test_get_post_by_id(client, test_user, test_community):
    """Test retrieving a specific post by ID"""
    # Create a post first
    post_data = {
        'userId': test_user.id,
        'communityId': test_community.id,
        'title': 'Specific Post',
        'content': 'Content for specific post',
        'contentType': 'text'
    }

    data = {'postData': json.dumps(post_data)}
    create_response = client.post('/api/posts/create', data=data)
    create_data = json.loads(create_response.data)
    post_id = create_data['post']['id']

    # Retrieve the specific post
    response = client.get(f'/api/posts/{post_id}')

    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert response_data['post']['id'] == post_id
    assert response_data['post']['title'] == 'Specific Post'
