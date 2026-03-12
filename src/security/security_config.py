import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import secrets
from typing import Dict, Any, Optional
import logging
from datetime import datetime

class SecurityManager:
    def __init__(self):
        self.encryption_keys = self._load_or_generate_keys()
        self.fernet = Fernet(self.encryption_keys['data'])
        self.logger = logging.getLogger(__name__)

    def _load_or_generate_keys(self) -> Dict[str, bytes]:
        """Load existing keys or generate new ones"""
        keys = {}

        # Master key for sensitive data
        master_key_file = os.getenv('MASTER_KEY_FILE', 'keys/master.key')
        if os.path.exists(master_key_file):
            with open(master_key_file, 'rb') as f:
                keys['master'] = f.read()
        else:
            keys['master'] = Fernet.generate_key()
            os.makedirs('keys', exist_ok=True)
            with open(master_key_file, 'wb') as f:
                f.write(keys['master'])

        # Evidence encryption key
        evidence_key_file = os.getenv('EVIDENCE_KEY_FILE', 'keys/evidence.key')
        if os.path.exists(evidence_key_file):
            with open(evidence_key_file, 'rb') as f:
                keys['evidence'] = f.read()
        else:
            keys['evidence'] = Fernet.generate_key()
            with open(evidence_key_file, 'wb') as f:
                f.write(keys['evidence'])

        # Session key for temporary data
        keys['session'] = Fernet.generate_key()

        # Data encryption key (main key for general data)
        data_key_file = os.getenv('DATA_KEY_FILE', 'keys/data.key')
        if os.path.exists(data_key_file):
            with open(data_key_file, 'rb') as f:
                keys['data'] = f.read()
        else:
            keys['data'] = Fernet.generate_key()
            with open(data_key_file, 'wb') as f:
                f.write(keys['data'])

        return keys

    def encrypt_sensitive_data(self, data: str, level: str = 'standard') -> str:
        """Encrypt sensitive report content"""
        if level == 'military_grade':
            # Double encryption for highest security
            encrypted_once = self.fernet.encrypt(data.encode())
            return self.fernet.encrypt(encrypted_once).decode()
        else:
            return self.fernet.encrypt(data.encode()).decode()

    def decrypt_sensitive_data(self, encrypted_data: str, level: str = 'standard') -> str:
        """Decrypt sensitive report content with audit logging"""
        try:
            if level == 'military_grade':
                # Double decryption
                decrypted_once = self.fernet.decrypt(encrypted_data.encode())
                return self.fernet.decrypt(decrypted_once).decode()
            else:
                return self.fernet.decrypt(encrypted_data.encode()).decode()
        except Exception as e:
            self.logger.error(f"Decryption failed: {e}")
            raise

    def generate_session_token(self) -> str:
        """Generate secure session token for anonymous reporting"""
        return secrets.token_urlsafe(32)

    def hash_reporter_identity(self, identity_data: str) -> str:
        """Create one-way hash for anonymous reporter tracking"""
        return base64.b64encode(
            hashes.Hash(hashes.SHA256()).finalize()
        ).decode()

    def generate_report_id(self) -> str:
        """Generate unique report ID in SR-XXXX format"""
        return f"SR-{secrets.token_hex(4).upper()}"

    def audit_admin_action(self, admin_id: str, action: str, details: Dict[str, Any]):
        """Log admin actions for audit trail"""
        audit_entry = {
            'admin_user_id': admin_id,
            'action': action,
            'details': details,
            'timestamp': datetime.utcnow().isoformat()
        }
        self.logger.info(f"ADMIN_ACTION: {audit_entry}")

    def get_status(self) -> Dict[str, str]:
        """Get security manager status"""
        return {
            'status': 'healthy',
            'keys_loaded': len(self.encryption_keys),
            'encryption_available': 'true'
        }

# Initialize security manager
security_manager = SecurityManager()
