// routes/nota.js
const express = require('express');
const mongoose = require('mongoose');
const Nota = require('../models/Nota');
const Barang = require('../models/Barang');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all notas with pagination and filters
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, startDate, endDate, sort } = req.query;
    
    // Build filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { nomorNota: { $regex: search, $options: 'i' } },
        { namaPelanggan: { $regex: search, $options: 'i' } },
        { noHpPelanggan: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (startDate && endDate) {
      filter.tanggal = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Build sort
    let sortOption = { tanggal: -1 }; // Default sort by date descending
    
    if (sort) {
      const [field, order] = sort.split('_');
      
      if (field === 'tanggal') {
        sortOption = { tanggal: order === 'asc' ? 1 : -1 };
      } else if (field === 'totalHarga') {
        sortOption = { totalHarga: order === 'asc' ? 1 : -1 };
      }
    }
    
    // Get total count
    const total = await Nota.countDocuments(filter);
    
    // Get notas
    const notas = await Nota.find(filter)
      .populate('kasirId', 'nama')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    // Format response
    const notasFormatted = notas.map(nota => {
      const n = nota.toObject();
      n.kasir = n.kasirId;
      delete n.kasirId;
      return n;
    });
    
    res.json({
      notas: notasFormatted,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get notas error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// PENTING: Rute spesifik ditempatkan SEBELUM rute dengan parameter
// Search notas
router.get('/search', auth, async (req, res) => {
  try {
    const { nomorNota, noHpPelanggan } = req.query;
    
    // Build filter
    const filter = {};
    
    if (nomorNota) {
      filter.nomorNota = { $regex: nomorNota, $options: 'i' };
    }
    
    if (noHpPelanggan) {
      filter.noHpPelanggan = { $regex: noHpPelanggan, $options: 'i' };
    }
    
    if (Object.keys(filter).length === 0) {
      return res.json([]);
    }
    
    // Get notas
    const notas = await Nota.find(filter)
      .sort({ tanggal: -1 })
      .limit(10);
    
    res.json(notas);
  } catch (error) {
    console.error('Search notas error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Get nota by ID - harus ditempatkan SETELAH rute spesifik
router.get('/:id', auth, async (req, res) => {
  try {
    const nota = await Nota.findById(req.params.id)
      .populate('kasirId', 'nama');
    
    if (!nota) {
      return res.status(404).json({ message: 'Nota tidak ditemukan' });
    }
    
    // Format response
    const notaFormatted = nota.toObject();
    notaFormatted.kasir = notaFormatted.kasirId;
    delete notaFormatted.kasirId;
    
    res.json(notaFormatted);
  } catch (error) {
    console.error('Get nota error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Create new nota
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received nota data:', JSON.stringify(req.body, null, 2));
    
    const {
      nomorNota,
      tanggal,
      namaPelanggan,
      noHpPelanggan,
      alamatPelanggan,
      kasirId,
      items,
      totalHarga,
      catatan
    } = req.body;
    
    // Validasi dasar
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Nota harus memiliki minimal 1 barang' });
    }
    
    // Buat nota baru
    const nota = new Nota({
      nomorNota,
      tanggal: tanggal || new Date(),
      namaPelanggan,
      noHpPelanggan,
      alamatPelanggan,
      kasirId: kasirId || req.user.id,
      items, // Gunakan items langsung dari request
      totalHarga,
      catatan
    });
    
    const savedNota = await nota.save();
    
    // Update stok untuk setiap item
    for (const item of items) {
      await Barang.findByIdAndUpdate(
        item.barangId,
        { 
          $inc: { 
            stokBagus: -item.jumlah,
            jumlahTerjual: item.jumlah // Pastikan jumlahTerjual diperbarui
          } 
        }
      );
      
      console.log(`Updated stock for ${item.namaBarang}: -${item.jumlah} from stokBagus, +${item.jumlah} to jumlahTerjual`);
    }
    
    res.status(201).json(savedNota);
  } catch (error) {
    console.error('Create nota error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server: ' + error.message });
  }
});

// Tambahkan rute baru untuk update status pengiriman
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { statusPengiriman } = req.body;
    
    if (typeof statusPengiriman !== 'boolean') {
      return res.status(400).json({ message: 'Status pengiriman harus berupa boolean' });
    }
    
    const nota = await Nota.findById(req.params.id);
    
    if (!nota) {
      return res.status(404).json({ message: 'Nota tidak ditemukan' });
    }

    // Cek apakah user adalah admin atau pembuat nota
    if (req.user.role !== 'admin' && nota.kasirId.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Anda tidak memiliki akses untuk mengubah status pengiriman nota ini' 
      });
    }
    
    // Update status pengiriman
    nota.statusPengiriman = statusPengiriman;
    await nota.save();
    
    res.json({ 
      message: `Status pengiriman berhasil ${statusPengiriman ? 'diaktifkan' : 'dinonaktifkan'}`,
      nota
    });
  } catch (error) {
    console.error('Update status pengiriman error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Delete nota
router.delete('/:id', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Check if nota exists
    const nota = await Nota.findById(req.params.id).session(session);
    if (!nota) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Nota tidak ditemukan' });
    }
    
    // Only admin can delete nota (changed from previous permission check)
    if (req.user.role !== 'admin') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Hanya admin yang dapat menghapus nota' });
    }
    
    // Restore stock for each item
    for (const item of nota.items) {
      await Barang.findByIdAndUpdate(
        item.barangId,
        {
          $inc: {
            stokBagus: item.jumlah,
            jumlahTerjual: -item.jumlah // Kurangi jumlahTerjual saat nota dihapus
          }
        },
        { session }
      );
      
      console.log(`Restored stock for item ${item.namaBarang}: +${item.jumlah} to stokBagus, -${item.jumlah} from jumlahTerjual`);
    }
    
    // Delete nota
    await nota.remove({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({ message: 'Nota berhasil dihapus' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Delete nota error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;