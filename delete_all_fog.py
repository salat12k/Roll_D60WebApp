import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'markers.db')

db = SQLAlchemy(app)

class FogOfWar(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lat1 = db.Column(db.Float, nullable=False)
    lng1 = db.Column(db.Float, nullable=False)
    lat2 = db.Column(db.Float, nullable=False)
    lng2 = db.Column(db.Float, nullable=False)

with app.app_context():
    # Delete all entries in the FogOfWar table
    db.session.query(FogOfWar).delete()
    db.session.commit()
    print("All fog data deleted.")
