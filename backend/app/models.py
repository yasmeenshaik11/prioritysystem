from datetime import datetime
from .extensions import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False)
    phone = db.Column(db.String(25))
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='citizen')  # 'citizen', 'officer', 'admin'
    area = db.Column(db.String(120))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    complaints = db.relationship('Complaint', backref='citizen', foreign_keys='Complaint.citizen_id')

class Officer(db.Model):
    __tablename__ = 'officers'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    employee_code = db.Column(db.String(60), unique=True)
    department = db.Column(db.String(120))
    designation = db.Column(db.String(120))
    
    user = db.relationship('User', backref=db.backref('officer_profile', uselist=False))

class Complaint(db.Model):
    __tablename__ = 'complaints'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    complaint_code = db.Column(db.String(40), unique=True, nullable=False)
    citizen_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(180))
    category = db.Column(db.String(80))
    description = db.Column(db.Text, nullable=False)
    reported_location = db.Column(db.String(255))
    latitude = db.Column(db.Numeric(10, 7))
    longitude = db.Column(db.Numeric(10, 7))
    image_path = db.Column(db.String(255))
    ai_category = db.Column(db.String(80))
    ai_severity = db.Column(db.String(30))  # Critical, High, Medium, Low
    urgency_score = db.Column(db.Integer)   # 1 - 100
    priority = db.Column(db.String(20))     # Critical, High, Medium, Low
    department = db.Column(db.String(120))
    duplicate_of = db.Column(db.Integer, db.ForeignKey('complaints.id'), nullable=True)
    status = db.Column(db.String(40), default='Submitted', nullable=False) # Submitted, Under Review, Assigned, In Progress, Resolved, Rejected
    assigned_to = db.Column(db.Integer, db.ForeignKey('officers.id'), nullable=True)
    remarks = db.Column(db.Text)
    resolution_image_path = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_officer = db.relationship('Officer', foreign_keys=[assigned_to], backref='assigned_complaints')

class ComplaintStatusHistory(db.Model):
    __tablename__ = 'complaint_status_history'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id', ondelete='CASCADE'), nullable=False)
    old_status = db.Column(db.String(40))
    new_status = db.Column(db.String(40), nullable=False)
    changed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    changed_by_user = db.relationship('User', foreign_keys=[changed_by])

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id', ondelete='SET NULL'), nullable=True)
    title = db.Column(db.String(180), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
