// routes/kategori.js
const express = require('express');
const Kategori = require('../models/Kategori');
const mongoose = require('mongoose');
const Barang = require('../models/Barang');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// Get all kategoris
router.get('/', auth, async (req, res) => {
  try {
    const kategoris = await Kategori.find().sort({ nama: 1 });
    
    // Count barang in each kategori
    const kategorisWithCount = await Promise.all(
      kategoris.map(async (kategori) => {
        const jumlahBarang = await Barang.countDocuments({ kategoriId: kategori._id });
        return {
          ...kategori.toObject(),
          jumlahBarang
        };
      })
    );
    
    res.json(kategorisWithCount);
  } catch (error) {
    console.error('Get kategoris error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Create kategori
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { nama, deskripsi } = req.body;
    
    // Check if kategori already exists
    const kategoriExists = await Kategori.findOne({ nama });
    if (kategoriExists) {
      return res.status(400).json({ message: 'Kategori dengan nama tersebut sudah ada' });
    }
    
    // Create new kategori
    const kategori = new Kategori({
      nama,
      deskripsi
    });
    
    await kategori.save();
    res.status(201).json(kategori);
  } catch (error) {
    console.error('Create kategori error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Update kategori
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { nama, deskripsi } = req.body;
    
    // Check if kategori exists
    const kategori = await Kategori.findById(req.params.id);
    if (!kategori) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }
    
    // Check if name already exists (except for current kategori)
    if (nama !== kategori.nama) {
      const nameExists = await Kategori.findOne({ nama });
      if (nameExists) {
        return res.status(400).json({ message: 'Kategori dengan nama tersebut sudah ada' });
      }
    }
    
    // Update kategori
    kategori.nama = nama;
    kategori.deskripsi = deskripsi;
    kategori.updatedAt = Date.now();
    
    await kategori.save();
    res.json(kategori);
  } catch (error) {
    console.error('Update kategori error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Delete kategori
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    // Check if kategori exists
    const kategori = await Kategori.findById(req.params.id);
    if (!kategori) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }
    
    // Check if kategori is used by any barang
    const barangCount = await Barang.countDocuments({ kategoriId: req.params.id });
    if (barangCount > 0) {
      return res.status(400).json({ 
        message: 'Kategori tidak dapat dihapus karena masih digunakan oleh barang' 
      });
    }
    
    // Delete kategori
    await kategori.remove();
    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('Delete kategori error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;