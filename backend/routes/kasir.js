// routes/kasir.js
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Nota = require('../models/Nota');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// Get all kasirs
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { search } = req.query;
    
    // Build filter
    const filter = { role: 'kasir' };
    
    if (search) {
      filter.$or = [
        { nama: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get kasirs
    const kasirs = await User.find(filter)
      .select('-password')
      .sort({ nama: 1 });
    
// Get performance for each kasir
const kasirsWithPerformance = await Promise.all(
  kasirs.map(async (kasir) => {
    const k = kasir.toObject();
    
    // Get total notas
    const totalNota = await Nota.countDocuments({ kasirId: kasir._id });
    
    // Get total pendapatan
    const notaAggregate = await Nota.aggregate([
      { $match: { kasirId: kasir._id } },
      { $group: { _id: null, totalPendapatan: { $sum: '$totalHarga' } } }
    ]);
    
    const totalPendapatan = notaAggregate.length > 0 ? notaAggregate[0].totalPendapatan : 0;
    
    return {
      ...k,
      totalNota,
      totalPendapatan
    };
  })
);

res.json(kasirsWithPerformance);
} catch (error) {
console.error('Get kasirs error:', error);
res.status(500).json({ message: 'Terjadi kesalahan pada server' });
}
});

// Get kasir by ID
router.get('/:id', auth, async (req, res) => {
try {
const kasir = await User.findById(req.params.id).select('-password');

if (!kasir) {
  return res.status(404).json({ message: 'Kasir tidak ditemukan' });
}

// Check if user is admin or the kasir themselves
if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
  return res.status(403).json({ message: 'Tidak memiliki izin untuk mengakses data ini' });
}

res.json(kasir);
} catch (error) {
console.error('Get kasir error:', error);
res.status(500).json({ message: 'Terjadi kesalahan pada server' });
}
});

// Get kasir stats
router.get('/:id/stats', auth, async (req, res) => {
try {
const { startDate, endDate } = req.query;

const kasir = await User.findById(req.params.id).select('-password');
if (!kasir) {
  return res.status(404).json({ message: 'Kasir tidak ditemukan' });
}

// Check if user is admin or the kasir themselves
if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
  return res.status(403).json({ message: 'Tidak memiliki izin untuk mengakses data ini' });
}

// Build date filter
const dateFilter = { kasirId: kasir._id };

if (startDate && endDate) {
  dateFilter.tanggal = {
    $gte: new Date(startDate),
    $lte: new Date(endDate)
  };
}

// Get monthly stats
const monthlyStats = await Nota.aggregate([
  { $match: dateFilter },
  {
    $group: {
      _id: {
        year: { $year: '$tanggal' },
        month: { $month: '$tanggal' }
      },
      jumlahNota: { $sum: 1 },
      totalPendapatan: { $sum: '$totalHarga' }
    }
  },
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
      jumlahNota: 1,
      totalPendapatan: 1,
      rataRata: { $divide: ['$totalPendapatan', '$jumlahNota'] }
    }
  },
  { $sort: { bulan: 1 } }
]);

// Get summary
const summary = await Nota.aggregate([
  { $match: dateFilter },
  {
    $group: {
      _id: null,
      totalNota: { $sum: 1 },
      totalPendapatan: { $sum: '$totalHarga' }
    }
  },
  {
    $project: {
      _id: 0,
      totalNota: 1,
      totalPendapatan: 1,
      rataRata: {
        $cond: {
          if: { $eq: ['$totalNota', 0] },
          then: 0,
          else: { $divide: ['$totalPendapatan', '$totalNota'] }
        }
      }
    }
  }
]);

res.json({
  monthlyStats,
  summary: summary.length > 0 ? summary[0] : { totalNota: 0, totalPendapatan: 0, rataRata: 0 }
});
} catch (error) {
console.error('Get kasir stats error:', error);
res.status(500).json({ message: 'Terjadi kesalahan pada server' });
}
});

// Get kasir transactions
router.get('/:id/transactions', auth, async (req, res) => {
try {
const { page = 1, limit = 10, startDate, endDate } = req.query;

const kasir = await User.findById(req.params.id).select('-password');
if (!kasir) {
  return res.status(404).json({ message: 'Kasir tidak ditemukan' });
}

// Check if user is admin or the kasir themselves
if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
  return res.status(403).json({ message: 'Tidak memiliki izin untuk mengakses data ini' });
}

// Build filter
const filter = { kasirId: kasir._id };

if (startDate && endDate) {
  filter.tanggal = {
    $gte: new Date(startDate),
    $lte: new Date(endDate)
  };
}

// Get total count
const total = await Nota.countDocuments(filter);

// Get transactions
const transactions = await Nota.find(filter)
  .sort({ tanggal: -1 })
  .skip((page - 1) * limit)
  .limit(parseInt(limit));

res.json({
  transactions,
  total,
  page: parseInt(page),
  totalPages: Math.ceil(total / limit)
});
} catch (error) {
console.error('Get kasir transactions error:', error);
res.status(500).json({ message: 'Terjadi kesalahan pada server' });
}
});

