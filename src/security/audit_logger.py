import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import psutil
import socket
from functools import wraps
import traceback
import os

class AuditLogger:
    def __init__(self):
        self.logger = logging.getLogger('audit')
        self.logger.setLevel(logging.INFO)

        # Create logs directory if it doesn't exist
        os.makedirs('logs', exist_ok=True)

        # Create audit log file handler
        audit_handler = logging.FileHandler('logs/audit.log')
        audit_handler.setLevel(logging.INFO)

        # Create formatter for structured logging
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)s | %(audit_data)s'
        )
        audit_handler.setFormatter(formatter)
        self.logger.addHandler(audit_handler)

    def log_admin_action(self, admin_user_id: str, action: str,
                        target_resource: str, details: Dict[str, Any],
                        justification: str = None):
        """Log all admin actions with full context"""

        # Get system context
        system_context = self._get_system_context()

        audit_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'admin_user_id': admin_user_id,
            'action': action,
            'target_resource': target_resource,
            'target_details': details,
            'justification': justification,
            'system_context': system_context,
            'session_info': self._get_session_info(),
            'risk_level': self._calculate_action_risk(action, details)
        }

        # Add stack trace for sensitive actions
        if self._is_sensitive_action(action):
            audit_data['stack_trace'] = traceback.format_stack()

        self.logger.info(f"ADMIN_ACTION: {json.dumps(audit_data)}")

        # Store in database for querying
        self._store_audit_record(audit_data)

    def log_data_access(self, user_id: str, resource_type: str,
                       resource_id: str, access_type: str):
        """Log data access for privacy compliance"""

        access_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'resource_type': resource_type,
            'resource_id': resource_id,
            'access_type': access_type,
            'ip_address': self._get_client_ip(),
            'user_agent': self._get_user_agent()
        }

        self.logger.info(f"DATA_ACCESS: {json.dumps(access_data)}")

    def log_decryption_event(self, report_id: str, admin_user_id: str,
                           fields_accessed: list, reason: str):
        """Log all decryption events for sensitive data"""

        decryption_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'report_id': report_id,
            'admin_user_id': admin_user_id,
            'fields_accessed': fields_accessed,
            'decryption_reason': reason,
            'ip_address': self._get_client_ip(),
            'justification_required': True
        }

        self.logger.warning(f"DECRYPTION_EVENT: {json.dumps(decryption_data)}")

    def _get_system_context(self) -> Dict[str, Any]:
        """Get current system context for audit trail"""
        return {
            'hostname': socket.gethostname(),
            'ip_address': socket.gethostbyname(socket.gethostname()),
            'cpu_usage': psutil.cpu_percent(),
            'memory_usage': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'process_id': os.getpid()
        }

    def _get_session_info(self) -> Dict[str, Any]:
        """Get session information"""
        try:
            from flask import session
            return {
                'session_id': getattr(session, 'sid', 'unknown'),
                'user_id': getattr(session, 'user_id', None),
                'login_time': getattr(session, 'login_time', None)
            }
        except:
            return {
                'session_id': 'unknown',
                'user_id': None,
                'login_time': None
            }

    def _get_client_ip(self) -> str:
        """Get client IP address"""
        # Implementation depends on your Flask setup
        return request.remote_addr or 'unknown'

    def _get_user_agent(self) -> str:
        """Get user agent string"""
        return request.headers.get('User-Agent', 'unknown')

    def _calculate_action_risk(self, action: str, details: Dict[str, Any]) -> str:
        """Calculate risk level of admin action"""
        high_risk_actions = [
            'user_ban', 'user_delete', 'report_delete', 'system_config_change'
        ]

        medium_risk_actions = [
            'user_suspend', 'content_remove', 'report_escalate'
        ]

        if action in high_risk_actions:
            return 'high'
        elif action in medium_risk_actions:
            return 'medium'
        else:
            return 'low'

    def _is_sensitive_action(self, action: str) -> bool:
        """Check if action requires enhanced logging"""
        sensitive_actions = [
            'user_delete', 'report_delete', 'system_config_change',
            'encryption_key_change', 'admin_privilege_change'
        ]
        return action in sensitive_actions

    def _store_audit_record(self, audit_data: Dict[str, Any]):
        """Store audit record in database"""
        # Implementation for database storage
        # audit_record = AdminAuditLog(**audit_data)
        # db.session.add(audit_record)
        # db.session.commit()
        pass

# Initialize audit logger
audit_logger = AuditLogger()
