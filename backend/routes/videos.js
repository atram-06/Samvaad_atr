const express = require('express');
const router = express.Router();
const { Video } = require('../models');

router.get('/', async (req, res) => {
    res.json([
        { id: 1, title: 'Big Buck Bunny', url: 'https://www.w3schools.com/html/mov_bbb.mp4' }
    ]);
});

module.exports = router;
