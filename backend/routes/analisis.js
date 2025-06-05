// routes/analisis.js
const express = require('express');
const mongoose = require('mongoose');
const Nota = require('../models/Nota');
const Kategori = require('../models/Kategori');
const Barang = require('../models/Barang');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// Fungsi helper untuk menghitung persentase perubahan
function calculatePercentageChange(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0; // Atau bisa null/Infinity sesuai kebutuhan
  }
  return ((current - previous) / previous) * 100;
}

// Pendapatan routes
router.get('/pendapatan', auth, adminOnly, async (req, res) => {
  try {
    const { periodType, startDate, endDate } = req.query;
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Tanggal awal dan akhir harus diisi' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Build date filter
    const dateFilter = {
      tanggal: { $gte: start, $lte: end }
    };

    // Hitung durasi periode saat ini (dalam milidetik)
    const duration = end.getTime() - start.getTime();

    // Hitung tanggal akhir periode sebelumnya (satu milidetik sebelum periode saat ini dimulai)
    const prevEnd = new Date(start.getTime() - 1);
    // Hitung tanggal mulai periode sebelumnya berdasarkan durasi
    const prevStart = new Date(prevEnd.getTime() - duration);
    prevStart.setHours(0, 0, 0, 0); // Pastikan mulai dari awal hari

    // Buat filter tanggal untuk periode sebelumnya
    const prevDateFilter = {
      tanggal: { $gte: prevStart, $lte: prevEnd }
    };

    // Get revenue data based on period type
    let revenueData = [];
    
    if (periodType === 'harian') {
      revenueData = await Nota.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$tanggal' } },
            count: { $sum: 1 },
            total: { $sum: '$totalHarga' }}
        },
        {
          $project: {
            _id: 0,
            period: '$_id',
            count: 1,
            total: 1,
            average: { $divide: ['$total', '$count'] }
          }
        },
        { $sort: { period: 1 } }
      ]);
    } else if (periodType === 'bulanan') {
      revenueData = await Nota.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$tanggal' } },
            count: { $sum: 1 },
            total: { $sum: '$totalHarga' }
          }
        },
        {
          $project: {
            _id: 0,
            period: '$_id',
            count: 1,
            total: 1,
            average: { $divide: ['$total', '$count'] }
          }
        },
        { $sort: { period: 1 } }
      ]);
    } else if (periodType === 'tahunan') {
      revenueData = await Nota.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y', date: '$tanggal' } },
            count: { $sum: 1 },
            total: { $sum: '$totalHarga' }
          }
        },
        {
          $project: {
            _id: 0,
            period: '$_id',
            count: 1,
            total: 1,
            average: { $divide: ['$total', '$count'] }
          }
        },
        { $sort: { period: 1 } }
      ]);
    }
    
    // Get summary for the current period
    const summary = await Nota.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalTransaksi: { $sum: 1 },
          totalPendapatan: { $sum: '$totalHarga' }
        }
      },
      {
        $project: {
          _id: 0,
          totalTransaksi: 1,
          totalPendapatan: 1,
          rataRata: {
            $cond: {
              if: { $eq: ['$totalTransaksi', 0] },
              then: 0,
              else: { $divide: ['$totalPendapatan', '$totalTransaksi'] }
            }
          }
        }
      }
    ]);

    // Get summary for the PREVIOUS period
    const prevSummaryResult = await Nota.aggregate([
      { $match: prevDateFilter }, // Gunakan filter periode sebelumnya
      {
        $group: {
          _id: null,
          totalTransaksi: { $sum: 1 },
          totalPendapatan: { $sum: '$totalHarga' }
        }
      },
      {
        $project: {
          _id: 0,
          totalTransaksi: 1,
          totalPendapatan: 1,
          rataRata: {
            $cond: {
              if: { $eq: ['$totalTransaksi', 0] },
              then: 0,
              else: { $divide: ['$totalPendapatan', '$totalTransaksi'] }
            }
          }
        }
      }
    ]);

    const prevSummary = prevSummaryResult.length > 0 ? prevSummaryResult[0] : { totalTransaksi: 0, totalPendapatan: 0, rataRata: 0 };
    const currentSummary = summary.length > 0 ? summary[0] : { totalTransaksi: 0, totalPendapatan: 0, rataRata: 0 }; // Ambil dari hasil summary yg sudah ada

    // Calculate percentage changes
    const pendapatanPercentage = calculatePercentageChange(currentSummary.totalPendapatan, prevSummary.totalPendapatan);
    const transaksiPercentage = calculatePercentageChange(currentSummary.totalTransaksi, prevSummary.totalTransaksi);
    const rataRataPercentage = calculatePercentageChange(currentSummary.rataRata, prevSummary.rataRata);

    // Format comparison data
    const comparisonData = {
      pendapatan: { value: prevSummary.totalPendapatan, percentage: parseFloat(pendapatanPercentage.toFixed(1)) },
      transaksi: { value: prevSummary.totalTransaksi, percentage: parseFloat(transaksiPercentage.toFixed(1)) },
      rataRata: { value: prevSummary.rataRata, percentage: parseFloat(rataRataPercentage.toFixed(1)) }
    };

    res.json({
      data: revenueData,
      summary: currentSummary, // Gunakan currentSummary yang sudah diolah
      comparisonData // Tambahkan data perbandingan
    });
  } catch (error) {
    console.error('Analisis pendapatan error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
 });
 
 // Kategori routes
 router.get('/kategori', auth, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate, kategoriId } = req.query;
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Tanggal awal dan akhir harus diisi' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Build pipeline
    const pipeline = [
      // Stage 1: Match nota by date
      {
        $match: {
          tanggal: { $gte: start, $lte: end }
        }
      },
      // Stage 2: Unwind items
      { $unwind: '$items' },
      // Stage 3: Lookup barang
      {
        $lookup: {
          from: 'barangs',
          localField: 'items.barangId',
          foreignField: '_id',
          as: 'barang'
        }
      },
      // Stage 4: Unwind barang
      { $unwind: '$barang' },
      // Stage 5: Filter by kategori if specified
      ...(kategoriId ? [
        { $match: { 'barang.kategoriId': mongoose.Types.ObjectId(kategoriId) } }
      ] : []),
      // Stage 6: Lookup kategori
      {
        $lookup: {
          from: 'kategoris',
          localField: 'barang.kategoriId',
          foreignField: '_id',
          as: 'kategori'
        }
      },
      // Stage 7: Unwind kategori
      { $unwind: '$kategori' },
      // Stage 8: Group by kategori
      {
        $group: {
          _id: '$kategori._id',
          nama: { $first: '$kategori.nama' },
          jumlahTerjual: { $sum: '$items.jumlah' },
          totalPendapatan: { $sum: '$items.subtotal' }
        }
      },
      // Stage 9: Sort by total pendapatan descending
      { $sort: { totalPendapatan: -1 } }
    ];
    
    // Execute pipeline
    const kategoriStats = await Nota.aggregate(pipeline);
    
    // Calculate total pendapatan
    const totalPendapatan = kategoriStats.reduce((acc, item) => acc + item.totalPendapatan, 0);
    
    // Calculate persentase for each category
    const result = kategoriStats.map(item => ({
      ...item,
      persentase: totalPendapatan > 0 ? (item.totalPendapatan / totalPendapatan) * 100 : 0
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Analisis kategori error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
 });
 
 // Kategori detail routes
// Fix for kategori/:id/products route
router.get('/kategori/:id/products', auth, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const kategoriId = req.params.id;
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Tanggal awal dan akhir harus diisi' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Create ObjectId safely
    let kategoriObjectId;
    try {
      kategoriObjectId = new mongoose.Types.ObjectId(kategoriId);
    } catch (err) {
      console.error('Invalid ObjectId format:', err);
      return res.status(400).json({ message: 'Format ID kategori tidak valid' });
    }
    
    // Build pipeline
    const pipeline = [
      // Stage 1: Match nota by date
      {
        $match: {
          tanggal: { $gte: start, $lte: end }
        }
      },
      // Stage 2: Unwind items
      { $unwind: '$items' },
      // Stage 3: Lookup barang
      {
        $lookup: {
          from: 'barangs',
          localField: 'items.barangId',
          foreignField: '_id',
          as: 'barang'
        }
      },
      // Stage 4: Unwind barang
      { $unwind: '$barang' },
      // Stage 5: Filter by kategori - FIXED to use the new ObjectId syntax
      { $match: { 'barang.kategoriId': kategoriObjectId } },
      // Stage 6: Group by barang
      {
        $group: {
          _id: '$barang._id',
          nama: { $first: '$barang.nama' },
          grade: { $first: '$barang.grade' },
          jumlahTerjual: { $sum: '$items.jumlah' },
          totalPendapatan: { $sum: '$items.subtotal' }
        }
      },
      // Stage 7: Sort by jumlah terjual descending
      { $sort: { jumlahTerjual: -1 } }
    ];
    
    // Execute pipeline
    const products = await Nota.aggregate(pipeline);
    
    res.json(products);
  } catch (error) {
    console.error('Analisis kategori products error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Fix for kategori/:id/trend route
router.get('/kategori/:id/trend', auth, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const kategoriId = req.params.id;
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Tanggal awal dan akhir harus diisi' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Create ObjectId safely
    let kategoriObjectId;
    try {
      kategoriObjectId = new mongoose.Types.ObjectId(kategoriId);
    } catch (err) {
      console.error('Invalid ObjectId format:', err);
      return res.status(400).json({ message: 'Format ID kategori tidak valid' });
    }
    
    // Build pipeline
    const pipeline = [
      // Stage 1: Match nota by date
      {
        $match: {
          tanggal: { $gte: start, $lte: end }
        }
      },
      // Stage 2: Unwind items
      { $unwind: '$items' },
      // Stage 3: Lookup barang
      {
        $lookup: {
          from: 'barangs',
          localField: 'items.barangId',
          foreignField: '_id',
          as: 'barang'
        }
      },
      // Stage 4: Unwind barang
      { $unwind: '$barang' },
      // Stage 5: Filter by kategori - FIXED to use the new ObjectId syntax
      { $match: { 'barang.kategoriId': kategoriObjectId } },
      // Stage 6: Group by month
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$tanggal' } },
          jumlahTerjual: { $sum: '$items.jumlah' },
          totalPendapatan: { $sum: '$items.subtotal' }
        }
      },
      // Stage 7: Project to format
      {
        $project: {
          _id: 0,
          bulan: '$_id',
          jumlahTerjual: 1,
          totalPendapatan: 1
        }
      },
      // Stage 8: Sort by month
      { $sort: { bulan: 1 } }
    ];
    
    // Execute pipeline
    const trend = await Nota.aggregate(pipeline);
    
    res.json(trend);
  } catch (error) {
    console.error('Analisis kategori trend error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});
 
 // Kategori trend routes
 router.get('/kategori/:id/trend', auth, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const kategoriId = req.params.id;
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Tanggal awal dan akhir harus diisi' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Build pipeline
    const pipeline = [
      // Stage 1: Match nota by date
      {
        $match: {
          tanggal: { $gte: start, $lte: end }
        }
      },
      // Stage 2: Unwind items
      { $unwind: '$items' },
      // Stage 3: Lookup barang
      {
        $lookup: {
          from: 'barangs',
          localField: 'items.barangId',
          foreignField: '_id',
          as: 'barang'
        }
      },
      // Stage 4: Unwind barang
      { $unwind: '$barang' },
      // Stage 5: Filter by kategori
      { $match: { 'barang.kategoriId': mongoose.Types.ObjectId(kategoriId) } },
      // Stage 6: Group by month
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$tanggal' } },
          jumlahTerjual: { $sum: '$items.jumlah' },
          totalPendapatan: { $sum: '$items.subtotal' }
        }
      },
      // Stage 7: Project to format
      {
        $project: {
          _id: 0,
          bulan: '$_id',
          jumlahTerjual: 1,
          totalPendapatan: 1
        }
      },
      // Stage 8: Sort by month
      { $sort: { bulan: 1 } }
    ];
    
    // Execute pipeline
    const trend = await Nota.aggregate(pipeline);
    
    res.json(trend);
  } catch (error) {
    console.error('Analisis kategori trend error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
 });
 
// Modifikasi pada route pelanggan di routes/analisis.js
// Tambahkan fungsi perhitungan untuk periode sebelumnya

// Pelanggan routes
router.get('/pelanggan', auth, adminOnly, async (req, res) => {
  try {
    const { search, startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Tanggal awal dan akhir harus diisi' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Hitung durasi periode saat ini (dalam milidetik)
    const duration = end.getTime() - start.getTime();

    // Hitung tanggal periode sebelumnya
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    prevStart.setHours(0, 0, 0, 0); // Pastikan mulai dari awal hari
    
    // Build match stage for current period
    const matchStage = {
      tanggal: { $gte: start, $lte: end }
    };
    
    // Build match stage for previous period
    const prevMatchStage = {
      tanggal: { $gte: prevStart, $lte: prevEnd }
    };
    
    if (search) {
      matchStage.$or = [
        { namaPelanggan: { $regex: search, $options: 'i' } },
        { noHpPelanggan: { $regex: search, $options: 'i' } }
      ];
      prevMatchStage.$or = [
        { namaPelanggan: { $regex: search, $options: 'i' } },
        { noHpPelanggan: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Count total customers matching the criteria for current period
    const countPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$noHpPelanggan',
          nama: { $first: '$namaPelanggan' }
        }
      },
      { $count: 'total' }
    ];
    
    const countResult = await Nota.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;
    
    // Get customer stats for current period
    const pipeline = [
      // Stage 1: Match nota by date and search
      { $match: matchStage },
      // Stage 2: Group by customer phone
      {
        $group: {
          _id: '$noHpPelanggan',
          namaPelanggan: { $first: '$namaPelanggan' },
          alamatPelanggan: { $first: '$alamatPelanggan' },
          jumlahTransaksi: { $sum: 1 },
          totalBelanja: { $sum: '$totalHarga' },
          lastTransaction: { $max: '$tanggal' }
        }
      },
      // Stage 3: Calculate average
      {
        $project: {
          _id: 0,
          noHpPelanggan: '$_id',
          namaPelanggan: 1,
          alamatPelanggan: 1,
          jumlahTransaksi: 1,
          totalBelanja: 1,
          rataRata: { $divide: ['$totalBelanja', '$jumlahTransaksi'] },
          lastTransaction: 1
        }
      },
      // Stage 4: Sort by total belanja descending
      { $sort: { totalBelanja: -1 } },
      // Stage 5: Pagination
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];
    
    // Execute pipeline for current period
    const customers = await Nota.aggregate(pipeline);
    
    // Get summary for current period
    const summaryPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$noHpPelanggan',
          totalBelanja: { $sum: '$totalHarga' },
          jumlahTransaksi: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          totalPelanggan: { $sum: 1 },
          totalTransaksi: { $sum: '$jumlahTransaksi' },
          totalPendapatan: { $sum: '$totalBelanja' }
        }
      },
      {
        $project: {
          _id: 0,
          totalPelanggan: 1,
          totalTransaksi: 1,
          totalPendapatan: 1,
          rataRata: { $divide: ['$totalPendapatan', '$totalTransaksi'] }
        }
      }
    ];
    
    const summaryResult = await Nota.aggregate(summaryPipeline);
    const summary = summaryResult.length > 0 ? summaryResult[0] : {
      totalPelanggan: 0,
      totalTransaksi: 0,
      totalPendapatan: 0,
      rataRata: 0
    };
    
    // Get summary for PREVIOUS period
    const prevSummaryPipeline = [
      { $match: prevMatchStage },
      {
        $group: {
          _id: '$noHpPelanggan',
          totalBelanja: { $sum: '$totalHarga' },
          jumlahTransaksi: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          totalPelanggan: { $sum: 1 },
          totalTransaksi: { $sum: '$jumlahTransaksi' },
          totalPendapatan: { $sum: '$totalBelanja' }
        }
      },
      {
        $project: {
          _id: 0,
          totalPelanggan: 1,
          totalTransaksi: 1,
          totalPendapatan: 1,
          rataRata: { $divide: ['$totalPendapatan', '$totalTransaksi'] }
        }
      }
    ];
    
    const prevSummaryResult = await Nota.aggregate(prevSummaryPipeline);
    const prevSummary = prevSummaryResult.length > 0 ? prevSummaryResult[0] : {
      totalPelanggan: 0,
      totalTransaksi: 0,
      totalPendapatan: 0,
      rataRata: 0
    };
    
    // Calculate percentage changes
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return ((current - previous) / previous) * 100;
    };
    
    const pelangganPercentage = calculatePercentageChange(summary.totalPelanggan, prevSummary.totalPelanggan);
    const transaksiPercentage = calculatePercentageChange(summary.totalTransaksi, prevSummary.totalTransaksi);
    const rataRataPercentage = calculatePercentageChange(summary.rataRata, prevSummary.rataRata);
    
    // Format comparison data
    const comparisonData = {
      pelanggan: { value: prevSummary.totalPelanggan, percentage: parseFloat(pelangganPercentage.toFixed(1)) },
      transaksi: { value: prevSummary.totalTransaksi, percentage: parseFloat(transaksiPercentage.toFixed(1)) },
      rataRata: { value: prevSummary.rataRata, percentage: parseFloat(rataRataPercentage.toFixed(1)) }
    };

    res.json({
      customers,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      summary,
      comparisonData
    });
  } catch (error) {
    console.error('Analisis pelanggan error:', error) ;
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});
 
 // Get customer transactions
 router.get('/pelanggan/:noHp/transactions', auth, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const noHp = req.params.noHp;
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Tanggal awal dan akhir harus diisi' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Get transactions
    const transactions = await Nota.find({
      noHpPelanggan: noHp,
      tanggal: { $gte: start, $lte: end }
    })
      .sort({ tanggal: -1 });
    
    res.json(transactions);
  } catch (error) {
    console.error('Get customer transactions error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
 });
 
 // Get customer products
 router.get('/pelanggan/:noHp/products', auth, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const noHp = req.params.noHp;
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Tanggal awal dan akhir harus diisi' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Build pipeline
    const pipeline = [
      // Stage 1: Match nota by date and customer
      {
        $match: {
          noHpPelanggan: noHp,
          tanggal: { $gte: start, $lte: end }
        }
      },
      // Stage 2: Unwind items
      { $unwind: '$items' },
      // Stage 3: Lookup barang
      {
        $lookup: {
          from: 'barangs',
          localField: 'items.barangId',
          foreignField: '_id',
          as: 'barang'
        }
      },
      // Stage 4: Unwind barang
      { $unwind: '$barang' },
      // Stage 5: Lookup kategori
      {
        $lookup: {
          from: 'kategoris',
          localField: 'barang.kategoriId',
          foreignField: '_id',
          as: 'kategori'
        }
      },
      // Stage 6: Unwind kategori
      { $unwind: '$kategori' },
      // Stage 7: Group by barang
      {
        $group: {
          _id: '$barang._id',
          namaBarang: { $first: '$barang.nama' },
          kategori: { $first: '$kategori.nama' },
          jumlahBeli: { $sum: '$items.jumlah' },
          totalHarga: { $sum: '$items.subtotal' }
        }
      },
      // Stage 8: Sort by jumlah beli descending
      { $sort: { jumlahBeli: -1 } }
    ];
    
    // Execute pipeline
    const products = await Nota.aggregate(pipeline);
    
    res.json(products);
  } catch (error) {
    console.error('Get customer products error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
 });
 
 // Profit Analysis Route
 router.get('/laba', auth, adminOnly, async (req, res) => {
  try {
    const { periodType, startDate, endDate } = req.query;
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Tanggal awal dan akhir harus diisi' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Build date filter
    const dateFilter = {
      tanggal: { $gte: start, $lte: end }
    };
    
    // Calculate duration for previous period comparison
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    prevStart.setHours(0, 0, 0, 0);
    
    // Build date filter for previous period
    const prevDateFilter = {
      tanggal: { $gte: prevStart, $lte: prevEnd }
    };
    
    // Get profit data based on period type
    let profitData = [];
    
    if (periodType === 'harian') {
      profitData = await Nota.aggregate([
        { $match: dateFilter },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'barangs',
            localField: 'items.barangId',
            foreignField: '_id',
            as: 'barang'
          }
        },
        { $unwind: '$barang' },
        {
          $lookup: {
            from: 'pasokans',
            let: { barangId: '$items.barangId' },
            pipeline: [
              { 
                $match: { 
                  $expr: { $in: ['$$barangId', '$items.barangId'] }
                }
              },
              { $unwind: '$items' },
              {
                $match: {
                  $expr: { $eq: ['$items.barangId', '$$barangId'] }
                }
              },
              { $sort: { tanggalPasok: -1 } },
              { $limit: 1 }
            ],
            as: 'pasokan'
          }
        },
        {
          $addFields: {
            hargaBeli: {
              $cond: {
                if: { $gt: [{ $size: '$pasokan' }, 0] },
                then: { $arrayElemAt: ['$pasokan.items.hargaSatuan', 0] },
                else: { $multiply: ['$barang.harga', 0.7] } // Fallback to 70% of selling price
              }
            }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$tanggal' } },
            totalPendapatan: { $sum: '$items.subtotal' },
            totalModal: { 
              $sum: { $multiply: ['$hargaBeli', '$items.jumlah'] }
            },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            period: '$_id',
            totalPendapatan: 1,
            totalModal: 1,
            totalLaba: { $subtract: ['$totalPendapatan', '$totalModal'] },
            count: 1,
            marginLaba: { 
              $multiply: [
                { $divide: [{ $subtract: ['$totalPendapatan', '$totalModal'] }, '$totalPendapatan'] },
                100
              ]
            }
          }
        },
        { $sort: { period: 1 } }
      ]);
    } else if (periodType === 'bulanan') {
      profitData = await Nota.aggregate([
        { $match: dateFilter },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'barangs',
            localField: 'items.barangId',
            foreignField: '_id',
            as: 'barang'
          }
        },
        { $unwind: '$barang' },
        {
          $lookup: {
            from: 'pasokans',
            let: { barangId: '$items.barangId' },
            pipeline: [
              { 
                $match: { 
                  $expr: { $in: ['$$barangId', '$items.barangId'] }
                }
              },
              { $unwind: '$items' },
              {
                $match: {
                  $expr: { $eq: ['$items.barangId', '$$barangId'] }
                }
              },
              { $sort: { tanggalPasok: -1 } },
              { $limit: 1 }
            ],
            as: 'pasokan'
          }
        },
        {
          $addFields: {
            hargaBeli: {
              $cond: {
                if: { $gt: [{ $size: '$pasokan' }, 0] },
                then: { $arrayElemAt: ['$pasokan.items.hargaSatuan', 0] },
                else: { $multiply: ['$barang.harga', 0.7] }
              }
            }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$tanggal' } },
            totalPendapatan: { $sum: '$items.subtotal' },
            totalModal: { 
              $sum: { $multiply: ['$hargaBeli', '$items.jumlah'] }
            },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            period: '$_id',
            totalPendapatan: 1,
            totalModal: 1,
            totalLaba: { $subtract: ['$totalPendapatan', '$totalModal'] },
            count: 1,
            marginLaba: { 
              $multiply: [
                { $divide: [{ $subtract: ['$totalPendapatan', '$totalModal'] }, '$totalPendapatan'] },
                100
              ]
            }
          }
        },
        { $sort: { period: 1 } }
      ]);
    } else if (periodType === 'tahunan') {
      profitData = await Nota.aggregate([
        { $match: dateFilter },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'barangs',
            localField: 'items.barangId',
            foreignField: '_id',
            as: 'barang'
          }
        },
        { $unwind: '$barang' },
        {
          $lookup: {
            from: 'pasokans',
            let: { barangId: '$items.barangId' },
            pipeline: [
              { 
                $match: { 
                  $expr: { $in: ['$$barangId', '$items.barangId'] }
                }
              },
              { $unwind: '$items' },
              {
                $match: {
                  $expr: { $eq: ['$items.barangId', '$$barangId'] }
                }
              },
              { $sort: { tanggalPasok: -1 } },
              { $limit: 1 }
            ],
            as: 'pasokan'
          }
        },
        {
          $addFields: {
            hargaBeli: {
              $cond: {
                if: { $gt: [{ $size: '$pasokan' }, 0] },
                then: { $arrayElemAt: ['$pasokan.items.hargaSatuan', 0] },
                else: { $multiply: ['$barang.harga', 0.7] }
              }
            }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y', date: '$tanggal' } },
            totalPendapatan: { $sum: '$items.subtotal' },
            totalModal: { 
              $sum: { $multiply: ['$hargaBeli', '$items.jumlah'] }
            },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            period: '$_id',
            totalPendapatan: 1,
            totalModal: 1,
            totalLaba: { $subtract: ['$totalPendapatan', '$totalModal'] },
            count: 1,
            marginLaba: { 
              $multiply: [
                { $divide: [{ $subtract: ['$totalPendapatan', '$totalModal'] }, '$totalPendapatan'] },
                100
              ]
            }
          }
        },
        { $sort: { period: 1 } }
      ]);
    }
    
    // Get summary for current period
    const summary = await Nota.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'barangs',
          localField: 'items.barangId',
          foreignField: '_id',
          as: 'barang'
        }
      },
      { $unwind: '$barang' },
      {
        $lookup: {
          from: 'pasokans',
          let: { barangId: '$items.barangId' },
          pipeline: [
            { 
              $match: { 
                $expr: { $in: ['$$barangId', '$items.barangId'] }
              }
            },
            { $unwind: '$items' },
            {
              $match: {
                $expr: { $eq: ['$items.barangId', '$$barangId'] }
              }
            },
            { $sort: { tanggalPasok: -1 } },
            { $limit: 1 }
          ],
          as: 'pasokan'
        }
      },
      {
        $addFields: {
          hargaBeli: {
            $cond: {
              if: { $gt: [{ $size: '$pasokan' }, 0] },
              then: { $arrayElemAt: ['$pasokan.items.hargaSatuan', 0] },
              else: { $multiply: ['$barang.harga', 0.7] }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPendapatan: { $sum: '$items.subtotal' },
          totalModal: { $sum: { $multiply: ['$hargaBeli', '$items.jumlah'] } },
          totalTransaksi: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          totalPendapatan: 1,
          totalModal: 1,
          totalLaba: { $subtract: ['$totalPendapatan', '$totalModal'] },
          totalTransaksi: 1,
          marginLaba: { 
            $multiply: [
              { $divide: [{ $subtract: ['$totalPendapatan', '$totalModal'] }, '$totalPendapatan'] }, 
              100
            ]
          }
        }
      }
    ]);
    
    // Get previous period data for comparison
    const prevSummaryResult = await Nota.aggregate([
      { $match: prevDateFilter },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'barangs',
          localField: 'items.barangId',
          foreignField: '_id',
          as: 'barang'
        }
      },
      { $unwind: '$barang' },
      {
        $lookup: {
          from: 'pasokans',
          let: { barangId: '$items.barangId' },
          pipeline: [
            { 
              $match: { 
                $expr: { $in: ['$$barangId', '$items.barangId'] }
              }
            },
            { $unwind: '$items' },
            {
              $match: {
                $expr: { $eq: ['$items.barangId', '$$barangId'] }
              }
            },
            { $sort: { tanggalPasok: -1 } },
            { $limit: 1 }
          ],
          as: 'pasokan'
        }
      },
      {
        $addFields: {
          hargaBeli: {
            $cond: {
              if: { $gt: [{ $size: '$pasokan' }, 0] },
              then: { $arrayElemAt: ['$pasokan.items.hargaSatuan', 0] },
              else: { $multiply: ['$barang.harga', 0.7] }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPendapatan: { $sum: '$items.subtotal' },
          totalModal: { $sum: { $multiply: ['$hargaBeli', '$items.jumlah'] } },
          totalTransaksi: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          totalPendapatan: 1,
          totalModal: 1,
          totalLaba: { $subtract: ['$totalPendapatan', '$totalModal'] },
          totalTransaksi: 1,
          marginLaba: { 
            $multiply: [
              { $divide: [{ $subtract: ['$totalPendapatan', '$totalModal'] }, '$totalPendapatan'] }, 
              100
            ]
          }
        }
      }
    ]);
    
    const currentSummary = summary.length > 0 ? summary[0] : { 
      totalPendapatan: 0, 
      totalModal: 0, 
      totalLaba: 0, 
      totalTransaksi: 0, 
      marginLaba: 0 
    };
    
    const prevSummary = prevSummaryResult.length > 0 ? prevSummaryResult[0] : { 
      totalPendapatan: 0, 
      totalModal: 0, 
      totalLaba: 0, 
      totalTransaksi: 0, 
      marginLaba: 0 
    };
    
    // Calculate percentage changes
    const pendapatanPercentage = calculatePercentageChange(currentSummary.totalPendapatan, prevSummary.totalPendapatan);
    const modalPercentage = calculatePercentageChange(currentSummary.totalModal, prevSummary.totalModal);
    const labaPercentage = calculatePercentageChange(currentSummary.totalLaba, prevSummary.totalLaba);
    const marginPercentage = calculatePercentageChange(currentSummary.marginLaba, prevSummary.marginLaba);
    
    // Format comparison data
    const comparisonData = {
      pendapatan: { value: prevSummary.totalPendapatan, percentage: parseFloat(pendapatanPercentage.toFixed(1)) },
      modal: { value: prevSummary.totalModal, percentage: parseFloat(modalPercentage.toFixed(1)) },
      laba: { value: prevSummary.totalLaba, percentage: parseFloat(labaPercentage.toFixed(1)) },
      margin: { value: prevSummary.marginLaba, percentage: parseFloat(marginPercentage.toFixed(1)) }
    };
    
    res.json({
      data: profitData,
      summary: currentSummary,
      comparisonData
    });
  } catch (error) {
    console.error('Analisis laba error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;