// Create kasir
router.post('/', auth, adminOnly, async (req, res) => {
try {
const { username, password, nama, email, noHp, catatan } = req.body;

// Check if username already exists
const usernameExists = await User.findOne({ username });
if (usernameExists) {
  return res.status(400).json({ message: 'Username sudah digunakan' });
}

// Create new kasir
const kasir = new User({
  username,
  password, // will be hashed by pre-save hook
  nama,
  role: 'kasir',
  email,
  noHp,
  catatan
});

await kasir.save();

// Remove password from response
const kasirResponse = kasir.toObject();
delete kasirResponse.password;

res.status(201).json(kasirResponse);
} catch (error) {
console.error('Create kasir error:', error);
res.status(500).json({ message: 'Terjadi kesalahan pada server' });
}
});

// Update kasir
router.put('/:id', auth, async (req, res) => {
try {
const { nama, password, email, noHp, catatan } = req.body;

// Check if kasir exists
const kasir = await User.findById(req.params.id);
if (!kasir) {
  return res.status(404).json({ message: 'Kasir tidak ditemukan' });
}

// Check if user is admin or the kasir themselves
if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
  return res.status(403).json({ message: 'Tidak memiliki izin untuk mengubah data ini' });
}

// Update kasir
kasir.nama = nama;
if (email) kasir.email = email;
if (noHp) kasir.noHp = noHp;

// Only admin can update catatan
if (req.user.role === 'admin' && catatan !== undefined) {
  kasir.catatan = catatan;
}

// Update password if provided
if (password) {
  const salt = await bcrypt.genSalt(10);
  kasir.password = await bcrypt.hash(password, salt);
}

kasir.updatedAt = Date.now();

await kasir.save();

// Remove password from response
const kasirResponse = kasir.toObject();
delete kasirResponse.password;

res.json(kasirResponse);
} catch (error) {
console.error('Update kasir error:', error);
res.status(500).json({ message: 'Terjadi kesalahan pada server' });
}
});

// Delete kasir
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    console.log(`[DELETE] Menghapus kasir dengan ID: ${req.params.id}`);
    
    // Check if kasir exists
    const kasir = await User.findById(req.params.id);
    if (!kasir) {
      console.log(`[DELETE] Kasir dengan ID ${req.params.id} tidak ditemukan`);
      return res.status(404).json({ message: 'Kasir tidak ditemukan' });
    }
    
    console.log(`[DELETE] Kasir ditemukan: ${kasir.nama}`);
    
    // Check if kasir has notas - konversi ID dengan aman
    let kasirId = req.params.id;
    
    // Jika menggunakan ObjectId, pastikan valid
    try {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        kasirId = new mongoose.Types.ObjectId(req.params.id);
      }
    } catch (err) {
      console.error('[DELETE] Error saat membuat ObjectId untuk kasir:', err);
      // Tetap gunakan ID string jika gagal konversi
    }
    
    console.log(`[DELETE] Memeriksa referensi nota untuk kasir ID: ${kasirId}`);
    
    // Gunakan agregasi untuk pengecekan yang lebih aman
    const notaCheck = await Nota.aggregate([
      { 
        $match: { 
          $expr: { 
            $eq: [
              { $toString: '$kasirId' }, 
              req.params.id
            ] 
          } 
        } 
      },
      { $limit: 1 }
    ]);
    
    const notaCount = notaCheck.length;
    console.log(`[DELETE] Jumlah nota yang mereferensikan kasir: ${notaCount}`);
    
    if (notaCount > 0) {
      console.log(`[DELETE] Kasir tidak dapat dihapus karena memiliki data transaksi`);
      return res.status(400).json({
        message: 'Kasir tidak dapat dihapus karena memiliki data transaksi'
      });
    }
    
    // Delete kasir - Gunakan deleteOne() sebagai pengganti remove()
    console.log(`[DELETE] Menghapus kasir dari database...`);
    const deleteResult = await User.deleteOne({ _id: req.params.id });
    console.log(`[DELETE] Hasil penghapusan kasir: ${JSON.stringify(deleteResult)}`);
    
    res.json({ message: 'Kasir berhasil dihapus' });
  } catch (error) {
    console.error('[DELETE] Error saat menghapus kasir:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;