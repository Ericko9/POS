// routes/retur.js - Versi Tanpa Transaksi
const express = require('express');
const mongoose = require('mongoose');
const Retur = require('../models/Retur');
const Nota = require('../models/Nota');
const Barang = require('../models/Barang');
const auth = require('../middleware/auth');

const router = express.Router();

// Proses retur barang - Tanpa Transaksi
router.post('/', auth, async (req, res) => {
  try {
    // Log data yang diterima untuk debugging
    console.log('Received retur data:', JSON.stringify(req.body, null, 2));
    
    const { notaId, items } = req.body;
    
    // Validasi input dasar
    if (!notaId) {
      return res.status(400).json({ message: 'ID Nota tidak boleh kosong' });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Daftar barang retur tidak valid' });
    }
    
    // Filter items dengan jumlahRetur > 0
    const returItems = items.filter(item => item.jumlahRetur > 0);
    
    if (returItems.length === 0) {
      return res.status(400).json({ message: 'Minimal satu barang harus diretur' });
    }
    
    // Validasi notaId format
    if (!mongoose.isValidObjectId(notaId)) {
      return res.status(400).json({ message: 'Format ID Nota tidak valid' });
    }
    
    // Validasi nota
    const nota = await Nota.findById(notaId);
    if (!nota) {
      return res.status(404).json({ message: 'Nota tidak ditemukan' });
    }
    
    // Array untuk menyimpan semua retur yang dibuat
    const createdReturs = [];
    
    // Proses setiap item retur
    for (const item of returItems) {
      // Validasi format barangId
      if (!mongoose.isValidObjectId(item.barangId)) {
        return res.status(400).json({ message: `Format ID Barang tidak valid: ${item.barangId}` });
      }
      
      // Validasi jumlah retur
      if (!item.jumlahRetur || isNaN(item.jumlahRetur) || item.jumlahRetur <= 0) {
        return res.status(400).json({ message: `Jumlah retur untuk ${item.namaBarang} tidak valid` });
      }
      
      // Cek apakah barang ada di nota
      const notaItem = nota.items.find(i => i.barangId.toString() === item.barangId);
      if (!notaItem) {
        return res.status(400).json({ 
          message: `Barang ${item.namaBarang} tidak ditemukan dalam nota ini` 
        });
      }
      
      // Cek jumlah retur tidak melebihi jumlah pembelian
      if (item.jumlahRetur > notaItem.jumlah) {
        return res.status(400).json({ 
          message: `Jumlah retur ${item.jumlahRetur} untuk ${item.namaBarang} melebihi jumlah pembelian (${notaItem.jumlah})` 
        });
      }
      
      // Cek keberadaan barang di database
      const barang = await Barang.findById(item.barangId);
      if (!barang) {
        return res.status(404).json({ 
          message: `Barang ${item.namaBarang} tidak ditemukan di database` 
        });
      }
      
      // Buat dokumen retur baru
      try {
        const returDoc = new Retur({
          notaId: nota._id,
          nomorNota: nota.nomorNota,
          barangId: item.barangId,
          namaBarang: item.namaBarang,
          grade: item.grade,
          jumlahRetur: item.jumlahRetur,
          hargaSatuan: item.hargaSatuan || notaItem.hargaSatuan,
          potonganHarga: item.potonganHarga || notaItem.potonganHarga || 0,
          kondisi: item.kondisi,
          alasan: item.alasan,
          tanggal: new Date(),
          kasirId: req.user.id
        });
        
        // Simpan dokumen retur
        const savedRetur = await returDoc.save();
        createdReturs.push(savedRetur);
        
        // Update stok barang sesuai kondisi
        const updateFields = { $inc: {} };
        
        if (item.kondisi === 'bagus') {
          // Untuk barang kondisi bagus, tambah stok bagus dan kurangi jumlah terjual
          updateFields.$inc.stokBagus = item.jumlahRetur;
          updateFields.$inc.jumlahTerjual = -item.jumlahRetur;
        } else if (item.kondisi === 'rusak') {
          // Untuk barang rusak, tambah stok rusak
          updateFields.$inc.stokRusak = item.jumlahRetur;
          updateFields.$inc.jumlahTerjual = -item.jumlahRetur; // Tambahkan baris ini
        } else {
          // Jika kondisi barang tidak valid
          await Retur.findByIdAndDelete(savedRetur._id); // Hapus retur yang sudah dibuat
          return res.status(400).json({ 
            message: `Kondisi barang '${item.kondisi}' tidak valid. Gunakan 'bagus' atau 'rusak'` 
          });
        }
        
        // Update barang di database
        await Barang.findByIdAndUpdate(item.barangId, updateFields);
        
      } catch (itemError) {
        console.error(`Error creating retur for item ${item.namaBarang}:`, itemError);
        return res.status(500).json({ 
          message: `Gagal membuat retur untuk ${item.namaBarang}: ${itemError.message}` 
        });
      }
    }
    
    res.status(201).json({
      message: 'Retur berhasil diproses',
      returs: createdReturs
    });
    
  } catch (error) {
    console.error('Error processing retur:', error);
    
    // Kirim pesan error yang informatif
    res.status(500).json({ 
      message: 'Terjadi kesalahan pada server saat memproses retur',
      error: error.message
    });
  }
});

