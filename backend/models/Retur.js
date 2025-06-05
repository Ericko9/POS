// models/Retur.js
const mongoose = require('mongoose');

const ReturSchema = new mongoose.Schema({
  notaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nota',
    required: true
  },
  nomorNota: {
    type: String,
    required: true
  },
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
  jumlahRetur: {
    type: Number,
    required: true,
    min: 1
  },
  hargaSatuan: {
    type: Number,
    required: true
  },
  potonganHarga: {
    type: Number,
    default: 0
  },
  kondisi: {
    type: String,
    enum: ['bagus', 'rusak'],
    required: true
  },
  alasan: {
    type: String,
    required: true
  },
  tanggal: {
    type: Date,
    default: Date.now
  },
  kasirId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Virtual field untuk jumlah pembayaran yang dikembalikan
ReturSchema.virtual('nilaiRetur').get(function() {
  // Hanya kembalikan uang jika barang dikembalikan dalam kondisi bagus
  if (this.kondisi === 'bagus') {
    const hargaSetelahDiskon = this.hargaSatuan - (this.potonganHarga || 0);
    return hargaSetelahDiskon * this.jumlahRetur;
  }
  return 0;
});

module.exports = mongoose.model('Retur', ReturSchema);