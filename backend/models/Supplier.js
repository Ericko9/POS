// models/Supplier.js
const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
    trim: true
  },
  alamat: String,
  noHp: String,
  email: String,
  catatanKinerja: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Supplier', supplierSchema);