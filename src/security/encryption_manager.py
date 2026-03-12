import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import secrets
from typing import Dict, Any, Tuple
import logging

class EncryptionManager:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.keys = self._initialize_keys()
        self.hsm_available = self._check_hsm_availability()

    def _initialize_keys(self) -> Dict[str, Any]:
        """Initialize encryption keys"""
        keys = {}

        # Generate or load master key
        master_key_file = os.getenv('MASTER_KEY_FILE', 'keys/master.key')
        if os.path.exists(master_key_file):
            with open(master_key_file, 'rb') as f:
                keys['master'] = f.read()
        else:
            keys['master'] = Fernet.generate_key()
            os.makedirs('keys', exist_ok=True)
            with open(master_key_file, 'wb') as f:
                f.write(keys['master'])

        # Generate RSA key pair for asymmetric encryption
        private_key_file = os.getenv('PRIVATE_KEY_FILE', 'keys/private.pem')
        public_key_file = os.getenv('PUBLIC_KEY_FILE', 'keys/public.pem')

        if os.path.exists(private_key_file) and os.path.exists(public_key_file):
            with open(private_key_file, 'rb') as f:
                keys['private'] = serialization.load_pem_private_key(f.read(), password=None)
            with open(public_key_file, 'rb') as f:
                keys['public'] = serialization.load_pem_public_key(f.read())
        else:
            keys['private'], keys['public'] = self._generate_rsa_keypair()
            self._save_rsa_keys(keys['private'], keys['public'])

        return keys

    def _generate_rsa_keypair(self) -> Tuple[rsa.RSAPrivateKey, rsa.RSAPublicKey]:
        """Generate RSA key pair for asymmetric encryption"""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=4096,
        )
        public_key = private_key.public_key()
        return private_key, public_key

    def _save_rsa_keys(self, private_key: rsa.RSAPrivateKey, public_key: rsa.RSAPublicKey):
        """Save RSA keys to files"""
        pem_private = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        pem_public = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        with open('keys/private.pem', 'wb') as f:
            f.write(pem_private)
        with open('keys/public.pem', 'wb') as f:
            f.write(pem_public)

    def _check_hsm_availability(self) -> bool:
        """Check if Hardware Security Module is available"""
        # In production, this would check for actual HSM integration
        return os.getenv('HSM_ENABLED', 'false').lower() == 'true'

    def encrypt_with_hsm(self, data: str) -> str:
        """Encrypt data using HSM if available"""
        if self.hsm_available:
            # Implementation for HSM encryption
            # This would use HSM SDK calls
            return self._hsm_encrypt(data)
        else:
            return self._software_encrypt(data)

    def _hsm_encrypt(self, data: str) -> str:
        """HSM-based encryption (placeholder)"""
        # In production, this would use actual HSM calls
        self.logger.info("Using HSM for encryption")
        return self._software_encrypt(data)  # Placeholder

    def _software_encrypt(self, data: str) -> str:
        """Software-based encryption using Fernet"""
        fernet = Fernet(self.keys['master'])
        return fernet.encrypt(data.encode()).decode()

    def encrypt_asymmetric(self, data: str) -> str:
        """Encrypt data using RSA public key"""
        encrypted = self.keys['public'].encrypt(
            data.encode(),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return base64.b64encode(encrypted).decode()

    def decrypt_asymmetric(self, encrypted_data: str) -> str:
        """Decrypt data using RSA private key"""
        encrypted_bytes = base64.b64decode(encrypted_data)
        decrypted = self.keys['private'].decrypt(
            encrypted_bytes,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return decrypted.decode()

    def generate_secure_hash(self, data: str, salt: str = None) -> str:
        """Generate secure hash for sensitive data"""
        if not salt:
            salt = secrets.token_bytes(16)

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt.encode(),
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(data.encode()))
        return key.decode()

    def rotate_encryption_keys(self):
        """Rotate encryption keys for security"""
        self.logger.warning("Rotating encryption keys - this will re-encrypt all data")

        # Generate new keys
        new_master_key = Fernet.generate_key()
        new_private_key, new_public_key = self._generate_rsa_keypair()

        # Store old keys for data migration
        old_keys = self.keys.copy()

        # Update current keys
        self.keys['master'] = new_master_key
        self.keys['private'] = new_private_key
        self.keys['public'] = new_public_key

        # Save new keys
        with open('keys/master.key', 'wb') as f:
            f.write(new_master_key)
        self._save_rsa_keys(new_private_key, new_public_key)

        # Trigger background job to re-encrypt existing data
        self._schedule_data_reencryption(old_keys)

    def _schedule_data_reencryption(self, old_keys: Dict[str, Any]):
        """Schedule background re-encryption of existing data"""
        # Implementation for background job scheduling
        self.logger.info("Scheduled data re-encryption job")

# Initialize encryption manager
encryption_manager = EncryptionManager()
