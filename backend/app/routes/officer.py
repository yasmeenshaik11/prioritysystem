from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, get_jwt
from sqlalchemy import desc, func, or_
from ..decorators import role_required
from ..extensions import db
from ..models import Complaint, User, Officer, ComplaintStatusHistory
from ..utils import notify, save_upload

officer_bp = Blueprint('officer', __name__)

ALLOWED_STATUSES = {
    'Submitted',
    'Under Review',
    'Assigned',
    'In Progress',
    'Resolved',
    'Rejected'
}

def serialize_for_officer(c):
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
        'citizen_area': c.citizen.area if c.citizen else None,
        'citizen_phone': c.citizen.phone if c.citizen else None,
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
        'status': c.status,
        'assigned_to': c.assigned_to,
        'assigned_officer_name': officer_name,
        'remarks': c.remarks,
        'resolution_image_path': c.resolution_image_path,
        'created_at': c.created_at.isoformat() if c.created_at else None,
        'updated_at': c.updated_at.isoformat() if c.updated_at else None
    }

@officer_bp.get('/dashboard')
@role_required('officer', 'admin')
def get_dashboard_kpis():
    total = Complaint.query.count()
    pending = Complaint.query.filter(Complaint.status.notin_(['Resolved', 'Rejected'])).count()
    critical_count = Complaint.query.filter(Complaint.priority == 'Critical', Complaint.status.notin_(['Resolved', 'Rejected'])).count()
    high_count = Complaint.query.filter(Complaint.priority == 'High', Complaint.status.notin_(['Resolved', 'Rejected'])).count()
    resolved = Complaint.query.filter_by(status='Resolved').count()
    rejected = Complaint.query.filter_by(status='Rejected').count()
    
    resolution_rate = round((resolved / total * 100), 1) if total > 0 else 0.0

    return jsonify({
        'total': total,
        'pending': pending,
        'critical': critical_count,
        'high_priority': high_count,
        'resolved': resolved,
        'rejected': rejected,
        'resolution_rate': resolution_rate
    })

@officer_bp.get('/complaints')
@role_required('officer', 'admin')
def list_complaints():
    q = Complaint.query

    category = request.args.get('category')
    if category and category.lower() != 'all':
        q = q.filter(Complaint.ai_category == category)

    priority = request.args.get('priority')
    if priority and priority.lower() != 'all':
        q = q.filter(Complaint.priority == priority)

    status = request.args.get('status')
    if status and status.lower() != 'all':
        q = q.filter(Complaint.status == status)

    search = request.args.get('search')
    if search:
        search_pattern = f"%{search.strip()}%"
        q = q.join(User, Complaint.citizen_id == User.id).filter(
            or_(
                Complaint.complaint_code.ilike(search_pattern),
                Complaint.title.ilike(search_pattern),
                Complaint.description.ilike(search_pattern),
                Complaint.reported_location.ilike(search_pattern),
                User.full_name.ilike(search_pattern),
                User.area.ilike(search_pattern)
            )
        )

    area = request.args.get('area')
    if area:
        if not search:
            q = q.join(User, Complaint.citizen_id == User.id)
        q = q.filter(User.area.ilike(f"%{area.strip()}%"))

    # Sorted by urgency score descending, then created_at descending
    rows = q.order_by(desc(Complaint.urgency_score), desc(Complaint.created_at)).all()
    return jsonify([serialize_for_officer(c) for c in rows])

@officer_bp.get('/complaints/<int:complaint_id>')
@role_required('officer', 'admin')
def get_complaint_details(complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)
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
        'complaint': serialize_for_officer(complaint),
        'history': history_list
    })

