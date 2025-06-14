// middleware/adminOnly.js
module.exports = (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak, hanya admin yang diizinkan' });
    }
    next();
  };