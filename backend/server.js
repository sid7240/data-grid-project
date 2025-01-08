const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 5000;
const cors = require('cors');

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/productGrid', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected')).catch(err => console.error(err));

const locationSchema = new mongoose.Schema({
    name: String,
    potentialRevenue: String,
    competitorProcessingVolume: String,
    competitorMerchant: Number,
    revenuePerAccount: String,
    marketShare: String,
    commercialDDAs: Number
});

const branchSchema = new mongoose.Schema({
    branchName: String,
    potentialRevenue: String,
    competitorProcessingVolume: String,
    competitorMerchant: Number,
    revenuePerAccount: String,
    marketShare: String,
    commercialDDAs: Number,
    location: String
});

const Location = mongoose.model('Location', locationSchema);
const Branch = mongoose.model('Branch', branchSchema);

app.get('/api/locations', async (req, res) => {
    try {
        const locations = await Location.find();
        res.json(locations);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching locations' });
    }
});

app.get('/api/branches', async (req, res) => {
    try {
        const branches = await Branch.find();
        res.json(branches);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching branches' });
    }
});

app.get('/api/branches/:location', async (req, res) => {
    const { location } = req.params;
    try {
        const branches = await Branch.find({ location });
        res.json(branches);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching branches by location' });
    }
});

app.delete('/api/locations/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Location.findByIdAndDelete(id);
        res.status(200).json({ message: 'Location deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting location' });
    }
});

app.delete('/api/branches/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Branch.findByIdAndDelete(id);
        res.status(200).json({ message: 'Branch deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting branch' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});