from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import desc
from ..decorators import role_required
from ..extensions import db
from ..models import Notification

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.get('')
@role_required('citizen', 'officer', 'admin')
def list_notifications():
    uid = int(get_jwt_identity())
    rows = Notification.query.filter_by(user_id=uid).order_by(desc(Notification.created_at)).limit(50).all()
    unread_count = Notification.query.filter_by(user_id=uid, is_read=False).count()
    
    return jsonify({
        'unread_count': unread_count,
        'notifications': [{
            'id': n.id,
            'complaint_id': n.complaint_id,
            'title': n.title,
            'message': n.message,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat()
        } for n in rows]
    })

@notifications_bp.patch('/<int:notification_id>/read')
@role_required('citizen', 'officer', 'admin')
def mark_read(notification_id):
    uid = int(get_jwt_identity())
    n = Notification.query.filter_by(id=notification_id, user_id=uid).first_or_404()
    n.is_read = True
    db.session.commit()
    return jsonify({'message': 'Notification marked as read', 'id': n.id})

@notifications_bp.post('/read-all')
@role_required('citizen', 'officer', 'admin')
def mark_all_read():
    uid = int(get_jwt_identity())
    Notification.query.filter_by(user_id=uid, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'})
