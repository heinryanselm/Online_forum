import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // for .env configuration

const app = express();

app.use(cors());
app.use(express.json());

const connectionString = process.env.DATABASE_URL;

const db = new pg.Pool({ connectionString: connectionString });

// Function to generate token (replace this with your actual token generation logic)
const generateToken = (userId) => {
  // Your token generation logic here
};

// Endpoint to create a new user
app.post('/user', async (req, res) => {
  try {
    const newUser = await db.query('INSERT INTO users (username) VALUES ($1) RETURNING *', [req.body.username]);
    res.json(newUser.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to authenticate and log in a user
app.post('/login', async (req, res) => {
  const { username } = req.body;
  try {
    const user = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (user.rows.length === 0) {
      const newUser = await db.query('INSERT INTO users (username) VALUES ($1) RETURNING *', [username]);
      const token = generateToken(newUser.rows[0].id);
      res.json({ user: newUser.rows[0], token });
    } else {
      const token = generateToken(user.rows[0].id);
      res.json({ user: user.rows[0], token });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get a user by username
app.get('/user/:username', async (req, res) => {
  try {
    const user = await db.query('SELECT * FROM users WHERE username = $1', [req.params.username]);
    if (user.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json(user.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to create a new post associated with the logged-in user
app.post('/posts', async (req, res) => {
  try {
    const newPost = await db.query('INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *', [req.body.title, req.body.content]);
    res.json(newPost.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get all posts, joining posts with user
app.get('/posts', async (req, res) => {
  try {
    const allPosts = await db.query('SELECT posts.*, users.username AS user_username FROM posts INNER JOIN users ON posts.user_id = users.id');
    res.json(allPosts.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get all categories
app.get('/categories', async (req, res) => {
  try {
    const allCategories = await db.query('SELECT * FROM categories');
    res.json(allCategories.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// User delete their post after check if the user is the owner of the post
// Update the '/posts/:id' endpoint to handle editing and deletion
app.put('/posts/:id', async(req, res) => {
    try {
      const post = await db.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
      if (post.rows.length === 0) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }
      if (post.rows[0].user_id === req.body.user_id) {
        const updatedPost = await db.query('UPDATE posts SET title = $1, content = $2 WHERE id = $3 RETURNING *', [req.body.title, req.body.content, req.params.id]);
        res.json(updatedPost.rows[0]);
      } else {
        res.status(401).json({ error: 'You are not authorized to edit this post' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.delete('/posts/:id', async(req, res) => {
    try {
      const post = await db.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
      if (post.rows.length === 0) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }
      if (post.rows[0].user_id === req.body.user_id) {
        await db.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
        res.json({ message: 'Post deleted successfully' });
      } else {
        res.status(401).json({ error: 'You are not authorized to delete this post' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

app.listen(8080, () => console.log("I'm running on port 8080!"));