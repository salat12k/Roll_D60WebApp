from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///markers.db'
db = SQLAlchemy(app)

class Marker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    added_by = db.Column(db.String(50), nullable=False)

class Fog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lat1 = db.Column(db.Float, nullable=False)
    lng1 = db.Column(db.Float, nullable=False)
    lat2 = db.Column(db.Float, nullable=False)
    lng2 = db.Column(db.Float, nullable=False)
    scale = db.Column(db.Float, nullable=False)

# Add this route to serve the home page
@app.route('/')
def home():
    return render_template('home.html')

# Update the route for your map application
@app.route('/dndworldmap')
def dndworldmap():
    return render_template('index.html')
def add_marker():
    data = request.json
    new_marker = Marker(lat=data['lat'], lng=data['lng'], category=data['category'], description=data.get('description', ''), added_by=data['added_by'])
    db.session.add(new_marker)
    db.session.commit()
    return jsonify({"id": new_marker.id})

@app.route('/remove_marker', methods=['POST'])
def remove_marker():
    data = request.json
    marker = Marker.query.filter_by(lat=data['lat'], lng=data['lng']).first()
    if marker:
        db.session.delete(marker)
        db.session.commit()
        return jsonify({"message": "Marker removed"})
    return jsonify({"message": "Marker not found"}), 404

@app.route('/update_marker_description', methods=['POST'])
def update_marker_description():
    data = request.json
    marker = db.session.get(Marker, data['id'])
    if marker:
        marker.description = data['description']
        db.session.commit()
        return jsonify({"message": "Marker description updated"})
    return jsonify({"message": "Marker not found"}), 404

@app.route('/get_markers', methods=['GET'])
def get_markers():
    markers = Marker.query.all()
    return jsonify([{"id": marker.id, "lat": marker.lat, "lng": marker.lng, "category": marker.category, "description": marker.description, "added_by": marker.added_by} for marker in markers])

@app.route('/add_fog', methods=['POST'])
def add_fog():
    data = request.json
    if data.get('delete'):
        fog = db.session.get(Fog, data['id'])
        if fog:
            db.session.delete(fog)
            db.session.commit()
            return jsonify({"message": "Fog removed"})
        return jsonify({"message": "Fog not found"}), 404
    else:
        if data.get('id'):
            fog = db.session.get(Fog, data['id'])
            if fog:
                fog.lat1 = data['lat1']
                fog.lng1 = data['lng1']
                fog.lat2 = data['lat2']
                fog.lng2 = data['lng2']
                fog.scale = data['scale']
                db.session.commit()
                return jsonify({"message": "Fog updated", "id": fog.id})
            return jsonify({"message": "Fog not found"}), 404
        else:
            new_fog = Fog(lat1=data['lat1'], lng1=data['lng1'], lat2=data['lat2'], lng2=data['lng2'], scale=data['scale'])
            db.session.add(new_fog)
            db.session.commit()
            return jsonify({"id": new_fog.id})

@app.route('/get_fog', methods=['GET'])
def get_fog():
    fogs = Fog.query.all()
    return jsonify([{"id": fog.id, "lat1": fog.lat1, "lng1": fog.lng1, "lat2": fog.lat2, "lng2": fog.lng2, "scale": fog.scale} for fog in fogs])

@app.route('/delete_all_fog', methods=['POST'])
def delete_all_fog():
    Fog.query.delete()
    db.session.commit()
    return jsonify({"message": "All fog data deleted"})

@app.route('/delete_all_markers', methods=['POST'])
def delete_all_markers():
    Marker.query.delete()
    db.session.commit()
    return jsonify({"message": "All markers deleted"})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
