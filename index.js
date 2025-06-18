const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow all CORS

// Placeholder data (replace with your data structure later)
const data = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' }
];

// Endpoint: Get all items
app.get('/items', (req, res) => {
  res.json(data);
});

// Endpoint: Get item by id
app.get('/items/:id', (req, res) => {
  const item = data.find(d => d.id === parseInt(req.params.id));
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Express webservice is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
