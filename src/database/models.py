from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON, LargeBinary
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import json

# Import db from db.py to avoid multiple instances
from .db import db

Base = db.Model

# Existing models (keeping for compatibility)
class SensitiveReport(Base):
    __tablename__ = 'sensitive_reports'

    id = Column(Integer, primary_key=True)
    report_id = Column(String(64), unique=True, nullable=False)  # UUID for public reference
    encrypted_content = Column(LargeBinary, nullable=False)  # Encrypted report content
    content_hash = Column(String(128), nullable=False)  # SHA-256 hash for integrity
    risk_level = Column(Integer, nullable=False, default=1)  # 1-5 scale
    category = Column(String(50), nullable=False)  # corruption, human_rights, etc.
    status = Column(String(20), default='pending')  # pending, investigating, escalated, resolved
    anonymous_id = Column(String(128), nullable=True)  # Session-based anonymous tracking
    ip_hash = Column(String(128), nullable=True)  # Hashed IP for analytics
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    evidence_files = relationship("EvidenceFile", back_populates="report", cascade="all, delete-orphan")
    escalations = relationship("EscalationWorkflow", back_populates="report", cascade="all, delete-orphan")
    audit_logs = relationship("AdminAuditLog", back_populates="report", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'risk_level': self.risk_level,
            'category': self.category,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class EvidenceFile(Base):
    __tablename__ = 'evidence_files'

    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey('sensitive_reports.id'), nullable=False)
    filename = Column(String(255), nullable=False)
    encrypted_file = Column(LargeBinary, nullable=False)
    file_hash = Column(String(128), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    ipfs_hash = Column(String(128), nullable=True)  # IPFS hash for tamper-proof storage
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    report = relationship("SensitiveReport", back_populates="evidence_files")

class NGOPartner(Base):
    __tablename__ = 'ngo_partners'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    api_endpoint = Column(String(500), nullable=False)
    api_key_encrypted = Column(LargeBinary, nullable=False)
    tier = Column(Integer, nullable=False, default=1)  # 1=Human Rights, 2=Anti-Corruption, 3=Legal
    is_active = Column(Boolean, default=True)
    contact_email = Column(String(255))
    escalation_threshold = Column(Integer, default=3)  # Risk level threshold for escalation
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    escalations = relationship("EscalationWorkflow", back_populates="ngo", cascade="all, delete-orphan")

class EscalationWorkflow(Base):
    __tablename__ = 'escalation_workflows'

    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey('sensitive_reports.id'), nullable=False)
    ngo_id = Column(Integer, ForeignKey('ngo_partners.id'), nullable=False)
    status = Column(String(20), default='pending')  # pending, sent, acknowledged, resolved
    escalated_at = Column(DateTime, default=datetime.utcnow)
    response_received = Column(DateTime, nullable=True)
    ngo_response = Column(Text, nullable=True)

    # Relationships
    report = relationship("SensitiveReport", back_populates="escalations")
    ngo = relationship("NGOPartner", back_populates="escalations")

class AdminAuditLog(Base):
    __tablename__ = 'admin_audit_logs'

    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey('sensitive_reports.id'), nullable=False)
    admin_id = Column(Integer, nullable=False)  # Admin user ID
    action = Column(String(100), nullable=False)  # view, decrypt, escalate, etc.
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    report = relationship("SensitiveReport", back_populates="audit_logs")

class DecryptionAuditLog(Base):
    __tablename__ = 'decryption_audit_logs'

    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, nullable=False)
    admin_id = Column(Integer, nullable=False)
    decryption_reason = Column(String(255), nullable=False)
    decrypted_fields = Column(JSON, nullable=False)  # Which fields were decrypted
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class SystemHealth(Base):
    __tablename__ = 'system_health'

    id = Column(Integer, primary_key=True)
    component = Column(String(100), nullable=False)  # security_manager, encryption, etc.
    status = Column(String(20), default='healthy')  # healthy, warning, error
    last_check = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True)

# New Baraza Models

class BarazaSpace(Base):
    __tablename__ = 'baraza_spaces'

    id = Column(Integer, primary_key=True)
    space_id = Column(String(64), unique=True, nullable=False)  # UUID for public reference
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    host_user_id = Column(String(64), nullable=False)
    is_live = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    participants = relationship("BarazaParticipant", back_populates="space", cascade="all, delete-orphan")
    recordings = relationship("BarazaRecording", back_populates="space", cascade="all, delete-orphan")

class BarazaParticipant(Base):
    __tablename__ = 'baraza_participants'

    id = Column(Integer, primary_key=True)
    space_id = Column(Integer, ForeignKey('baraza_spaces.id'), nullable=False)
    user_id = Column(String(64), nullable=False)
    role = Column(String(20), nullable=False)  # host, speaker, listener
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime, nullable=True)

    space = relationship("BarazaSpace", back_populates="participants")

