// models/Pasokan.js
const mongoose = require('mongoose');

const pasokanItemSchema = new mongoose.Schema({
  barangId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barang',
    required: true
  },
  jumlah: {
    type: Number,
    required: true,
    min: 1
  },
  hargaSatuan: {
    type: Number,
    required: true,
    min: 0
  }
});

const pasokanSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  tanggalPasok: {
    type: Date,
    required: true
  },
  tanggalJatuhTempo: {
    type: Date,
    required: true
  },
  items: [pasokanItemSchema],
  totalHarga: {
    type: Number,
    required: true,
    min: 0
  },
  statusPembayaran: {
    type: String,
    enum: ['belum dibayar', 'sudah dibayar'],
    default: 'belum dibayar'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pasokan', pasokanSchema);