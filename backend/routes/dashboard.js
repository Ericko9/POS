// routes/dashboard.js
const express = require('express');
const Nota = require('../models/Nota');
const Barang = require('../models/Barang');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { ObjectId } = require('mongoose').Types;

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const isAdmin = currentUser.role === 'admin';
    
    // Get total pendapatan
    const pendapatanResult = await Nota.aggregate([
      { $group: { _id: null, totalPendapatan: { $sum: '$totalHarga' } } }
    ]);
    
    const totalPendapatan = pendapatanResult.length > 0 ? pendapatanResult[0].totalPendapatan : 0;
    
    // Get total nota
    const totalNota = await Nota.countDocuments();
    
    // Kode perbaikan: Menggunakan data transaksi untuk menentukan barang terlaris
    const periodeHari = 30; // Bisa disesuaikan: 7, 30, 90 hari, dll

    // Tentukan tanggal awal periode
    const tanggalAwal = new Date();
    tanggalAwal.setDate(tanggalAwal.getDate() - periodeHari);
    tanggalAwal.setHours(0, 0, 0, 0);

    // Gunakan agregasi MongoDB untuk menghitung penjualan per barang dalam periode tertentu
    const barangTerlarisData = await Nota.aggregate([
      // Filter nota berdasarkan periode waktu
      { 
        $match: { 
          tanggal: { $gte: tanggalAwal }
        } 
      },
      // Pisahkan array items menjadi dokumen terpisah
      { $unwind: '$items' },
      // Kelompokkan berdasarkan barangId dan jumlahkan penjualan
      { 
        $group: { 
          _id: '$items.barangId', 
          namaBarang: { $first: '$items.namaBarang' },
          jumlahTerjual: { $sum: '$items.jumlah' },
          totalPendapatan: { $sum: '$items.subtotal' }
        } 
      },
      // Urutkan berdasarkan jumlah terjual (descending)
      { $sort: { jumlahTerjual: -1 } },
      // Ambil hanya 1 dokumen teratas (barang terlaris)
      { $limit: 1 }
    ]);

    // Format hasil query
    const barangTerlaris = barangTerlarisData.length > 0 
      ? { 
          nama: barangTerlarisData[0].namaBarang, 
          jumlahTerjual: barangTerlarisData[0].jumlahTerjual,
          periode: periodeHari
        } 
      : { nama: 'Belum ada', jumlahTerjual: 0, periode: periodeHari };
    
    // Prepare user roles to include both kasir and admin
    const userRoles = ['kasir', 'admin'];
    
    // Get user data (kasir and admin)
    const userData = await User.aggregate([
      { $match: { role: { $in: userRoles } } },
      {
        $lookup: {
          from: 'notas',
          localField: '_id',
          foreignField: 'kasirId',
          as: 'notas'
        }
      },
      {
        $project: {
          _id: 1,
          nama: 1,
          role: 1,
          jumlahNota: { $size: '$notas' },
          totalPendapatan: { $sum: '$notas.totalHarga' },
          rataRata: {
            $cond: [
              { $eq: [{ $size: '$notas' }, 0] },
              0,
              { $divide: [{ $sum: '$notas.totalHarga' }, { $size: '$notas' }] }
            ]
          }
        }
      },
      { $sort: { totalPendapatan: -1 } }
    ]);
    
    // Get weekly data (last 7 days)
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 6);
    
    const weeklyData = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(lastWeek);
      date.setDate(lastWeek.getDate() + i);
      
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayData = {
        tanggal: dayStart.toISOString().split('T')[0],
        users: []
      };
      
      // Get data for each user on this day
      for (const user of userData) {
        const userDailyData = await Nota.aggregate([
          {
            $match: {
              kasirId: user._id,
              tanggal: { $gte: dayStart, $lte: dayEnd }
            }
          },
          {
            $group: {
              _id: null,
              pendapatan: { $sum: '$totalHarga' },
              jumlahNota: { $sum: 1 }
            }
          }
        ]);
        
        dayData.users.push({
          _id: user._id,
          nama: user.nama,
          role: user.role,
          pendapatan: userDailyData.length > 0 ? userDailyData[0].pendapatan : 0,
          jumlahNota: userDailyData.length > 0 ? userDailyData[0].jumlahNota : 0
        });
      }
      
      weeklyData.push(dayData);
    }

    // Hitung tren mingguan
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const thisWeekStart = new Date(todayEnd);
    thisWeekStart.setDate(todayEnd.getDate() - 6);
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);

    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    // Fungsi helper untuk get data mingguan
    const getWeeklyStats = async (startDate, endDate) => {
      const stats = await Nota.aggregate([
        {
          $match: {
            tanggal: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalPendapatan: { $sum: '$totalHarga' },
            totalNota: { $sum: 1 }
          }
        }
      ]);
      return {
        pendapatan: stats.length > 0 ? stats[0].totalPendapatan : 0,
        nota: stats.length > 0 ? stats[0].totalNota : 0
      };
    };

    // Dapatkan data minggu ini dan minggu lalu
    const thisWeekStats = await getWeeklyStats(thisWeekStart, todayEnd);
    const lastWeekStats = await getWeeklyStats(lastWeekStart, lastWeekEnd);

    // Hitung persentase perubahan
    let pendapatanTrend = 0;
    if (lastWeekStats.pendapatan !== 0) {
      pendapatanTrend = ((thisWeekStats.pendapatan - lastWeekStats.pendapatan) / lastWeekStats.pendapatan) * 100;
    } else if (thisWeekStats.pendapatan > 0) {
      pendapatanTrend = 100;
    }

    let notaTrend = 0;
    if (lastWeekStats.nota !== 0) {
      notaTrend = ((thisWeekStats.nota - lastWeekStats.nota) / lastWeekStats.nota) * 100;
    } else if (thisWeekStats.nota > 0) {
      notaTrend = 100;
    }
    
    res.json({
      totalPendapatan,
      totalNota,
      barangTerlaris,
      userData,
      weeklyData,
      pendapatanTrend: parseFloat(pendapatanTrend.toFixed(1)),
      notaTrend: parseFloat(notaTrend.toFixed(1))
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;