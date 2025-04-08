from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import mysql.connector

app = Flask(__name__)
CORS(app)

app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Koneksi database
try:
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="inventory"
    )
    cursor = db.cursor(dictionary=True)
except mysql.connector.Error as err:
    print(f"Error connecting to MySQL: {err}")
    # Handle error sesuai kebutuhan aplikasi Anda
    exit()

# Route untuk tampilkan halaman index.html
@app.route("/")
def index():
    return render_template("index.html")

# Endpoint tampil semua barang
@app.route("/api/barang", methods=["GET"])
def get_all():
    try:
        cursor.execute("SELECT * FROM barang")
        result = cursor.fetchall()
        return jsonify(result)
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

# Endpoint tampil satu barang
@app.route("/api/barang/<int:id>", methods=["GET"])
def get_one(id):
    try:
        cursor.execute("SELECT * FROM barang WHERE id = %s", (id,))
        result = cursor.fetchone()
        if result:
            return jsonify(result)
        return jsonify({"message": "Barang tidak ditemukan"}), 404
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

# Tambah barang
@app.route("/api/barang", methods=["POST"])
def add():
    if 'nama' not in request.form or 'jumlah' not in request.form or 'kategori' not in request.form:
        return jsonify({"error": "Nama, jumlah, dan kategori harus diisi"}), 400

    nama = request.form["nama"]
    jumlah = request.form["jumlah"]
    kategori = request.form["kategori"]
    foto_filename = None
    if 'foto' in request.files:
        foto = request.files["foto"]
        if foto.filename != '':
            filename = secure_filename(foto.filename)
            foto.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            foto_filename = filename

    try:
        cursor.execute("INSERT INTO barang (nama, jumlah, kategori, foto) VALUES (%s, %s, %s, %s)",
                       (nama, jumlah, kategori, foto_filename))
        db.commit()
        return jsonify({"message": "Barang ditambahkan"}), 201
    except mysql.connector.Error as err:
        db.rollback()
        return jsonify({"error": str(err)}), 500

# Update barang
@app.route("/api/barang/<int:id>", methods=["PUT"])
def update(id):
    if 'nama' not in request.form or 'jumlah' not in request.form or 'kategori' not in request.form:
        return jsonify({"error": "Nama, jumlah, dan kategori harus diisi"}), 400

    nama = request.form["nama"]
    jumlah = request.form["jumlah"]
    kategori = request.form["kategori"]
    foto_filename = None

    if 'foto' in request.files:
        foto = request.files["foto"]
        if foto.filename != '':
            filename = secure_filename(foto.filename)
            foto.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            foto_filename = filename

    try:
        if foto_filename:
            cursor.execute("UPDATE barang SET nama=%s, jumlah=%s, kategori=%s, foto=%s WHERE id=%s",
                           (nama, jumlah, kategori, foto_filename, id))
        else:
            cursor.execute("UPDATE barang SET nama=%s, jumlah=%s, kategori=%s WHERE id=%s",
                           (nama, jumlah, kategori, id))
        db.commit()
        if cursor.rowcount > 0:
            return jsonify({"message": "Barang diperbarui"}), 200
        return jsonify({"message": "Barang tidak ditemukan"}), 404
    except mysql.connector.Error as err:
        db.rollback()
        return jsonify({"error": str(err)}), 500

# Hapus barang
@app.route("/api/barang/<int:id>", methods=["DELETE"])
def delete(id):
    try:
        cursor.execute("DELETE FROM barang WHERE id=%s", (id,))
        db.commit()
        if cursor.rowcount > 0:
            return jsonify({"message": "Barang dihapus"}), 200
        return jsonify({"message": "Barang tidak ditemukan"}), 404
    except mysql.connector.Error as err:
        db.rollback()
        return jsonify({"error": str(err)}), 500

# Serve gambar
@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == "__main__":
    app.run(debug=True)