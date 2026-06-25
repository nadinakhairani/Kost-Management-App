const express = require('express');
const router = express.Router();
const { getAllPenghuni, createPenghuni, updatePenghuni, deletePenghuni } = require('../controllers/penghuni');

router.get('/', getAllPenghuni);
router.post('/', createPenghuni);
router.put('/:id', updatePenghuni);
router.delete('/:id', deletePenghuni);

module.exports = router;
