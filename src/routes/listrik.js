const express = require('express');
const router = express.Router();
const { getAllListrik, createListrik, updateListrik, deleteListrik } = require('../controllers/listrik');

router.get('/', getAllListrik);
router.post('/', createListrik);
router.put('/:id', updateListrik);
router.delete('/:id', deleteListrik);

module.exports = router;
