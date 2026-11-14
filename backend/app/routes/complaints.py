from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity, get_jwt
from sqlalchemy import desc
from ..decorators import role_required
from ..extensions import db
from ..models import Complaint, ComplaintStatusHistory, User, Officer
from ..utils import save_upload, make_code, notify
from ..ai.priority_engine import analyze_complaint, find_duplicate, canonical_category

complaints_bp = Blueprint('complaints', __name__)

def serialize_complaint(c):
    officer_name = None
    if c.assigned_officer and c.assigned_officer.user:
        officer_name = c.assigned_officer.user.full_name

    citizen_name = None
    if c.citizen:
        citizen_name = c.citizen.full_name

    return {
        'id': c.id,
        'complaint_code': c.complaint_code,
        'citizen_id': c.citizen_id,
        'citizen_name': citizen_name,
        'title': c.title or c.ai_category or 'Civic Complaint',
        'category': c.category,
        'description': c.description,
        'reported_location': c.reported_location or 'Location not specified',
        'latitude': float(c.latitude) if c.latitude is not None else None,
        'longitude': float(c.longitude) if c.longitude is not None else None,
        'image_path': c.image_path,
        'ai_category': c.ai_category or c.category,
        'ai_severity': c.ai_severity or 'Medium',
        'urgency_score': c.urgency_score if c.urgency_score is not None else 50,
        'priority': c.priority or 'Medium',
        'department': c.department or 'General Administration',
        'duplicate_of': c.duplicate_of,
        'status': c.status,
        'assigned_to': c.assigned_to,
        'assigned_officer_name': officer_name,
        'remarks': c.remarks,
        'resolution_image_path': c.resolution_image_path,
        'created_at': c.created_at.isoformat() if c.created_at else None,
        'updated_at': c.updated_at.isoformat() if c.updated_at else None
    }

@complaints_bp.post('')
@role_required('citizen')
def create_complaint():
    user_id = int(get_jwt_identity())
    form = request.form
    description = (form.get('description') or '').strip()
    
    if not description:
        return jsonify({'error': 'Detailed complaint description is required'}), 400

    image_file = request.files.get('image')
    image_name = None
    if image_file and image_file.filename:
        try:
            image_name = save_upload(image_file)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    raw_category = form.get('category')
    provided_cat = canonical_category(raw_category) if raw_category and raw_category.lower() not in ('', 'other', 'others', 'auto') else None

    # Run AI Analysis
    ai_result = analyze_complaint(description, provided_cat, image_name)

    # Check for duplicate reports in recent complaints
    recent_complaints = Complaint.query.filter(Complaint.status.notin_(['Resolved', 'Rejected'])).order_by(desc(Complaint.created_at)).limit(150).all()
    dup_id, dup_score = find_duplicate(description, recent_complaints)

    lat_val = None
    lon_val = None
    try:
        if form.get('latitude'):
            lat_val = float(form.get('latitude'))
        if form.get('longitude'):
            lon_val = float(form.get('longitude'))
    except (ValueError, TypeError):
        pass

    complaint = Complaint(
        complaint_code=make_code(),
        citizen_id=user_id,
        title=form.get('title') or f"{ai_result['category']} Issue",
        category=ai_result['category'],
        description=description,
        reported_location=form.get('reported_location') or 'Reported via Citizen App',
        latitude=lat_val,
        longitude=lon_val,
        image_path=image_name,
        ai_category=ai_result['category'],
        ai_severity=ai_result['severity'],
        urgency_score=ai_result['urgency_score'],
        priority=ai_result['priority'],
        department=ai_result['department'],
        duplicate_of=dup_id,
        status='Submitted'
    )

    db.session.add(complaint)
    db.session.flush()

    # Initial history entry
    db.session.add(ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=None,
        new_status='Submitted',
        changed_by=user_id,
        remarks='Complaint registered with AI Triage'
    ))

    # Notify Citizen
    notify(
        user_id,
        complaint.id,
        'Complaint Submitted Successfully',
        f'Complaint #{complaint.complaint_code} has been triaged as {complaint.priority} priority ({complaint.urgency_score}/100) and routed to {complaint.department}.'
    )

    db.session.commit()

    if dup_id:
        ai_result['duplicate_id'] = dup_id
        ai_result['duplicate_score'] = round(dup_score, 3)

    return jsonify({
        'message': 'Complaint submitted and analyzed successfully',
        'complaint': serialize_complaint(complaint),
        'ai': ai_result
    }), 201

@complaints_bp.get('/my')
@role_required('citizen')
def my_complaints():
    user_id = int(get_jwt_identity())
    rows = Complaint.query.filter_by(citizen_id=user_id).order_by(desc(Complaint.created_at)).all()
    return jsonify([serialize_complaint(c) for c in rows])

@complaints_bp.get('/<int:complaint_id>')
@role_required('citizen', 'officer', 'admin')
def get_complaint(complaint_id):
    user_id = int(get_jwt_identity())
    role = get_jwt().get('role')
    
    complaint = Complaint.query.get_or_404(complaint_id)
    if role == 'citizen' and complaint.citizen_id != user_id:
        return jsonify({'error': 'You do not have permission to view this complaint'}), 403

    histories = ComplaintStatusHistory.query.filter_by(complaint_id=complaint.id).order_by(ComplaintStatusHistory.created_at).all()
    
    history_list = []
    for h in histories:
        history_list.append({
            'id': h.id,
            'old_status': h.old_status,
            'new_status': h.new_status,
            'remarks': h.remarks or 'Status updated',
            'changed_by_name': h.changed_by_user.full_name if h.changed_by_user else 'Authority',
            'created_at': h.created_at.isoformat()
        })

    return jsonify({
        'complaint': serialize_complaint(complaint),
        'history': history_list
    })

@complaints_bp.post('/<int:complaint_id>/duplicate-check')
@role_required('citizen', 'officer', 'admin')
def check_duplicate_route(complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)
    others = Complaint.query.filter(Complaint.id != complaint.id).order_by(desc(Complaint.created_at)).limit(100).all()
    dup_id, score = find_duplicate(complaint.description, others)
    return jsonify({
        'duplicate_of': dup_id,
        'similarity': round(score, 3),
        'is_duplicate': bool(dup_id)
    })
