const express = require('express');
const router = express.Router();
const { getAllKamar, createKamar, updateKamar, deleteKamar } = require('../controllers/kamar');

router.get('/', getAllKamar);
router.post('/', createKamar);
router.put('/:id', updateKamar);
router.delete('/:id', deleteKamar);

module.exports = router;