// Get all returs with filters
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build filter
    const filter = {};
    
    if (startDate && endDate) {
      filter.tanggal = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get returs
    const returs = await Retur.find(filter)
      .sort({ tanggal: -1 })
      .populate('notaId', 'nomorNota');
    
    // Format response - keeping notaId for linking
    const formattedReturs = await Promise.all(
      returs.map(async (retur) => {
        const r = retur.toObject();
        r.nomorNota = r.notaId?.nomorNota || 'Nota tidak tersedia';
        // Keep notaId for router link purposes
        return r;
      })
    );
    
    res.json(formattedReturs);
  } catch (error) {
    console.error('Get returs error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Get retur by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const retur = await Retur.findById(req.params.id)
      .populate('notaId', 'nomorNota tanggal namaPelanggan noHpPelanggan');
    
    if (!retur) {
      return res.status(404).json({ message: 'Retur tidak ditemukan' });
    }
    
    res.json(retur);
  } catch (error) {
    console.error('Get retur by id error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Endpoint untuk mendapatkan retur berdasarkan ID nota tunggal
router.get('/nota/:notaId', auth, async (req, res) => {
  try {
    const { notaId } = req.params;
    
    if (!mongoose.isValidObjectId(notaId)) {
      return res.status(400).json({ message: 'ID nota tidak valid' });
    }
    
    const returs = await Retur.find({
      notaId: notaId
    }).select('_id notaId');
    
    res.json(returs);
  } catch (error) {
    console.error('Get returs by nota id error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Tambahkan rute baru untuk mengambil retur berdasarkan nota IDs
router.get('/by-nota', auth, async (req, res) => {
  try {
    const { notaIds } = req.query;
    
    if (!notaIds) {
      return res.status(400).json({ message: 'Parameter notaIds diperlukan' });
    }
    
    // Pastikan array notaId valid
    let notaIdArray;
    try {
      notaIdArray = notaIds.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));
    } catch (e) {
      return res.status(400).json({ message: 'Format notaIds tidak valid' });
    }
    
    if (notaIdArray.length === 0) {
      return res.json([]);
    }
    
    // Find all returs that are associated with any of the provided nota IDs
    const returs = await Retur.find({
      notaId: { $in: notaIdArray }
    }).select('notaId');
    
    // Format response untuk mempermudah penggunaannya di frontend
    const formattedReturs = returs.map(r => ({
      notaId: r.notaId.toString()
    }));
    
    res.json(formattedReturs);
  } catch (error) {
    console.error('Get returs by nota ids error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server: ' + error.message });
  }
});

// Update price information for a retur
router.patch('/:id/update-price', auth, async (req, res) => {
  try {
    const { hargaSatuan, potonganHarga } = req.body;
    
    if (hargaSatuan === undefined) {
      return res.status(400).json({ message: 'Parameter hargaSatuan diperlukan' });
    }
    
    const retur = await Retur.findById(req.params.id);
    if (!retur) {
      return res.status(404).json({ message: 'Retur tidak ditemukan' });
    }
    
    // Update price information
    retur.hargaSatuan = hargaSatuan;
    
    if (potonganHarga !== undefined) {
      retur.potonganHarga = potonganHarga;
    }
    
    await retur.save();
    
    res.json({ 
      message: 'Informasi harga retur berhasil diperbarui',
      retur
    });
  } catch (error) {
    console.error('Update retur price error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router; 