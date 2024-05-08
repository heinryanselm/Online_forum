import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser[0]);
      setIsLoggedIn(true);
    }
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8080/categories');
      const data = await response.json();
      setCategories(data); // Set categories directly from the response data
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn && selectedCategory !== '') {
      fetchPosts();
    }
  }, [isLoggedIn, selectedCategory]);

  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:8080/posts');
      const postData = await response.json();

      const postsWithUsernames = await Promise.all(
        postData.map(async (post) => {
          const userResponse = await fetch(`http://localhost:8080/user/${post.user_id}`);
          const userData = await userResponse.json();
          return { ...post, username: userData.username };
        })
      );

      setPosts(postsWithUsernames);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleLogin = async () => {
    console.log('Logging in...');
    try {
      //Making login request to the server
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username }),
      });
      const data = await response.json();
      //Store user information and token to local storage
      localStorage.setItem('user', JSON.stringify(data.user));

      //Update state with user information
      setUser(data.user);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const handleLogout = () => {
    //Clear stored user information and token from local storage
    localStorage.removeItem('user');

    //Update state with null values
    setUser(null);
    setIsLoggedIn(false);
  };


  // eslint-disable-next-line no-unused-vars
  const handleAddCategory = async () => {
    try {
      const response = await fetch('http://localhost:8080/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName }),
      });
      const data = await response.json();
      console.log('New category:', data);
      setCategories([...categories, data]);
      setSelectedCategory(data.id); // Set the ID of the new category
      setNewCategoryName('');
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleAddPost = async () => {
    try {
      const response = await fetch('http://localhost:8080/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newPostTitle, content: newPostContent, category_id: selectedCategory }),
      });
      const data = await response.json();
      console.log('New post:', data);
      setPosts([...posts, { ...data, username }]); // Add username to the new post
      setNewPostTitle('');
      setNewPostContent('');
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  // Function to handle editing a post
const handleEditPost = async (postId, updatedTitle, updatedContent) => {
  try {
    const response = await fetch(`http://localhost:8080/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: updatedTitle, content: updatedContent, user_id: user.id }),
    });
    const data = await response.json();
    console.log('Updated post:', data);
    // Update posts state with the edited post
    const updatedPosts = posts.map(post => (post.id === postId ? { ...post, title: updatedTitle, content: updatedContent } : post));
    setPosts(updatedPosts);
  } catch (error) {
    console.error('Error editing post:', error);
  }
};

// Function to handle deleting a post
const handleDeletePost = async (postId) => {
  try {
    const response = await fetch(`http://localhost:8080/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: user.id }),
    });
    const data = await response.json();
    console.log('Deleted post:', data);
    // Remove the deleted post from the posts state
    const updatedPosts = posts.filter(post => post.id !== postId);
    setPosts(updatedPosts);
  } catch (error) {
    console.error('Error deleting post:', error);
  }
};

  return (
    <div className='App'>
      {!isLoggedIn ? (
        <div>
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div>
          <h2>Create Post</h2>
          <input
            type="text"
            placeholder="Enter post title"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
          />
          <textarea
            placeholder="Enter post content"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          ></textarea>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button onClick={handleAddPost}>Add Post</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
      <h2>All Posts</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h5>{post.title}</h5>
            <p>{post.content}</p>
            <p>Posted by: {post.username}</p>
            {post.user_id === user.id && (
              <div>
                <button onClick={() => handleEditPost(post.id, 'Updated Content')}>Edit</button>
                <button onClick={() => handleDeletePost(post.id)}>Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;