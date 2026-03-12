import requests
from typing import Dict, Any, List
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class NGOEscalationManager:
    def __init__(self):
        self.ngo_partners = self._load_ngo_partners()

    def _load_ngo_partners(self) -> Dict[str, Dict[str, Any]]:
        """Load NGO partner configurations"""
        return {
            'knchr': {
                'name': 'Kenya National Commission on Human Rights',
                'tier': 1,
                'api_endpoint': 'https://api.knchr.org/escalation',
                'api_key': 'your_api_key_here',  # In production, use secure key management
                'escalation_threshold': 8.0,
                'contact_email': 'escalation@knchr.org'
            },
            'transparency_intl': {
                'name': 'Transparency International Kenya',
                'tier': 2,
                'api_endpoint': 'https://api.tikenya.org/reports',
                'api_key': 'your_api_key_here',
                'escalation_threshold': 7.5,
                'contact_email': 'reports@tikenya.org'
            }
        }

    def evaluate_and_escalate(self, report_id: str, risk_score: float, category: str):
        """Evaluate report and escalate to appropriate NGOs"""
        # Determine which NGOs should receive this report
        relevant_ngos = self._get_relevant_ngos(category, risk_score)

        if not relevant_ngos:
            logger.info(f"No escalation needed for report {report_id}")
            return

        # Create escalation workflow
        workflow = self._create_escalation_workflow(report_id, relevant_ngos)

        # Notify NGOs
        for ngo in relevant_ngos:
            self._notify_ngo(report_id, ngo, workflow)

        logger.info(f"Escalated report {report_id} to {len(relevant_ngos)} NGOs")

    def _get_relevant_ngos(self, category: str, risk_score: float) -> List[Dict[str, Any]]:
        """Get list of NGOs that should receive this report"""
        relevant = []

        for ngo_id, ngo_config in self.ngo_partners.items():
            # Check if risk score meets threshold
            if risk_score >= ngo_config['escalation_threshold']:
                # Check if NGO handles this category
                if self._handles_category(ngo_id, category):
                    relevant.append({**ngo_config, 'id': ngo_id})

        return relevant

    def _handles_category(self, ngo_id: str, category: str) -> bool:
        """Check if NGO handles specific category"""
        category_mapping = {
            'knchr': ['human_rights', 'police_brutality', 'tribalism'],
            'transparency_intl': ['corruption', 'mismanagement', 'electoral'],
            'law_society': ['legal', 'human_rights', 'police_brutality']
        }

        return category in category_mapping.get(ngo_id, [])

    def _create_escalation_workflow(self, report_id: str, ngos: List[Dict]) -> Dict[str, Any]:
        """Create escalation workflow tracking"""
        workflow = {
            'report_id': report_id,
            'escalated_ngos': [ngo['id'] for ngo in ngos],
            'escalation_date': datetime.utcnow().isoformat(),
            'status': 'escalated',
            'responses': {}
        }

        # Store workflow in database
        # escalation = EscalationWorkflow(**workflow)
        # db.session.add(escalation)
        # db.session.commit()

        return workflow

    def _notify_ngo(self, report_id: str, ngo: Dict[str, Any], workflow: Dict[str, Any]):
        """Send notification to NGO"""
        notification_data = {
            'report_id': report_id,
            'category': 'human_rights',  # Would come from report
            'risk_level': 'high',  # Would come from report
            'urgency': 'immediate' if ngo['tier'] == 1 else 'standard',
            'secure_link': f"https://wana.iq/ngo-access/{report_id}",
            'callback_url': 'https://api.wana.iq/ngo/response'
        }

        try:
            response = requests.post(
                ngo['api_endpoint'],
                json=notification_data,
                headers={'Authorization': f"Bearer {ngo['api_key']}"},
                timeout=30
            )

            if response.status_code == 200:
                logger.info(f"Successfully notified {ngo['name']} about report {report_id}")
            else:
                logger.error(f"Failed to notify {ngo['name']}: {response.status_code}")

        except Exception as e:
            logger.error(f"Error notifying {ngo['name']}: {e}")

# Initialize escalation manager
ngo_manager = NGOEscalationManager()

# Flask routes for NGO integration
from flask import Blueprint, request, jsonify

ngo_bp = Blueprint('ngo', __name__)

@ngo_bp.route('/api/ngo/response', methods=['POST'])
def handle_ngo_response():
    """Handle responses from NGO partners"""
    try:
        data = request.get_json()
        report_id = data.get('report_id')
        ngo_id = data.get('ngo_id')
        response = data.get('response')
        action_taken = data.get('action_taken')

        # Store NGO response
        # ngo_response = NGOReportResponse(
        #     report_id=report_id,
        #     ngo_id=ngo_id,
        #     response=response,
        #     action_taken=action_taken
        # )
        # db.session.add(ngo_response)
        # db.session.commit()

        logger.info(f"Received response from NGO {ngo_id} for report {report_id}")
        return jsonify({'status': 'received'}), 200

    except Exception as e:
        logger.error(f"Error handling NGO response: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@ngo_bp.route('/api/ngo/access/<report_id>', methods=['GET'])
def get_ngo_report_access(report_id: str):
    """Provide secure access to reports for NGO partners"""
    try:
        # Verify NGO authentication
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401

        api_key = auth_header.split(' ')[1]

        # Find NGO by API key
        ngo = None
        for ngo_data in ngo_manager.ngo_partners.values():
            if ngo_data['api_key'] == api_key:
                ngo = ngo_data
                break

        if not ngo:
            return jsonify({'error': 'Invalid API key'}), 403

        # Get report data (with decryption audit logging)
        # report = SensitiveReport.query.filter_by(report_id=report_id).first()
        # if not report:
        #     return jsonify({'error': 'Report not found'}), 404

        # Log decryption event
        # audit_logger.log_decryption_event(report_id, 'ngo_system', ['content', 'evidence'], 'ngo_review')

        return jsonify({
            'report_id': report_id,
            'category': 'human_rights',  # Would come from database
            'risk_score': 8.5,  # Would come from database
            'submitted_at': '2024-01-01T00:00:00Z',  # Would come from database
            'evidence_count': 3,  # Would come from database
            'access_level': 'read'  # NGO can only read, not modify
        })

    except Exception as e:
        logger.error(f"Error providing NGO access: {e}")
        return jsonify({'error': 'Internal server error'}), 500
