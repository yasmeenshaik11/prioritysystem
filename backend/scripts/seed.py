import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from werkzeug.security import generate_password_hash
from app import create_app
from app.extensions import db
from app.models import User, Officer, Complaint, ComplaintStatusHistory, Notification
from app.utils import make_code

app = create_app()

with app.app_context():
    print("Seeding database records...")
    db.create_all()

    # 1. Citizen
    citizen = User.query.filter_by(email='citizen@emergencyai.com').first()
    if not citizen:
        citizen = User(
            full_name='Shaik Citizen',
            email='citizen@emergencyai.com',
            phone='+91 9876543210',
            password_hash=generate_password_hash('Citizen@123'),
            role='citizen',
            area='Banjara Hills, Hyderabad'
        )
        db.session.add(citizen)
        db.session.flush()

    # 2. Officer 1
    officer_user = User.query.filter_by(email='officer@emergencyai.com').first()
    if not officer_user:
        officer_user = User(
            full_name='Rajesh Kumar (Field Officer)',
            email='officer@emergencyai.com',
            phone='+91 9876543211',
            password_hash=generate_password_hash('Officer@123'),
            role='officer',
            area='Central Zone'
        )
        db.session.add(officer_user)
        db.session.flush()
        
        officer_profile = Officer(
            user_id=officer_user.id,
            employee_code='OFF-CIV-101',
            department='Roads & Infrastructure',
            designation='Senior Zonal Officer'
        )
        db.session.add(officer_profile)
        db.session.flush()
    else:
        officer_profile = Officer.query.filter_by(user_id=officer_user.id).first()

    # 3. Officer 2
    officer_user2 = User.query.filter_by(email='sanitation.officer@emergencyai.com').first()
    if not officer_user2:
        officer_user2 = User(
            full_name='Priya Sharma (Sanitation Officer)',
            email='sanitation.officer@emergencyai.com',
            phone='+91 9876543212',
            password_hash=generate_password_hash('Officer@123'),
            role='officer',
            area='North Zone'
        )
        db.session.add(officer_user2)
        db.session.flush()
        
        officer_profile2 = Officer(
            user_id=officer_user2.id,
            employee_code='OFF-SAN-102',
            department='Sanitation & Waste Management',
            designation='Municipal Health Officer'
        )
        db.session.add(officer_profile2)
        db.session.flush()

    # 4. Admin User
    admin_user = User.query.filter_by(email='admin@emergencyai.com').first()
    if not admin_user:
        admin_user = User(
            full_name='System Administrator',
            email='admin@emergencyai.com',
            phone='+91 9876543200',
            password_hash=generate_password_hash('Admin@123'),
            role='admin',
            area='Municipal Headquarters'
        )
        db.session.add(admin_user)
        db.session.flush()

    db.session.commit()

    # 5. Seed diverse sample complaints if none exist
    if Complaint.query.count() == 0:
        samples = [
            {
                'title': 'High Speed Collision at Road Intersection',
                'category': 'Accidents',
                'description': 'Head-on collision between a cargo mini-truck and passenger auto near junction. Two people injured and bleeding, ambulance needed immediately on site.',
                'location': 'Mehdipatnam Junction, Hyderabad',
                'lat': 17.3916, 'lon': 78.4418,
                'ai_cat': 'Accidents',
                'severity': 'Critical',
                'priority': 'Critical',
                'score': 95,
                'dept': 'Emergency Response & Traffic',
                'status': 'In Progress',
                'assigned_to': officer_profile.id if officer_profile else None,
                'days_ago': 1
            },
            {
                'title': 'Huge Banyan Tree Uprooted by Cyclone Winds',
                'category': 'Fallen Trees',
                'description': 'Massive banyan tree fell across the entire two-lane road. Electricity cables are snapped and hanging low. Complete traffic blockage near school.',
                'location': 'Jubilee Hills Check Post, Hyderabad',
                'lat': 17.4319, 'lon': 78.4073,
                'ai_cat': 'Fallen Trees',
                'severity': 'High',
                'priority': 'High',
                'score': 78,
                'dept': 'Disaster Management & Forestry',
                'status': 'Assigned',
                'assigned_to': officer_profile.id if officer_profile else None,
                'days_ago': 2
            },
            {
                'title': 'Deep Pothole Crater on Flyover Descent',
                'category': 'Potholes',
                'description': 'Deep asphalt crater right at flyover exit. Two bikers skidded this morning during rush hour. Serious risk of fatal accidents in rainy conditions.',
                'location': 'PVNR Expressway Pillar 140, Hyderabad',
                'lat': 17.3753, 'lon': 78.4520,
                'ai_cat': 'Potholes',
                'severity': 'High',
                'priority': 'High',
                'score': 74,
                'dept': 'Roads & Infrastructure',
                'status': 'Under Review',
                'assigned_to': None,
                'days_ago': 3
            },
            {
                'title': 'High Pressure Water Pipeline Burst Flooding Road',
                'category': 'Water Leakage',
                'description': 'Main municipal drinking water pipe has ruptured with heavy water gushing onto the avenue. Water is flooding neighboring storefronts and wasting gallons.',
                'location': 'Ameerpet Main Road near Metro Station',
                'lat': 17.4375, 'lon': 78.4483,
                'ai_cat': 'Water Leakage',
                'severity': 'High',
                'priority': 'High',
                'score': 70,
                'dept': 'Water Supply & Sewerage',
                'status': 'Submitted',
                'assigned_to': None,
                'days_ago': 1
            },
            {
                'title': 'Open Sewage Drain Overflowing into Market',
                'category': 'Drainage',
                'description': 'Underground sewer blocked and filthy black water is overflowing across the vegetable market lane. Strong toxic stench and severe disease risk.',
                'location': 'Koti Market Lane, Hyderabad',
                'lat': 17.3820, 'lon': 78.4867,
                'ai_cat': 'Drainage',
                'severity': 'High',
                'priority': 'High',
                'score': 68,
                'dept': 'Municipal Engineering & Drainage',
                'status': 'Resolved',
                'assigned_to': officer_profile.id if officer_profile else None,
                'days_ago': 5
            },
            {
                'title': 'Uncollected Garbage Dump Stinking Beside School',
                'category': 'Garbage',
                'description': 'Piles of domestic solid waste and commercial garbage have accumulated for 5 days. Flies and stray animals creating unhealthy nuisance beside primary school.',
                'location': 'Begumpet Airport Road, Hyderabad',
                'lat': 17.4448, 'lon': 78.4682,
                'ai_cat': 'Garbage',
                'severity': 'Medium',
                'priority': 'Medium',
                'score': 52,
                'dept': 'Sanitation & Waste Management',
                'status': 'Assigned',
                'assigned_to': officer_profile.id if officer_profile else None,
                'days_ago': 2
            },
            {
                'title': 'Five Consecutive Streetlights Dark at Busy Crossroad',
                'category': 'Streetlights',
                'description': 'Street lighting array completely non-operational for past one week. Pedestrians struggle to cross after sunset and crime hazard is elevated.',
                'location': 'Hitec City Phase 2 road',
                'lat': 17.4435, 'lon': 78.3772,
                'ai_cat': 'Streetlights',
                'severity': 'Medium',
                'priority': 'Medium',
                'score': 48,
                'dept': 'Electrical & Lighting Services',
                'status': 'In Progress',
                'assigned_to': officer_profile.id if officer_profile else None,
                'days_ago': 4
            },
            {
                'title': 'Illegal Banner Encroaching Pedestrian Walkway',
                'category': 'Others',
                'description': 'Large advertising flex hoarding erected across public footpath blocking elderly and stroller passage.',
                'location': 'Somajiguda Circle, Hyderabad',
                'lat': 17.4260, 'lon': 78.4580,
                'ai_cat': 'Others',
                'severity': 'Low',
                'priority': 'Low',
                'score': 28,
                'dept': 'General Civic Administration',
                'status': 'Rejected',
                'assigned_to': None,
                'days_ago': 6
            }
        ]

        for s in samples:
            created_time = datetime.utcnow() - timedelta(days=s['days_ago'])
            comp = Complaint(
                complaint_code=make_code(),
                citizen_id=citizen.id,
                title=s['title'],
                category=s['category'],
                description=s['description'],
                reported_location=s['location'],
                latitude=s['lat'],
                longitude=s['lon'],
                ai_category=s['ai_cat'],
                ai_severity=s['severity'],
                urgency_score=s['score'],
                priority=s['priority'],
                department=s['dept'],
                status=s['status'],
                assigned_to=s['assigned_to'],
                remarks='Triage and assignment executed by system.',
                created_at=created_time,
                updated_at=created_time
            )
            db.session.add(comp)
            db.session.flush()

            # Status history
            db.session.add(ComplaintStatusHistory(
                complaint_id=comp.id,
                old_status=None,
                new_status='Submitted',
                changed_by=citizen.id,
                remarks='Complaint registered by citizen',
                created_at=created_time
            ))
            if s['status'] != 'Submitted':
                db.session.add(ComplaintStatusHistory(
                    complaint_id=comp.id,
                    old_status='Submitted',
                    new_status=s['status'],
                    changed_by=officer_user.id,
                    remarks=f'Processed to {s["status"]}',
                    created_at=created_time + timedelta(hours=2)
                ))

            # Sample notification
            db.session.add(Notification(
                user_id=citizen.id,
                complaint_id=comp.id,
                title=f'Complaint #{comp.complaint_code} Update',
                message=f'Status is {comp.status} ({comp.priority} Priority). Assigned to {comp.department}.',
                is_read=s['days_ago'] > 2,
                created_at=created_time
            ))

        db.session.commit()
        print(f"Successfully seeded {len(samples)} realistic complaints across all 8 categories and 6 statuses!")

    print("Seed complete.")
