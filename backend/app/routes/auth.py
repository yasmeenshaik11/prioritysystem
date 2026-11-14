from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
import re
from ..extensions import db
from ..models import User, Officer

auth_bp = Blueprint('auth', __name__)

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

@auth_bp.post('/register')
def register():
    data = request.get_json() or {}
    full_name = (data.get('full_name') or '').strip()
    email = (data.get('email') or '').lower().strip()
    password = data.get('password') or ''
    phone = (data.get('phone') or '').strip()
    area = (data.get('area') or '').strip()

    if not full_name:
        return jsonify({'error': 'Full name is required'}), 400
    if not email or not EMAIL_REGEX.match(email):
        return jsonify({'error': 'Valid email address is required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists'}), 409

    user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        password_hash=generate_password_hash(password),
        role='citizen',
        area=area or 'General City Area'
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({
        'message': 'Citizen account registered successfully',
        'user': {
            'id': user.id,
            'name': user.full_name,
            'email': user.email,
            'role': user.role,
            'area': user.area
        }
    }), 201

@auth_bp.post('/login')
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').lower().strip()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = create_access_token(
        identity=str(user.id),
        additional_claims={
            'role': user.role,
            'name': user.full_name,
            'email': user.email
        }
    )

    return jsonify({
        'access_token': token,
        'user': {
            'id': user.id,
            'name': user.full_name,
            'email': user.email,
            'role': user.role,
            'area': user.area
        }
    }), 200

@auth_bp.get('/me')
@jwt_required()
def me():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'id': user.id,
        'name': user.full_name,
        'email': user.email,
        'role': user.role,
        'area': user.area,
        'phone': user.phone
    }), 200
