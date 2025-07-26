import face_recognition
import cv2
import numpy as np
import base64
import io
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo
import os
from bson import ObjectId
import pickle

app = Flask(__name__)
CORS(app)

MONGODB_URI = os.getenv('MONGO_URL', 'mongodb://localhost:27017/SmartGate')
client = pymongo.MongoClient(MONGODB_URI)
db = client.facial_attendance

ENCODINGS_FILE = 'face_encodings.pkl'

def load_known_encodings():
    """Load known face encodings from file"""
    try:
        with open(ENCODINGS_FILE, 'rb') as f:
            return pickle.load(f)
    except FileNotFoundError:
        return {'encodings': [], 'user_ids': []}

def save_known_encodings(known_encodings):
    """Save known face encodings to file"""
    with open(ENCODINGS_FILE, 'wb') as f:
        pickle.dump(known_encodings, f)

def decode_base64_image(base64_string):
    """Decode base64 image string to numpy array"""
    try:
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        return image
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

def get_face_encoding(image):
    """Extract face encoding from image"""
    try:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_image)

        if not face_locations:
            return None

        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)

        if face_encodings:
            return face_encodings[0]
        return None
    except Exception as e:
        print(f"Error getting face encoding: {e}")
        return None


#     ************* All APIs start****************


@app.route('/recognize', methods=['GET', 'POST'])
def recognize_face():
    if request.method == 'GET':
        return jsonify({'message': 'Send a POST request with {"image": "<base64>"} to recognize a face.'})
    # POST logic below
    try:
        data = request.get_json()
        image_base64 = data.get('image')

        if not image_base64:
            return jsonify({'success': False, 'message': 'No image provided'})

        image = decode_base64_image(image_base64)
        if image is None:
            return jsonify({'success': False, 'message': 'Invalid image format'})

        face_encoding = get_face_encoding(image)
        if face_encoding is None:
            return jsonify({'success': False, 'message': 'No face detected in image'})

        known_data = load_known_encodings()
        known_encodings = known_data['encodings']
        known_user_ids = known_data['user_ids']

        if not known_encodings:
            return jsonify({'success': False, 'message': 'No known faces in database'})

        matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=0.6)
        face_distances = face_recognition.face_distance(known_encodings, face_encoding)

        if True in matches:
            best_match_index = np.argmin(face_distances)
            if matches[best_match_index]:
                user_id = known_user_ids[best_match_index]
                confidence = 1 - face_distances[best_match_index]

                return jsonify({
                    'success': True,
                    'userId': user_id,
                    'confidence': float(confidence),
                    'message': 'Face recognized successfully'
                })

        return jsonify({'success': False, 'message': 'Face not recognized'})

    except Exception as e:
        print(f"Recognition error: {e}")
        return jsonify({'success': False, 'message': f'Recognition failed: {str(e)}'})


@app.route('/encode', methods=['GET', 'POST'])
def encode_face():
    if request.method == 'GET':
        return jsonify({'message': 'Send a POST request with {"image": "<base64>", "userId": "<id>"} to encode a face.'})
    # POST logic below
    try:
        data = request.get_json()
        image_base64 = data.get('image')
        user_id = data.get('userId')

        if not image_base64 or not user_id:
            return jsonify({'success': False, 'message': 'Image and userId required'})

        image = decode_base64_image(image_base64)
        if image is None:
            return jsonify({'success': False, 'message': 'Invalid image format'})

        face_encoding = get_face_encoding(image)
        if face_encoding is None:
            return jsonify({'success': False, 'message': 'No face detected in image'})

        known_data = load_known_encodings()

        if user_id in known_data['user_ids']:
            index = known_data['user_ids'].index(user_id)
            known_data['encodings'][index] = face_encoding.tolist()
        else:
            known_data['encodings'].append(face_encoding.tolist())
            known_data['user_ids'].append(user_id)

        save_known_encodings(known_data)

        encoding_base64 = base64.b64encode(face_encoding.tobytes()).decode('utf-8')

        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'faceEncoding': encoding_base64}}
        )

        return jsonify({
            'success': True,
            'encoding': encoding_base64,
            'message': 'Face encoding saved successfully'
        })

    except Exception as e:
        print(f"Encoding error: {e}")
        return jsonify({'success': False, 'message': f'Encoding failed: {str(e)}'})


@app.route('/load_encodings', methods=['GET', 'POST'])
def load_encodings_from_db():
    if request.method == 'GET':
        return jsonify({'message': 'Send a POST request to load all face encodings from database.'})
    # POST logic below
    try:
        users = db.users.find({'faceEncoding': {'$exists': True, '$ne': None}})

        encodings = []
        user_ids = []

        for user in users:
            try:
                encoding_bytes = base64.b64decode(user['faceEncoding'])
                encoding = np.frombuffer(encoding_bytes, dtype=np.float64)
                encodings.append(encoding.tolist())
                user_ids.append(str(user['_id']))
            except Exception as e:
                print(f"Error loading encoding for user {user['_id']}: {e}")
                continue

        known_data = {'encodings': encodings, 'user_ids': user_ids}
        save_known_encodings(known_data)

        return jsonify({
            'success': True,
            'count': len(encodings),
            'message': f'Loaded {len(encodings)} face encodings'
        })

    except Exception as e:
        print(f"Load encodings error: {e}")
        return jsonify({'success': False, 'message': f'Failed to load encodings: {str(e)}'})

    
    # All APIs end

if __name__ == '__main__':
    print("Starting Facial Recognition Service...")
    print("Loading existing encodings...")

    try:
        load_encodings_from_db()
        print("Encodings loaded successfully")
    except Exception as e:
        print(f"Warning: Could not load encodings from database: {e}")

    app.run(host='0.0.0.0', port=5000, debug=True)
