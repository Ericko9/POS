// scripts/fixJumlahTerjual.js
/**
 * Script untuk memperbaiki data jumlahTerjual di semua barang
 * dengan menghitung ulang berdasarkan nota dan retur
 * 
 * Cara penggunaan:
 * 1. Simpan file ini di folder scripts
 * 2. Jalankan dengan perintah: node scripts/fixJumlahTerjual.js
 */

const mongoose = require('mongoose');
const Barang = require('../models/Barang');
const Nota = require('../models/Nota');
const Retur = require('../models/Retur');
require('dotenv').config();

async function fixJumlahTerjual() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all barangs
    const barangs = await Barang.find();
    console.log(`Found ${barangs.length} products to process`);
    
    // Process each barang
    for (const barang of barangs) {
      console.log(`\nProcessing barang: ${barang.nama} (${barang._id})`);
      
      // 1. Hitung jumlah terjual dari nota
      const notaItems = await Nota.aggregate([
        { $unwind: '$items' },
        { 
          $match: { 
            'items.barangId': mongoose.Types.ObjectId(barang._id)
          } 
        },
        {
          $group: {
            _id: null,
            totalSold: { $sum: '$items.jumlah' }
          }
        }
      ]);
      
      const totalSoldFromNotas = notaItems.length > 0 ? notaItems[0].totalSold : 0;
      console.log(`- Total sold from notas: ${totalSoldFromNotas}`);
      
      // 2. Hitung jumlah retur dengan kondisi "bagus" (karena hanya ini yang mengurangi jumlahTerjual)
      const returItems = await Retur.aggregate([
        {
          $match: {
            barangId: mongoose.Types.ObjectId(barang._id),
            kondisi: 'bagus'
          }
        },
        {
          $group: {
            _id: null,
            totalReturned: { $sum: '$jumlahRetur' }
          }
        }
      ]);
      
      const totalReturned = returItems.length > 0 ? returItems[0].totalReturned : 0;
      console.log(`- Total returned (bagus condition): ${totalReturned}`);
      
      // 3. Hitung jumlah terjual bersih
      const netTotalSold = totalSoldFromNotas - totalReturned;
      console.log(`- Net total sold: ${netTotalSold}`);
      
      // 4. Update barang dengan nilai yang benar
      await Barang.findByIdAndUpdate(barang._id, {
        jumlahTerjual: netTotalSold
      });
      
      console.log(`✓ Updated jumlahTerjual for ${barang.nama}: ${netTotalSold}`);
    }
    
    console.log('\nAll products have been updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing jumlahTerjual:', error);
    process.exit(1);
  }
}

// Run the function
fixJumlahTerjual();