const express = require('express');
const router = express.Router();
const { getAllTahunan, createTahunan, updateTahunan, deleteTahunan } = require('../controllers/tahunan');

router.get('/', getAllTahunan);
router.post('/', createTahunan);
router.put('/:id', updateTahunan);
router.delete('/:id', deleteTahunan);

module.exports = router;
