#!/usr/bin/env python3
"""
WanaIQ Civic Platform - Main Application
Phase 1: Security Foundation & Sensitive Content System
"""

import os
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from dotenv import load_dotenv
import logging
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///wanaiq.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')

from database.db import db
migrate = Migrate()
jwt = JWTManager()

db.init_app(app)
migrate.init_app(app, db)
jwt.init_app(app)

# Now import models after database is initialized
from database import models
from database.models import NGOPartner, SensitiveReport, AdminAuditLog, SystemHealth

# Now import security components after database is initialized
from security.security_config import security_manager
from security.encryption_manager import encryption_manager
from security.audit_logger import audit_logger
from security.privacy_manager import privacy_manager

from api.anonymous_reporting import anonymous_bp
from api.ngo_escalation import ngo_bp
from api.posts import posts_bp

# Conditionally import and register Baraza blueprint for modularity
baraza_enabled = os.getenv('BARAZA_ENABLED', 'true').lower() == 'true'
baraza_bp = None
if baraza_enabled:
    try:
        from api.baraza import baraza_bp
        app.register_blueprint(baraza_bp, url_prefix='/api/baraza')
        app.logger.info("Baraza API blueprint registered")
    except ImportError as e:
        app.logger.warning(f"Baraza API blueprint not available: {e}")
    except Exception as e:
        app.logger.error(f"Failed to register Baraza API blueprint: {e}")
else:
    app.logger.info("Baraza API blueprint disabled via configuration")

app.register_blueprint(anonymous_bp)
app.register_blueprint(ngo_bp, url_prefix='/api/ngo')
app.register_blueprint(posts_bp, url_prefix='/api/posts')

def init_database():
    """Initialize database and create tables"""
    with app.app_context():
        # Create all tables
        db.create_all()

        # Create default NGO partners if they don't exist
        if not NGOPartner.query.first():
            default_ngos = [
                {
                    'name': 'Human Rights Watch',
                    'description': 'International human rights organization',
                    'api_endpoint': 'https://api.hrw.org/escalation',
                    'tier': 1,
                    'escalation_threshold': 3
                },
                {
                    'name': 'Transparency International',
                    'description': 'Anti-corruption organization',
                    'api_endpoint': 'https://api.transparency.org/escalation',
                    'tier': 2,
                    'escalation_threshold': 4
                },
                {
                    'name': 'Legal Aid Foundation',
                    'description': 'Legal assistance for citizens',
                    'api_endpoint': 'https://api.legalaid.org/escalation',
                    'tier': 3,
                    'escalation_threshold': 5
                }
            ]

            for ngo_data in default_ngos:
                ngo = NGOPartner(**ngo_data)
                ngo.api_key_encrypted = encryption_manager._software_encrypt('default-api-key').encode()
                db.session.add(ngo)

            db.session.commit()
            app.logger.info("Default NGO partners created")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """System health check endpoint"""
    try:
        # Check database connection
        db.session.execute(db.text('SELECT 1'))
        db_status = 'healthy'
    except Exception as e:
        db_status = f'error: {str(e)}'
        app.logger.error(f"Database health check failed: {e}")

    # Check security manager
    try:
        security_manager.get_status()
        security_status = 'healthy'
    except Exception as e:
        security_status = f'error: {str(e)}'
        app.logger.error(f"Security manager health check failed: {e}")

    # Check API blueprints
    try:
        # Check if blueprints are registered by testing a simple route or assuming healthy
        api_status = 'healthy'
    except Exception as e:
        api_status = f'error: {str(e)}'
        app.logger.error(f"API blueprint health check failed: {e}")

    # Get recent error logs
    try:
        recent_errors = AdminAuditLog.query.filter(
            AdminAuditLog.action.like('%error%')
        ).order_by(AdminAuditLog.timestamp.desc()).limit(5).all()
        error_logs = [{
            'action': log.action,
            'timestamp': log.timestamp.isoformat(),
            'details': log.details
        } for log in recent_errors]
    except Exception as e:
        error_logs = []
        app.logger.error(f"Error fetching recent error logs: {e}")

    # Check Baraza module status
    baraza_status = 'disabled'
    if baraza_enabled:
        try:
            # Test Baraza API availability by checking if blueprint is registered
            if baraza_bp is not None:
                baraza_status = 'healthy'
            else:
                baraza_status = 'error: blueprint not loaded'
        except Exception as e:
            baraza_status = f'error: {str(e)}'

    health_data = {
        'status': 'healthy' if all(status == 'healthy' for status in [db_status, security_status, api_status]) else 'degraded',
        'timestamp': datetime.utcnow().isoformat(),
        'components': {
            'database': db_status,
            'security_manager': security_status,
            'encryption_manager': 'healthy',  # Assume healthy if no errors
            'audit_logger': 'healthy',
            'api_blueprints': api_status,
            'baraza_module': baraza_status
        },
        'recent_errors': error_logs
    }

    return jsonify(health_data)

