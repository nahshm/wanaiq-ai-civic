from flask import Blueprint, request, jsonify, g
from database.models import BarazaSpace, BarazaParticipant, BarazaRecording
from datetime import datetime
import uuid

baraza_bp = Blueprint('baraza', __name__)

def get_db():
    """Get database instance to avoid circular imports"""
    from main import db
    return db

@baraza_bp.route('/create', methods=['POST'])
def create_space():
    data = request.json
    title = data.get('title')
    description = data.get('description', '')
    host_user_id = data.get('host_user_id')

    if not title or not host_user_id:
        return jsonify({'error': 'Missing required fields'}), 400

    space_id = str(uuid.uuid4())
    space = BarazaSpace(
        space_id=space_id,
        title=title,
        description=description,
        host_user_id=host_user_id,
        is_live=True,
        created_at=datetime.utcnow()
    )
    db = get_db()
    db.session.add(space)
    db.session.commit()

    # Add host as participant
    participant = BarazaParticipant(
        space_id=space.id,
        user_id=host_user_id,
        role='host',
        joined_at=datetime.utcnow()
    )
    db.session.add(participant)
    db.session.commit()

    return jsonify({'space_id': space_id, 'message': 'Baraza space created successfully'}), 201

@baraza_bp.route('/join', methods=['POST'])
def join_space():
    data = request.json
    space_id = data.get('space_id')
    user_id = data.get('user_id')
    role = data.get('role', 'listener')

    space = BarazaSpace.query.filter_by(space_id=space_id, is_live=True).first()
    if not space:
        return jsonify({'error': 'Space not found or not live'}), 404

    participant = BarazaParticipant(
        space_id=space.id,
        user_id=user_id,
        role=role,
        joined_at=datetime.utcnow()
    )
    db = get_db()
    db.session.add(participant)
    db.session.commit()

    return jsonify({'message': f'User {user_id} joined space {space_id} as {role}'}), 200

@baraza_bp.route('/speakers/<space_id>', methods=['GET'])
def get_speakers(space_id):
    space = BarazaSpace.query.filter_by(space_id=space_id).first()
    if not space:
        return jsonify({'error': 'Space not found'}), 404

    speakers = BarazaParticipant.query.filter_by(space_id=space.id).filter(BarazaParticipant.role.in_(['host', 'speaker'])).all()
    speaker_list = [{'user_id': sp.user_id, 'role': sp.role} for sp in speakers]

    return jsonify({'speakers': speaker_list}), 200

@baraza_bp.route('/recordings/<space_id>', methods=['GET'])
def get_recordings(space_id):
    space = BarazaSpace.query.filter_by(space_id=space_id).first()
    if not space:
        return jsonify({'error': 'Space not found'}), 404

    recordings = BarazaRecording.query.filter_by(space_id=space.id).all()
    recording_list = [{'recording_url': rec.recording_url, 'created_at': rec.created_at.isoformat()} for rec in recordings]

    return jsonify({'recordings': recording_list}), 200

@baraza_bp.route('/manage-role', methods=['POST'])
def manage_role():
    data = request.json
    space_id = data.get('space_id')
    host_user_id = data.get('host_user_id')
    target_user_id = data.get('target_user_id')
    new_role = data.get('new_role')  # 'speaker' or 'listener'

    space = BarazaSpace.query.filter_by(space_id=space_id, host_user_id=host_user_id).first()
    if not space:
        return jsonify({'error': 'Space not found or not authorized'}), 404

    participant = BarazaParticipant.query.filter_by(space_id=space.id, user_id=target_user_id).first()
    if not participant:
        return jsonify({'error': 'Participant not found'}), 404

    if new_role not in ['speaker', 'listener']:
        return jsonify({'error': 'Invalid role'}), 400

    participant.role = new_role
    db = get_db()
    db.session.commit()

    return jsonify({'message': f'User {target_user_id} role updated to {new_role}'}), 200

@baraza_bp.route('/spaces', methods=['GET'])
def get_live_spaces():
    db = get_db()
    spaces = db.session.query(BarazaSpace).filter_by(is_live=True).order_by(BarazaSpace.created_at.desc()).limit(10).all()
    space_list = []
    for space in spaces:
        participant_count = db.session.query(BarazaParticipant).filter_by(space_id=space.id).count()
        space_list.append({
            'space_id': space.space_id,
            'title': space.title,
            'description': space.description,
            'host_user_id': space.host_user_id,
            'participant_count': participant_count,
            'created_at': space.created_at.isoformat()
        })
    return jsonify({'spaces': space_list}), 200
