const express = require('express');
const router = express.Router();
const { 
    getDashboardStats, 
    getPenghuniPerKamarReport, 
    getListrikReport, 
    getTahunanReport 
} = require('../controllers/laporan');

router.get('/stats', getDashboardStats);
router.get('/kamar-penghuni', getPenghuniPerKamarReport);
router.get('/listrik-bulanan', getListrikReport);
router.get('/tahunan-tahunan', getTahunanReport);

module.exports = router;