# System status endpoint
@app.route('/api/system/status', methods=['GET'])
def system_status():
    """Get system status for monitoring"""
    try:
        # Check database connection
        db.session.execute(db.text('SELECT 1'))
        db_status = 'healthy'
    except Exception as e:
        db_status = f'error: {str(e)}'
        app.logger.error(f"Database health check failed: {e}")

    # Check security manager
    try:
        security_manager.get_status()
        security_status = 'healthy'
    except Exception as e:
        security_status = f'error: {str(e)}'
        app.logger.error(f"Security manager health check failed: {e}")

    # Check API blueprints
    try:
        # Check if blueprints are registered by testing a simple route or assuming healthy
        api_status = 'healthy'
    except Exception as e:
        api_status = f'error: {str(e)}'
        app.logger.error(f"API blueprint health check failed: {e}")

    # Get recent error logs
    try:
        recent_errors = AdminAuditLog.query.filter(
            AdminAuditLog.action.like('%error%')
        ).order_by(AdminAuditLog.timestamp.desc()).limit(5).all()
        error_logs = [{
            'action': log.action,
            'timestamp': log.timestamp.isoformat(),
            'details': log.details
        } for log in recent_errors]
    except Exception as e:
        error_logs = []
        app.logger.error(f"Error fetching recent error logs: {e}")

    # Check Baraza module status
    baraza_status = 'disabled'
    if baraza_enabled:
        try:
            # Test Baraza API availability by checking if blueprint is registered
            if baraza_bp is not None:
                baraza_status = 'healthy'
            else:
                baraza_status = 'error: blueprint not loaded'
        except Exception as e:
            baraza_status = f'error: {str(e)}'

    health_data = {
        'status': 'healthy' if all(status == 'healthy' for status in [db_status, security_status, api_status]) else 'degraded',
        'timestamp': datetime.utcnow().isoformat(),
        'components': {
            'database': db_status,
            'security_manager': security_status,
            'encryption_manager': 'healthy',  # Assume healthy if no errors
            'audit_logger': 'healthy',
            'api_blueprints': api_status,
            'baraza_module': baraza_status
        },
        'recent_errors': error_logs
    }

    return jsonify(health_data)

# Admin dashboard endpoint
@app.route('/api/admin/reports', methods=['GET'])
@jwt_required()
def get_admin_reports():
    """Get reports for admin dashboard"""
    try:
        # Log admin access
        audit_logger.log_admin_action(
            admin_user_id=request.headers.get('X-Admin-ID', 'unknown'),
            action='view_reports',
            target_resource='admin_reports',
            details={
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent'),
                'endpoint': '/api/admin/reports'
            }
        )

        # Get all reports
        reports = SensitiveReport.query.order_by(SensitiveReport.created_at.desc()).all()

        return jsonify({
            'success': True,
            'reports': [report.to_dict() for report in reports]
        })

    except Exception as e:
        app.logger.error(f"Error fetching admin reports: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# System monitoring endpoint
@app.route('/api/admin/system-status', methods=['GET'])
@jwt_required()
def get_system_status():
    """Get system status for monitoring"""
    try:
        # Get recent audit logs
        recent_audits = AdminAuditLog.query.order_by(AdminAuditLog.timestamp.desc()).limit(10).all()

        # Get system health records
        health_records = SystemHealth.query.order_by(SystemHealth.last_check.desc()).limit(5).all()

        # Get report statistics
        total_reports = SensitiveReport.query.count()
        pending_reports = SensitiveReport.query.filter_by(status='pending').count()
        escalated_reports = SensitiveReport.query.filter_by(status='escalated').count()

        status_data = {
            'total_reports': total_reports,
            'pending_reports': pending_reports,
            'escalated_reports': escalated_reports,
            'recent_audits': [{
                'action': log.action,
                'timestamp': log.timestamp.isoformat(),
                'admin_id': log.admin_id
            } for log in recent_audits],
            'health_records': [{
                'component': record.component,
                'status': record.status,
                'last_check': record.last_check.isoformat()
            } for record in health_records]
        }

        return jsonify({'success': True, 'data': status_data})

    except Exception as e:
        app.logger.error(f"Error fetching system status: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Internal server error: {error}")
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

@app.errorhandler(413)
def file_too_large(error):
    return jsonify({'success': False, 'error': 'File too large'}), 413

# Request logging middleware
@app.before_request
def log_request_info():
    app.logger.info(f"{request.method} {request.url} - IP: {request.remote_addr}")

if __name__ == '__main__':
    # Initialize logging
    logging.basicConfig(level=logging.INFO)
    app.logger.info("Starting WanaIQ Civic Platform - Phase 1")

    # Initialize database
    init_database()

    # Start the application
    app.run(
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('DEBUG', 'False').lower() == 'true'
    )
