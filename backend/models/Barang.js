// models/Barang.js
const mongoose = require('mongoose');

const PromoSchema = new mongoose.Schema({
  potonganHarga: {
    type: Number,
    required: true
  },
  tanggalMulai: {
    type: Date,
    required: true
  },
  tanggalBerakhir: {
    type: Date,
    required: true
  },
  keterangan: {
    type: String,
    default: ''
  }
}, { _id: false });

const BarangSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
    trim: true
  },
  kategoriId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kategori',
    required: true
  },
  grade: {
    type: String,
    required: true,
    trim: true
  },
  harga: {
    type: Number,
    required: true,
    min: 0
  },
  stokBagus: {
    type: Number,
    default: 0,
    min: 0
  },
  stokRusak: {
    type: Number,
    default: 0,
    min: 0
  },
  minStok: {
    type: Number,
    default: 5,
    min: 0
  },
  jumlahTerjual: {
    type: Number,
    default: 0,
    min: 0
  },
  promo: {
    type: PromoSchema,
    default: null
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

// Virtual field untuk memeriksa status stok
BarangSchema.virtual('stockStatus').get(function() {
  if (this.stokBagus <= 0) {
    return 'habis';
  } else if (this.stokBagus < this.minStok) {
    return 'menipis';
  } else {
    return 'tersedia';
  }
});

// Virtual untuk total stok
BarangSchema.virtual('totalStok').get(function() {
  return this.stokBagus + this.stokRusak;
});

// Method untuk memeriksa apakah promo aktif
BarangSchema.methods.isPromoActive = function() {
  if (!this.promo) return false;
  
  const now = new Date();
  return (
    this.promo.tanggalMulai <= now && 
    this.promo.tanggalBerakhir >= now
  );
};

// Method untuk mendapatkan harga setelah diskon
BarangSchema.methods.getDiscountedPrice = function() {
  if (!this.isPromoActive()) return this.harga;
  
  const discountedPrice = this.harga - this.promo.potonganHarga;
  return Math.max(0, discountedPrice); // Pastikan harga tidak negatif
};

// Pre-save hook untuk memperbarui updatedAt setiap perubahan
BarangSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Barang', BarangSchema);