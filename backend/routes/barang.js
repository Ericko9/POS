// routes/barang.js
const express = require('express');
const mongoose = require('mongoose');
const Barang = require('../models/Barang');
const Kategori = require('../models/Kategori');
const Nota = require('../models/Nota');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// Helper function to process promo data consistently
const processPromo = (barang) => {
  const b = barang.toObject();
  
  // Check if promo is active
  if (b.promo && new Date(b.promo.tanggalBerakhir) < new Date()) {
    b.promo.isActive = false;
  } else if (b.promo) {
    b.promo.isActive = true;
    
    // Calculate discounted price based on available fields
    if (b.promo.potonganHarga !== undefined) {
      b.hargaSetelahDiskon = b.harga - b.promo.potonganHarga;
    } else if (b.promo.persentaseDiskon !== undefined) {
      b.hargaSetelahDiskon = b.harga * (1 - (b.promo.persentaseDiskon / 100));
    }
    
    if (b.hargaSetelahDiskon < 0) b.hargaSetelahDiskon = 0;
  }
  
  return b;
};

// Get all barangs with pagination and filters
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, kategoriId, sort } = req.query;
    
    // Build filter
    const filter = {};
    
    if (search) {
      filter.nama = { $regex: search, $options: 'i' };
    }
    
    if (kategoriId) {
      filter.kategoriId = kategoriId;
    }
    
    // Build sort
    let sortOption = { nama: 1 }; // Default sort by name ascending
    
    if (sort) {
      const [field, order] = sort.split('_');
      
      if (field === 'nama') {
        sortOption = { nama: order === 'asc' ? 1 : -1 };
      } else if (field === 'harga') {
        sortOption = { harga: order === 'asc' ? 1 : -1 };
      } else if (field === 'stok') {
        sortOption = { stokBagus: order === 'asc' ? 1 : -1 };
      }
    }
    
    // Get total count
    const total = await Barang.countDocuments(filter);
    
    // Get barangs
    const barangs = await Barang.find(filter)
      .populate('kategoriId', 'nama')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    // Prepare response
    const processedBarangs = barangs.map(barang => {
      const b = processPromo(barang);
      
      // Rename kategoriId to kategori for frontend
      b.kategori = b.kategoriId;
      delete b.kategoriId;
      
      return b;
    });
    
    res.json({
      barangs: processedBarangs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get barangs error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// PENTING: Rute spesifik harus ditempatkan SEBELUM rute parameter
// Search barangs
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.json([]);
    }
    
    const barangs = await Barang.find({
      nama: { $regex: query, $options: 'i' },
      stokBagus: { $gt: 0 }
    })
      .populate('kategoriId', 'nama')
      .select('nama grade harga stokBagus promo kategoriId')
      .limit(10)
      .sort({ nama: 1 });
    
    // Process barangs
    const processedBarangs = barangs.map(barang => {
      const b = processPromo(barang);
      
      // Rename kategoriId to kategori for frontend
      b.kategori = b.kategoriId;
      delete b.kategoriId;
      
      return b;
    });
    
    res.json(processedBarangs);
  } catch (error) {
    console.error('Search barangs error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Get all barangs (no pagination) for dropdown
router.get('/list', auth, async (req, res) => {
  try {
    const barangs = await Barang.find() // Allow all items to be in the list
      .select('nama grade harga stokBagus minStok promo')
      .sort({ nama: 1 });
    
    // Process barangs
    const processedBarangs = barangs.map(barang => processPromo(barang));
    
    res.json(processedBarangs);
  } catch (error) {
    console.error('Get barang list error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Get barang by ID (Harus ditempatkan SETELAH rute spesifik lainnya)
router.get('/:id', auth, async (req, res) => {
  try {
    const barang = await Barang.findById(req.params.id)
      .populate('kategoriId', 'nama');
    
    if (!barang) {
      return res.status(404).json({ message: 'Barang tidak ditemukan' });
    }
    
    // Process barang
    const result = processPromo(barang);
    
    // Rename kategoriId to kategori for frontend
    result.kategori = result.kategoriId;
    delete result.kategoriId;
    
    res.json(result);
  } catch (error) {
    console.error('Get barang error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Get barang sales history
router.get('/:id/sales', auth, async (req, res) => {
  try {
    const barangId = req.params.id;
    
    // Get sales history
    const salesHistory = await Nota.aggregate([
      // Match notas that contain the barang
      { $match: { 'items.barangId': mongoose.Types.ObjectId(barangId) } },
      // Unwind items array
      { $unwind: '$items' },
      // Match only the specific barang
      { $match: { 'items.barangId': mongoose.Types.ObjectId(barangId) } },
      // Lookup kasir info
      {
        $lookup: {
          from: 'users',
          localField: 'kasirId',
          foreignField: '_id',
          as: 'kasir'
        }
      },
      // Unwind kasir array
      { $unwind: '$kasir' },
      // Project needed fields
      {
        $project: {
          _id: 1,
          notaId: '$_id',
          nomorNota: 1,
          tanggal: 1,
          namaPelanggan: 1,
          namaKasir: '$kasir.nama',
          namaBarang: '$items.namaBarang',
          jumlah: '$items.jumlah',
          hargaSatuan: '$items.hargaSatuan',
          diskon: '$items.diskon',
          totalHarga: '$items.subtotal'
        }
      },
      // Sort by date descending
      { $sort: { tanggal: -1 } },
      // Limit to 20 records
      { $limit: 20 }
    ]);
    
    // Get monthly stats
    const salesStats = await Nota.aggregate([
      // Match notas that contain the barang
      { $match: { 'items.barangId': mongoose.Types.ObjectId(barangId) } },
      // Unwind items array
      { $unwind: '$items' },
      // Match only the specific barang
      { $match: { 'items.barangId': mongoose.Types.ObjectId(barangId) } },
      // Group by month
      {
        $group: {
          _id: {
            year: { $year: '$tanggal' },
            month: { $month: '$tanggal' }
          },
          jumlah: { $sum: '$items.jumlah' },
          totalPendapatan: { $sum: '$items.subtotal' }
        }
      },
      // Project in readable format
      {
        $project: {
          _id: 0,
          bulan: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' }
                }
              }
            ]
          },
          jumlah: 1,
          totalPendapatan: 1
        }
      },
      // Sort by year and month
      { $sort: { bulan: 1 } },
      // Limit to last 12 months
      { $limit: 12 }
    ]);
    
    res.json({
      history: salesHistory,
      stats: salesStats
    });
  } catch (error) {
    console.error('Get barang sales error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Create barang
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const {
      nama,
      kategoriId,
      grade,
      harga,
      stokBagus,
      stokRusak,
      minStok,
      promo
    } = req.body;
    
    // Check if kategori exists
    const kategori = await Kategori.findById(kategoriId);
    if (!kategori) {
      return res.status(400).json({ message: 'Kategori tidak valid' });
    }
    
    // Create new barang
    const barangData = {
      nama,
      kategoriId,
      grade,
      harga,
      stokBagus: stokBagus || 0,
      stokRusak: stokRusak || 0,
      minStok: minStok || 5
    };
    
    // Handle promo data - support both structures
    if (promo) {
      barangData.promo = {};
      
      // Handle potonganHarga (new structure)
      if (promo.potonganHarga !== undefined) {
        barangData.promo.potonganHarga = promo.potonganHarga;
      }
      
      // Handle persentaseDiskon (old structure)
      if (promo.persentaseDiskon !== undefined) {
        barangData.promo.persentaseDiskon = promo.persentaseDiskon;
      }
      
      // Common promo fields
      barangData.promo.tanggalMulai = promo.tanggalMulai;
      barangData.promo.tanggalBerakhir = promo.tanggalBerakhir;
      barangData.promo.keterangan = promo.keterangan;
    }
    
    const barang = new Barang(barangData);
    
    await barang.save();
    
    // Process saved barang for response
    const result = processPromo(barang);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Create barang error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Update barang
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const {
      nama,
      kategoriId,
      grade,
      harga,
      stokBagus,
      stokRusak,
      minStok,
      promo
    } = req.body;
    
    // Check if barang exists
    const barang = await Barang.findById(req.params.id);
    if (!barang) {
      return res.status(404).json({ message: 'Barang tidak ditemukan' });
    }
    
    // Check if kategori exists
    if (kategoriId !== barang.kategoriId.toString()) {
      const kategori = await Kategori.findById(kategoriId);
      if (!kategori) {
        return res.status(400).json({ message: 'Kategori tidak valid' });
      }
    }
    
    // Update barang
    barang.nama = nama;
    barang.kategoriId = kategoriId;
    barang.grade = grade;
    barang.harga = harga;
    barang.stokBagus = stokBagus;
    barang.stokRusak = stokRusak;
    barang.minStok = minStok;
    
    // Update promo - support both structures
    if (promo) {
      barang.promo = {};
      
      // Handle potonganHarga (new structure)
      if (promo.potonganHarga !== undefined) {
        barang.promo.potonganHarga = promo.potonganHarga;
      }
      
      // Handle persentaseDiskon (old structure)
      if (promo.persentaseDiskon !== undefined) {
        barang.promo.persentaseDiskon = promo.persentaseDiskon;
      }
      
      // Common promo fields
      barang.promo.tanggalMulai = promo.tanggalMulai;
      barang.promo.tanggalBerakhir = promo.tanggalBerakhir;
      barang.promo.keterangan = promo.keterangan;
    } else {
      barang.promo = undefined;
    }
    
    barang.updatedAt = Date.now();
    
    await barang.save();
    
    // Process updated barang for response
    const result = processPromo(barang);
    
    // Ensure kategoriId is renamed to kategori for frontend
    result.kategori = result.kategoriId;
    delete result.kategoriId;
    
    res.json(result);
  } catch (error) {
    console.error('Update barang error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Delete barang
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    console.log(`[DELETE] Menghapus barang dengan ID: ${req.params.id}`);
    
    // Check if barang exists
    const barang = await Barang.findById(req.params.id);
    if (!barang) {
      console.log(`[DELETE] Barang dengan ID ${req.params.id} tidak ditemukan`);
      return res.status(404).json({ message: 'Barang tidak ditemukan' });
    }
    
    console.log(`[DELETE] Barang ditemukan: ${barang.nama}`);
    
    // Check if barang is used in any nota - Versi yang kompatibel dengan Mongoose 6+
    let barangObjectId;
    try {
      // Jika menggunakan Mongoose v6+
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        barangObjectId = new mongoose.Types.ObjectId(req.params.id);
      } else {
        console.log(`[DELETE] Format ID tidak valid: ${req.params.id}`);
        return res.status(400).json({ message: 'Format ID barang tidak valid' });
      }
    } catch (err) {
      console.error('[DELETE] Error saat membuat ObjectId:', err);
      // Langsung menggunakan string ID sebagai fallback
      barangObjectId = req.params.id;
    }
    
    console.log(`[DELETE] Memeriksa referensi di nota untuk barang: ${barangObjectId}`);
    
    // Cara aman - menggunakan aggregate pipeline
    const notaCheck = await Nota.aggregate([
      { $unwind: '$items' },
      { 
        $match: { 
          $expr: { 
            $eq: [
              { $toString: '$items.barangId' }, 
              req.params.id
            ] 
          } 
        } 
      },
      { $limit: 1 }
    ]);
    
    const notaCount = notaCheck.length;
    console.log(`[DELETE] Jumlah nota yang mereferensikan barang: ${notaCount}`);
    
    if (notaCount > 0) {
      console.log(`[DELETE] Barang tidak dapat dihapus karena digunakan dalam transaksi`);
      return res.status(400).json({
        message: 'Barang tidak dapat dihapus karena sudah digunakan dalam transaksi'
      });
    }
    
    // Delete barang - using modern approach
    console.log(`[DELETE] Menghapus barang dari database...`);
    const deleteResult = await Barang.deleteOne({ _id: req.params.id });
    console.log(`[DELETE] Hasil penghapusan: ${JSON.stringify(deleteResult)}`);
    
    res.json({ message: 'Barang berhasil dihapus' });
  } catch (error) {
    console.error('[DELETE] Error saat menghapus barang:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;