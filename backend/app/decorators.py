from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from flask import jsonify

def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get('role', 'citizen')
            
            allowed = set(roles)
            # Admin role can perform any officer action
            if 'officer' in allowed:
                allowed.add('admin')
            
            if user_role not in allowed:
                return jsonify({'error': f'Forbidden: Role {user_role} is not authorized for this resource'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