class BarazaRecording(Base):
    __tablename__ = 'baraza_recordings'

    id = Column(Integer, primary_key=True)
    space_id = Column(Integer, ForeignKey('baraza_spaces.id'), nullable=False)
    recording_url = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    space = relationship("BarazaSpace", back_populates="recordings")

# Posts System Models - Updated to match Supabase schema

class User(Base):
    __tablename__ = 'profiles'  # Match Supabase table name

    id = Column(String(64), primary_key=True)  # UUID
    username = Column(String(50), unique=True, nullable=True)
    display_name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)  # Match Supabase field name
    bio = Column(Text, nullable=True)
    role = Column(String(20), default='citizen')  # citizen, official, expert, journalist, admin
    is_verified = Column(Boolean, default=False)
    karma = Column(Integer, default=0)  # Total karma (post_karma + comment_karma)
    post_karma = Column(Integer, default=0)  # Karma from posts
    comment_karma = Column(Integer, default=0)  # Karma from comments
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    privacy_settings = Column(JSON, default=dict)

    # Relationships
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'displayName': self.display_name,
            'avatar': self.avatar_url,  # Map to avatar for frontend compatibility
            'isVerified': self.is_verified,
            'role': self.role,
            'karma': self.karma,
            'postKarma': self.post_karma,
            'commentKarma': self.comment_karma,
            'bio': self.bio,
            'privacySettings': self.privacy_settings
        }

class Community(Base):
    __tablename__ = 'communities'

    id = Column(String(64), primary_key=True)  # UUID
    name = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    member_count = Column(Integer, default=0)
    category = Column(String(30), nullable=False)  # governance, civic-education, accountability, discussion
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    posts = relationship("Post", back_populates="community", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'displayName': self.display_name,
            'description': self.description,
            'memberCount': self.member_count,
            'category': self.category
        }

class Post(Base):
    __tablename__ = 'posts'

    id = Column(String(64), primary_key=True)  # UUID
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=True)
    author_id = Column(String(64), ForeignKey('profiles.id'), nullable=False)  # Match Supabase foreign key
    community_id = Column(String(64), ForeignKey('communities.id'), nullable=True)  # Null for user profile posts
    official_id = Column(String(64), nullable=True)  # New field from Supabase
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    tags = Column(JSON, default=list)  # Array of strings
    flair = Column(String(50), nullable=True)
    content_type = Column(String(20), default='text')  # text, media, link, poll, ama
    link_url = Column(String(500), nullable=True)
    poll_options = Column(Text, nullable=True)  # Single text field in Supabase
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    author = relationship("User", back_populates="posts")
    community = relationship("Community", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    media_files = relationship("PostMedia", back_populates="post", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'author': self.author.to_dict() if self.author else None,
            'community': self.community.to_dict() if self.community else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'upvotes': self.upvotes,
            'downvotes': self.downvotes,
            'commentCount': self.comment_count,
            'tags': self.tags or [],
            'flair': self.flair,
            'contentType': self.content_type,
            'linkUrl': self.link_url,
            'pollOptions': json.loads(self.poll_options) if self.poll_options else None,
            'media_files': [media.to_dict() for media in self.media_files] if self.media_files else []
        }

class PostMedia(Base):
    __tablename__ = 'post_media'

    id = Column(Integer, primary_key=True, autoincrement=True)  # Match Supabase bigint generated
    post_id = Column(String(64), ForeignKey('posts.id'), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # image, video, audio, etc.
    file_size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    post = relationship("Post", back_populates="media_files")

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'file_path': self.file_path,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }

class Comment(Base):
    __tablename__ = 'comments'

    id = Column(String(64), primary_key=True)  # UUID
    content = Column(Text, nullable=False)
    author_id = Column(String(64), ForeignKey('profiles.id'), nullable=False)  # Match Supabase foreign key
    post_id = Column(String(64), ForeignKey('posts.id'), nullable=False)
    parent_id = Column(String(64), ForeignKey('comments.id'), nullable=True)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    depth = Column(Integer, default=0)
    is_collapsed = Column(Boolean, default=False)  # New field from Supabase
    moderation_status = Column(String(20), default='approved')  # pending, approved, removed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    author = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")
    replies = relationship("Comment", backref=backref('parent', remote_side=[id]), cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'author': self.author.to_dict() if self.author else None,
            'postId': self.post_id,
            'parentId': self.parent_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'upvotes': self.upvotes,
            'downvotes': self.downvotes,
            'depth': self.depth,
            'isCollapsed': self.is_collapsed,
            'moderationStatus': self.moderation_status
        }