@officer_bp.patch('/complaints/<int:complaint_id>/status')
@role_required('officer', 'admin')
def update_status(complaint_id):
    uid = int(get_jwt_identity())
    complaint = Complaint.query.get_or_404(complaint_id)
    
    data = request.get_json() or {}
    new_status = data.get('status')
    remarks = (data.get('remarks') or '').strip()

    if new_status not in ALLOWED_STATUSES:
        return jsonify({'error': f"Invalid status. Must be one of: {', '.join(sorted(ALLOWED_STATUSES))}"}), 400

    old_status = complaint.status
    complaint.status = new_status
    if remarks:
        complaint.remarks = remarks

    db.session.add(ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=uid,
        remarks=remarks or f'Status updated to {new_status}'
    ))

    # Real-time citizen notification
    notify(
        complaint.citizen_id,
        complaint.id,
        f'Complaint #{complaint.complaint_code} Status Updated',
        f'Your complaint status has changed from {old_status} to {new_status}. Remarks: {remarks or "Processed by administration."}'
    )

    db.session.commit()
    return jsonify(serialize_for_officer(complaint))

@officer_bp.patch('/complaints/<int:complaint_id>/assign')
@role_required('officer', 'admin')
def assign_officer(complaint_id):
    uid = int(get_jwt_identity())
    complaint = Complaint.query.get_or_404(complaint_id)
    data = request.get_json() or {}
    officer_id = data.get('officer_id')

    officer = Officer.query.get(officer_id)
    if not officer:
        return jsonify({'error': 'Assigned officer was not found'}), 404

    complaint.assigned_to = officer.id
    old_status = complaint.status
    if complaint.status in {'Submitted', 'Under Review'}:
        complaint.status = 'Assigned'

    db.session.add(ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=complaint.status,
        changed_by=uid,
        remarks=f"Assigned to {officer.user.full_name} ({officer.department})"
    ))

    notify(
        complaint.citizen_id,
        complaint.id,
        'Field Officer Assigned',
        f'Complaint #{complaint.complaint_code} is assigned to Officer {officer.user.full_name} ({officer.department}).'
    )

    db.session.commit()
    return jsonify(serialize_for_officer(complaint))

@officer_bp.post('/complaints/<int:complaint_id>/resolution-image')
@role_required('officer', 'admin')
def submit_resolution(complaint_id):
    uid = int(get_jwt_identity())
    complaint = Complaint.query.get_or_404(complaint_id)
    
    file = request.files.get('image')
    remarks = request.form.get('remarks', 'Issue verified and resolved successfully on site.')

    filename = None
    if file and file.filename:
        try:
            filename = save_upload(file)
            complaint.resolution_image_path = filename
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    old_status = complaint.status
    complaint.status = 'Resolved'
    complaint.remarks = remarks

    db.session.add(ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status='Resolved',
        changed_by=uid,
        remarks=f"Resolution submitted: {remarks}"
    ))

    notify(
        complaint.citizen_id,
        complaint.id,
        'Complaint Resolved',
        f'Great news! Your complaint #{complaint.complaint_code} has been resolved by field officials. Thank you for your report.'
    )

    db.session.commit()
    return jsonify(serialize_for_officer(complaint))

@officer_bp.get('/analytics')
@role_required('officer', 'admin')
def get_analytics():
    cat_counts = db.session.query(Complaint.ai_category, func.count(Complaint.id)).group_by(Complaint.ai_category).all()
    pri_counts = db.session.query(Complaint.priority, func.count(Complaint.id)).group_by(Complaint.priority).all()
    status_counts = db.session.query(Complaint.status, func.count(Complaint.id)).group_by(Complaint.status).all()
    avg_urgency = db.session.query(func.avg(Complaint.urgency_score)).scalar() or 0

    return jsonify({
        'category': [{'name': c or 'Others', 'value': count} for c, count in cat_counts],
        'priority': [{'name': p or 'Medium', 'value': count} for p, count in pri_counts],
        'status': [{'name': s, 'value': count} for s, count in status_counts],
        'avg_urgency': round(float(avg_urgency), 1)
    })

@officer_bp.get('/staff')
@role_required('officer', 'admin')
def list_staff():
    officers = Officer.query.all()
    return jsonify([{
        'id': o.id,
        'employee_code': o.employee_code,
        'department': o.department,
        'designation': o.designation,
        'name': o.user.full_name,
        'email': o.user.email,
        'phone': o.user.phone
    } for o in officers])
