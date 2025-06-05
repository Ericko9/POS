// models/Nota.js
const mongoose = require('mongoose');

const notaItemSchema = new mongoose.Schema({
  barangId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barang',
    required: true
  },
  namaBarang: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  hargaSatuan: {
    type: Number,
    required: true,
    min: 0
  },
  potonganHarga: {
    type: Number,
    default: 0,
    min: 0
  },
  jumlah: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
});

const notaSchema = new mongoose.Schema({
  nomorNota: {
    type: String,
    required: true,
    unique: true
  },
  tanggal: {
    type: Date,
    required: true,
    default: Date.now
  },
  namaPelanggan: {
    type: String,
    required: true
  },
  noHpPelanggan: {
    type: String,
    required: true
  },
  alamatPelanggan: String,
  kasirId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [notaItemSchema],
  totalHarga: {
    type: Number,
    required: true,
    min: 0
  },
  catatan: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Tambahkan field status pengiriman
  statusPengiriman: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Nota', notaSchema);