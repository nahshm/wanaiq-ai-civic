from flask import Blueprint, request, jsonify, g
from database.models import User, Community, Post, PostMedia
import json
import uuid
import os
from werkzeug.utils import secure_filename
from datetime import datetime, timezone

posts_bp = Blueprint('posts', __name__)

def get_db():
    """Get database instance to avoid circular imports"""
    from main import db
    return db

# Configure upload settings
UPLOAD_FOLDER = 'uploads/posts'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'mp3', 'wav'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_type(filename):
    ext = filename.rsplit('.', 1)[1].lower()
    if ext in ['png', 'jpg', 'jpeg', 'gif']:
        return 'image'
    elif ext in ['mp4', 'mov', 'avi']:
        return 'video'
    elif ext in ['mp3', 'wav']:
        return 'audio'
    else:
        return 'file'

@posts_bp.route('/create', methods=['POST'])
def create_post():
    try:
        db = get_db()

        # Parse postData JSON
        post_data_str = request.form.get('postData')
        if not post_data_str:
            return jsonify({'error': 'Missing postData'}), 400

        post_data = json.loads(post_data_str)

        # Extract fields
        title = post_data.get('title')
        content = post_data.get('content')
        content_type = post_data.get('contentType', 'text')
        link_url = post_data.get('linkUrl')
        poll_options = post_data.get('pollOptions')
        # Serialize poll_options to JSON string if it's a list
        if isinstance(poll_options, list):
            poll_options = json.dumps(poll_options)
        tags = post_data.get('tags', [])
        flair = post_data.get('flair')
        user_id = post_data.get('userId')
        community_id = post_data.get('communityId')

        # Validate required fields
        if not title or not user_id:
            return jsonify({'error': 'Missing required fields: title and userId'}), 400

        # Validate user exists
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Handle communityId logic
        actual_community_id = None
        if community_id:
            if community_id.startswith('user:'):
                # This is a user profile post, community_id remains None
                pass
            else:
                # Check if community exists
                community = Community.query.filter_by(id=community_id).first()
                if not community:
                    return jsonify({'error': 'Invalid community ID'}), 400
                actual_community_id = community_id

        # Generate post ID
        post_id = str(uuid.uuid4())

        # Create post
        post = Post(
            id=post_id,
            title=title,
            content=content,
            author_id=user_id,
            community_id=actual_community_id,
            content_type=content_type,
            link_url=link_url,
            poll_options=poll_options,
            tags=tags,
            flair=flair,
            created_at=datetime.now(timezone.utc)
        )

        db.session.add(post)
        db.session.flush()  # Get post.id for media files

        # Handle media files
        media_files = request.files.getlist('media')
        if media_files:
            # Ensure upload directory exists
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)

            for file in media_files:
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    # Generate unique filename
                    unique_filename = f"{uuid.uuid4()}_{filename}"
                    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

                    # Save file
                    file.save(file_path)

                    # Create PostMedia record
                    media = PostMedia(
                        post_id=post.id,
                        filename=filename,
                        file_path=file_path,
                        file_type=get_file_type(filename),
                        file_size=os.path.getsize(file_path),
                        uploaded_at=datetime.now(timezone.utc)
                    )
                    db.session.add(media)

        # Commit all changes
        db.session.commit()

        return jsonify({
            'success': True,
            'post': post.to_dict(),
            'message': 'Post created successfully'
        }), 201

    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid JSON in postData'}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Error creating post: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@posts_bp.route('/', methods=['GET'])
def get_posts():
    """Get all posts with optional filtering"""
    try:
        db = get_db()

        # Get query parameters
        community_id = request.args.get('communityId')
        user_id = request.args.get('userId')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))

        # Build query
        query = Post.query

        if community_id:
            query = query.filter_by(community_id=community_id)
        elif user_id:
            query = query.filter_by(author_id=user_id)

        # Order by creation date (newest first)
        query = query.order_by(Post.created_at.desc())

        # Apply pagination
        posts = query.offset(offset).limit(limit).all()

        # Convert to dict format
        posts_data = [post.to_dict() for post in posts]

        return jsonify({
            'success': True,
            'posts': posts_data,
            'count': len(posts_data)
        }), 200

    except Exception as e:
        print(f"Error retrieving posts: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@posts_bp.route('/<post_id>', methods=['GET'])
def get_post(post_id):
    """Get a specific post by ID"""
    try:
        db = get_db()

        post = Post.query.filter_by(id=post_id).first()
        if not post:
            return jsonify({'error': 'Post not found'}), 404

        return jsonify({
            'success': True,
            'post': post.to_dict()
        }), 200

    except Exception as e:
        print(f"Error retrieving post: {e}")
        return jsonify({'error': 'Internal server error'}), 500
