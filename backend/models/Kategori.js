// models/Kategori.js
const mongoose = require('mongoose');

const kategoriSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  deskripsi: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Kategori', kategoriSchema);