import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getGenres, getPlatforms } from '../../services/gameService';
import { addGame, updateGame, getGameById } from '../../services/adminService';
import '../../admin/Admin.css';

const GameForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(id ? true : false);
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discount: '0',
    category: '',
    platform: '',
    releaseDate: '',
    publisher: '',
    developer: '',
    inStock: true,
    quantity: '10',
    features: [''],
    specifications: {
      os: '',
      processor: '',
      memory: '',
      graphics: '',
      storage: ''
    }
  });

  const isEditMode = !!id;

  useEffect(() => {
    // Fetch categories and platforms
    const fetchMetadata = async () => {
      try {
        const [categoriesData, platformsData] = await Promise.all([
          getGenres(),
          getPlatforms()
        ]);
        
        setCategories(categoriesData || []);
        setPlatforms(platformsData || []);
      } catch (error) {
        console.error('Error fetching metadata:', error);
        toast.error('Failed to load categories and platforms');
      }
    };

    fetchMetadata();

    // If in edit mode, fetch game data
    if (isEditMode) {
      const fetchGame = async () => {
        try {
          setLoading(true);
          const gameData = await getGameById(id);
          
          // Format release date for the input
          let formattedDate = '';
          if (gameData.release_date) {
            const date = new Date(gameData.release_date);
            formattedDate = date.toISOString().split('T')[0];
          }
          
          // Get the stock quantity
          const stockQuantity = gameData.stock_quantity || 0;
          
          // Set form data with game details
          setFormData({
            title: gameData.title || '',
            description: gameData.description || '',
            price: gameData.price !== undefined ? gameData.price.toString() : '',
            discount: gameData.discount !== undefined ? gameData.discount.toString() : '0',
            category: gameData.genre || '',
            platform: gameData.platform || '',
            releaseDate: formattedDate,
            publisher: gameData.publisher || '',
            developer: gameData.developer || '',
            inStock: stockQuantity > 0,
            quantity: stockQuantity.toString(),
            features: gameData.features ? gameData.features.split(',').map(f => f.trim()) : [''],
            specifications: {
              os: gameData.os || '',
              processor: gameData.processor || '',
              memory: gameData.memory || '',
              graphics: gameData.graphics || '',
              storage: gameData.storage || ''
            }
          });
          
          // Set image preview if there is an image
          if (gameData.image_url) {
            setImagePreview(gameData.image_url.startsWith('http') 
              ? gameData.image_url 
              : `/uploads/${gameData.image_url}`);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching game:', error);
          toast.error('Failed to load game data');
          setLoading(false);
          navigate('/admin/games'); // Redirect if game not found
        }
      };

      fetchGame();
    }
  }, [id, isEditMode, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [name]: value
      }
    }));
  };

  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: updatedFeatures }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index) => {
    if (formData.features.length > 1) {
      const updatedFeatures = formData.features.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, features: updatedFeatures }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (!validImageTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, WebP, GIF, SVG)');
        return;
      }
      
      setImageFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const validateForm = () => {
    const requiredFields = ['title', 'description', 'price', 'category', 'platform'];
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        return false;
      }
    }
    
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      toast.error('Price must be a positive number');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Prepare game data with all fields
      const gameData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        discount: parseFloat(formData.discount || 0),
        genre: formData.category,
        platform: formData.platform,
        release_date: formData.releaseDate,
        publisher: formData.publisher,
        developer: formData.developer,
        stock_quantity: parseInt(formData.quantity, 10),
        features: formData.features.filter(f => f.trim()).join(','),
        // Add specifications if they exist
        os: formData.specifications.os,
        processor: formData.specifications.processor,
        memory: formData.specifications.memory,
        graphics: formData.specifications.graphics,
        storage: formData.specifications.storage,
      };
      
      // Only add image if a new one is selected
      if (imageFile) {
        gameData.image = imageFile;
      }
      
      let response;
      if (isEditMode) {
        response = await updateGame(id, gameData);
        toast.success('Game updated successfully');
      } else {
        response = await addGame(gameData);
        toast.success('Game added successfully');
      }
      
      navigate('/admin/games');
    } catch (error) {
      console.error('Error saving game:', error);
      toast.error(isEditMode ? 'Failed to update game' : 'Failed to add game');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1>{isEditMode ? 'Edit Game' : 'Add New Game'}</h1>
        <p>{isEditMode ? 'Update game details' : 'Add a new game to the store'}</p>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="admin-form">
          {/* Game Image Section - Moving to top for better visibility */}
          <div className="form-section">
            <h2>Game Image</h2>
            <div className="image-upload-container">
              <div className="image-preview">
                {imagePreview ? (
                  <img src={imagePreview} alt="Game preview" />
                ) : (
                  <div className="no-image">Choose an image</div>
                )}
              </div>
              <label className="image-upload-label">
                {isEditMode ? 'Change Image' : 'Upload Image'}
                <input
                  type="file"
                  className="image-upload-input"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
              <p className="image-format-hint">
                Supported formats: JPG, PNG, WebP, GIF, SVG. Any resolution will be accepted and properly displayed.
              </p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="form-section">
            <h2>Basic Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter game title"
                />
              </div>
              <div className="form-group">
                <label htmlFor="price">Price (USD)*</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                  placeholder="29.99"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Genre*</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Genre</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="platform">Platform*</label>
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Platform</option>
                  {platforms.map((plat, index) => (
                    <option key={index} value={plat}>{plat}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="releaseDate">Release Date</label>
                <input
                  type="date"
                  id="releaseDate"
                  name="releaseDate"
                  value={formData.releaseDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="discount">Discount (%)</label>
                <input
                  type="number"
                  id="discount"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description*</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Enter game description"
              ></textarea>
            </div>
          </div>
          
          {/* Publisher Information */}
          <div className="form-section">
            <h2>Publisher Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="publisher">Publisher</label>
                <input
                  type="text"
                  id="publisher"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleInputChange}
                  placeholder="Enter publisher name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="developer">Developer</label>
                <input
                  type="text"
                  id="developer"
                  name="developer"
                  value={formData.developer}
                  onChange={handleInputChange}
                  placeholder="Enter developer name"
                />
              </div>
            </div>
          </div>
          
          {/* Stock Information */}
          <div className="form-section">
            <h2>Stock Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="inStock">Status</label>
                <select
                  id="inStock"
                  name="inStock"
                  value={formData.inStock}
                  onChange={(e) => handleCheckboxChange({
                    target: {
                      name: 'inStock',
                      checked: e.target.value === 'true',
                    },
                  })}
                >
                  <option value="true">In Stock</option>
                  <option value="false">Out of Stock</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="quantity">Quantity</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="0"
                  disabled={!formData.inStock}
                  placeholder="Enter quantity"
                />
              </div>
            </div>
          </div>
          
          {/* Features */}
          <div className="form-section">
            <h2>Game Features</h2>
            {formData.features.map((feature, index) => (
              <div className="form-group" key={index} style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  placeholder={`Feature ${index + 1}`}
                  style={{ flexGrow: 1 }}
                />
                {formData.features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="admin-btn secondary"
                    style={{ flexShrink: 0 }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addFeature}
              className="admin-btn secondary"
            >
              Add Feature
            </button>
          </div>
          
          {/* System Requirements */}
          <div className="form-section">
            <h2>System Requirements</h2>
            <div className="form-group">
              <label htmlFor="os">Operating System</label>
              <input
                type="text"
                id="os"
                name="os"
                value={formData.specifications.os}
                onChange={handleSpecChange}
                placeholder="e.g., Windows 10 64-bit / macOS 10.15"
              />
            </div>
            <div className="form-group">
              <label htmlFor="processor">Processor</label>
              <input
                type="text"
                id="processor"
                name="processor"
                value={formData.specifications.processor}
                onChange={handleSpecChange}
                placeholder="e.g., Intel Core i5-4670K or AMD equivalent"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="memory">Memory</label>
                <input
                  type="text"
                  id="memory"
                  name="memory"
                  value={formData.specifications.memory}
                  onChange={handleSpecChange}
                  placeholder="e.g., 8 GB RAM"
                />
              </div>
              <div className="form-group">
                <label htmlFor="graphics">Graphics</label>
                <input
                  type="text"
                  id="graphics"
                  name="graphics"
                  value={formData.specifications.graphics}
                  onChange={handleSpecChange}
                  placeholder="e.g., NVIDIA GTX 960 or AMD equivalent"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="storage">Storage</label>
              <input
                type="text"
                id="storage"
                name="storage"
                value={formData.specifications.storage}
                onChange={handleSpecChange}
                placeholder="e.g., 20 GB available space"
              />
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/games')}
              className="admin-btn secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : (isEditMode ? 'Update Game' : 'Add Game')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default GameForm; 