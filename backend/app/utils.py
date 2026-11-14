from datetime import datetime
from werkzeug.utils import secure_filename
import uuid
from flask import current_app
from .models import Notification
from .extensions import db

ALLOWED_EXTENSIONS = {'jpg','jpeg','png','webp'}

def save_upload(file):
    if not file or not file.filename:
        return None
    ext = file.filename.rsplit('.', 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError('Only JPG, JPEG, PNG and WEBP images are allowed.')
    filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
    file.save(f"{current_app.config['UPLOAD_FOLDER']}/{filename}")
    return filename

def make_code():
    return f"EAI-{datetime.utcnow():%Y%m%d%H%M%S}-{uuid.uuid4().hex[:6].upper()}"

def notify(user_id, complaint_id, title, message):
    db.session.add(Notification(user_id=user_id, complaint_id=complaint_id, title=title, message=message))
