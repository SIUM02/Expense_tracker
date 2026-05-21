const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'expenses.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database', err);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      desc TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL
    )
  `);
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/api/expenses', (req, res) => {
  db.all('SELECT * FROM expenses ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.post('/api/expenses', (req, res) => {
  const { desc, category, date, amount } = req.body;
  if (!desc || !category || !date || typeof amount !== 'number' || Number.isNaN(amount)) {
    return res.status(400).json({ error: 'Invalid expense payload' });
  }

  db.run(
    'INSERT INTO expenses (desc, category, date, amount) VALUES (?, ?, ?, ?)',
    [desc, category, date, amount],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(201).json({ id: this.lastID, desc, category, date, amount });
    }
  );
});

app.delete('/api/expenses/:id', (req, res) => {
  const id = Number(req.params.id);
  db.run('DELETE FROM expenses WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Expense not found' });
    res.status(204).end();
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
