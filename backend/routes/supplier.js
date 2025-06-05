// routes/supplier.js
const express = require('express');
const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');
const Pasokan = require('../models/Pasokan');
const Barang = require('../models/Barang');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// Get all suppliers with pagination and filters
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, sort } = req.query;
    
    // Build filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { nama: { $regex: search, $options: 'i' } },
        { noHp: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort
    let sortOption = { nama: 1 }; // Default sort by name ascending
    
    if (sort) {
      const [field, order] = sort.split('_');
      
      if (field === 'nama') {
        sortOption = { nama: order === 'asc' ? 1 : -1 };
      } else if (field === 'created') {
        sortOption = { createdAt: order === 'asc' ? 1 : -1 };
      }
    }
    
    // Get total count
    const total = await Supplier.countDocuments(filter);
    
    // Get suppliers
    const suppliers = await Supplier.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    // Check payment status for each supplier
    const suppliersWithStatus = await Promise.all(
      suppliers.map(async (supplier) => {
        const s = supplier.toObject();
        
        // Check for overdue payments
        const overdueCount = await Pasokan.countDocuments({
          supplierId: supplier._id,
          statusPembayaran: 'belum dibayar',
          tanggalJatuhTempo: { $lt: new Date() }
        });
        
        // Check for pending payments
        const pendingCount = await Pasokan.countDocuments({
          supplierId: supplier._id,
          statusPembayaran: 'belum dibayar',
          tanggalJatuhTempo: { $gte: new Date() }
        });
        
        s.hasOverduePayments = overdueCount > 0;
        s.hasPendingPayments = pendingCount > 0;
        
        return s;
      })
    );
    
    res.json({
      suppliers: suppliersWithStatus,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Get due payments
router.get('/due-payments', auth, adminOnly, async (req, res) => {
  try {
    // Get due soon payments (due in 7 days or already overdue)
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    
    const dueSoonPayments = await Pasokan.find({
      statusPembayaran: 'belum dibayar',
      tanggalJatuhTempo: { $lte: sevenDaysLater }
    })
      .sort({ tanggalJatuhTempo: 1 })
      .populate('supplierId', 'nama');
    
    // Format response
    const formattedPayments = dueSoonPayments.map(payment => {
      const p = payment.toObject();
      p.supplier = p.supplierId;
      delete p.supplierId;
      return p;
    });
    
    res.json(formattedPayments);
  } catch (error) {
    console.error('Get due payments error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Get supplier by ID
router.get('/:id', auth, adminOnly, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    }
    
    res.json(supplier);
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Get supplier supplies
router.get('/:id/supplies', auth, adminOnly, async (req, res) => {
  try {
    const supplierId = req.params.id;
    
    // Get supplies
    const supplies = await Pasokan.find({ supplierId })
      .sort({ tanggalPasok: -1 });
    
    // Get total count
    const total = supplies.length;
    
    // Calculate total purchase
    const totalPurchase = supplies.reduce((acc, supply) => acc + supply.totalHarga, 0);
    
    // Populate items with barang info
    const suppliesWithItems = await Promise.all(
      supplies.map(async (supply) => {
        const s = supply.toObject();
        
        // Get barang info for each item
        s.items = await Promise.all(
          s.items.map(async (item) => {
            const barang = await Barang.findById(item.barangId).select('nama');
            return {
              ...item,
              barang: barang || { nama: 'Barang tidak tersedia' }
            };
          })
        );
        
        return s;
      })
    );
    
    res.json({
      supplies: suppliesWithItems,
      total,
      totalPurchase
    });
  } catch (error) {
    console.error('Get supplier supplies error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Mark supply as paid
router.put('/supply/:id/paid', auth, adminOnly, async (req, res) => {
  try {
    // Find supply
    const supply = await Pasokan.findById(req.params.id);
    
    if (!supply) {
      return res.status(404).json({ message: 'Pasokan tidak ditemukan' });
    }
    
    // Update payment status
    supply.statusPembayaran = 'sudah dibayar';
    supply.updatedAt = Date.now();
    
    await supply.save();
    res.json({ message: 'Pasokan berhasil ditandai sebagai lunas' });
  } catch (error) {
    console.error('Mark supply as paid error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Create supplier
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { nama, alamat, noHp, email, catatanKinerja } = req.body;
    
    // Create new supplier
    const supplier = new Supplier({
      nama,
      alamat,
      noHp,
      email,
      catatanKinerja
    });
    
    await supplier.save();
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Create supply
router.post('/supply', auth, adminOnly, async (req, res) => {
  try {
    const { supplierId, tanggalPasok, tanggalJatuhTempo, items, totalHarga } = req.body;
    
    // Check if supplier exists
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(400).json({ message: 'Supplier tidak valid' });
    }
    
    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Minimal satu barang harus diisi' });
    }
    
    // Check if all barangs exist
    for (const item of items) {
      const barang = await Barang.findById(item.barangId);
      if (!barang) {
        return res.status(400).json({ message: `Barang dengan ID ${item.barangId} tidak ditemukan` });
      }
    }
    
    // Create new supply
    const supply = new Pasokan({
      supplierId,
      tanggalPasok,
      tanggalJatuhTempo,
      items,
      totalHarga,
      statusPembayaran: 'belum dibayar'
    });
    
    await supply.save();
    
    // Update barang stock
    for (const item of items) {
      await Barang.findByIdAndUpdate(
        item.barangId,
        { $inc: { stokBagus: item.jumlah } }
      );
    }
    
    res.status(201).json(supply);
  } catch (error) {
    console.error('Create supply error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Update supplier
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { nama, alamat, noHp, email, catatanKinerja } = req.body;
    
    // Check if supplier exists
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    }
    
    // Update supplier
    supplier.nama = nama;
    supplier.alamat = alamat;
    supplier.noHp = noHp;
    supplier.email = email;
    supplier.catatanKinerja = catatanKinerja;
    supplier.updatedAt = Date.now();
    
    await supplier.save();
    res.json(supplier);
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Delete supplier
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    console.log(`[DELETE] Menghapus supplier dengan ID: ${req.params.id}`);
    
    // Check if supplier exists
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      console.log(`[DELETE] Supplier dengan ID ${req.params.id} tidak ditemukan`);
      return res.status(404).json({ message: 'Supplier tidak ditemukan' });
    }
    
    console.log(`[DELETE] Supplier ditemukan: ${supplier.nama}`);
    
    // Check if supplier has supplies - konversi ID dengan aman
    let supplierId = req.params.id;
    
    // Jika menggunakan ObjectId, pastikan valid
    try {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        supplierId = new mongoose.Types.ObjectId(req.params.id);
      }
    } catch (err) {
      console.error('[DELETE] Error saat membuat ObjectId untuk supplier:', err);
      // Tetap gunakan ID string jika gagal konversi
    }
    
    console.log(`[DELETE] Memeriksa referensi pasokan untuk supplier ID: ${supplierId}`);
    
    // Gunakan agregasi untuk pengecekan yang lebih aman
    const pasokanCheck = await Pasokan.aggregate([
      { 
        $match: { 
          $expr: { 
            $eq: [
              { $toString: '$supplierId' }, 
              req.params.id
            ] 
          } 
        } 
      },
      { $limit: 1 }
    ]);
    
    const suppliesCount = pasokanCheck.length;
    console.log(`[DELETE] Jumlah pasokan yang mereferensikan supplier: ${suppliesCount}`);
    
    if (suppliesCount > 0) {
      console.log(`[DELETE] Supplier tidak dapat dihapus karena memiliki data pasokan`);
      return res.status(400).json({
        message: 'Supplier tidak dapat dihapus karena memiliki data pasokan'
      });
    }
    
    // Delete supplier - Gunakan deleteOne() sebagai pengganti remove()
    console.log(`[DELETE] Menghapus supplier dari database...`);
    const deleteResult = await Supplier.deleteOne({ _id: req.params.id });
    console.log(`[DELETE] Hasil penghapusan supplier: ${JSON.stringify(deleteResult)}`);
    
    res.json({ message: 'Supplier berhasil dihapus' });
  } catch (error) {
    console.error('[DELETE] Error saat menghapus supplier:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;