import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';
import { getProfile, updateProfile, changePassword } from '../services/authService';
import UserAvatar3D from '../components/3d/UserAvatar3D';
import ProfileBackground from '../components/3d/ProfileBackground';
import AchievementBadge from '../components/3d/AchievementBadge';
import GameCard3D from '../components/3d/GameCard3D';
import './UserProfile.css';

// Sample data for demonstration
const SAMPLE_ACHIEVEMENTS = [
  { name: 'Game Collector', level: 1 },
  { name: 'Platinum Player', level: 2 },
  { name: 'Digital Explorer', level: 3 },
];

const SAMPLE_GAMES = [
  { 
    title: 'Cyberpunk 2077', 
    platform: 'PC', 
    price: 59.99, 
    image_url: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' 
  },
  { 
    title: 'The Last of Us Part II', 
    platform: 'PlayStation 5', 
    price: 49.99, 
    image_url: 'https://images.unsplash.com/photo-1616293222233-7fd2e718edd4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' 
  }
];

const UserProfile = () => {
  const { isAuthenticated, user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      toast.error('Please login to view your profile');
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await getProfile();
        
        // Extract user data from the response correctly
        const userData = profileData.user || {};
        
        setProfileForm({
          name: userData.username || user?.username || '',
          email: userData.email || user?.email || '',
          phoneNumber: userData.phoneNumber || '',
          address: userData.address || '',
          city: userData.city || '',
          state: userData.state || '',
          zipCode: userData.zipCode || '',
          country: userData.country || 'United States'
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load your profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, navigate, user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const updatedProfile = await updateProfile(profileForm);
      
      // Update user data in store
      setUser({
        ...user,
        name: updatedProfile.name,
        email: updatedProfile.email
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const validatePasswordForm = () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    
    if (!currentPassword) {
      toast.error('Current password is required');
      return false;
    }
    
    if (!newPassword) {
      toast.error('New password is required');
      return false;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    try {
      setChangingPassword(true);
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password. Please check your current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <ProfileBackground />
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Add 3D background */}
      <ProfileBackground />
      
      <div className="profile-header">
        <h1>Your Profile</h1>
      </div>
      
      <div className="profile-grid">
        <div className="profile-sidebar">
          <div className="user-info">
            {/* Replace standard avatar with 3D avatar */}
            <UserAvatar3D username={profileForm.name || user?.name || 'User'} />
            <div className="user-name">{profileForm.name || user?.name || 'User'}</div>
            <div className="user-email">{profileForm.email || user?.email || ''}</div>
          </div>
          
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Personal Information
            </button>
            
            <button
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            
            <button
              className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              Achievements
            </button>
            
            <button
              className={`tab-btn ${activeTab === 'collection' ? 'active' : ''}`}
              onClick={() => setActiveTab('collection')}
            >
              My Games
            </button>
            
            <Link to="/orders" className="tab-btn">
              Order History
            </Link>
            
            <button className="tab-btn logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        
        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="profile-section-card">
              <h2>Personal Information</h2>
              
              <form onSubmit={handleProfileSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={profileForm.phoneNumber}
                    onChange={handleProfileChange}
                  />
                </div>
                
                <h3>Shipping Address</h3>
                
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={profileForm.address}
                    onChange={handleProfileChange}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={profileForm.city}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="state">State/Province</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={profileForm.state}
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP Code</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={profileForm.zipCode}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <select
                      id="country"
                      name="country"
                      value={profileForm.country}
                      onChange={handleProfileChange}
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="profile-section-card">
              <h2>Security Settings</h2>
              
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={changingPassword}
                  >
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* New Achievements Tab with 3D badges */}
          {activeTab === 'achievements' && (
            <div className="profile-section-card">
              <h2>Your Achievements</h2>
              
              <div className="achievements-container">
                {SAMPLE_ACHIEVEMENTS.map((achievement, index) => (
                  <div key={index} className="achievement-item">
                    <AchievementBadge name={achievement.name} level={achievement.level} />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* New Collection Tab with 3D game cards */}
          {activeTab === 'collection' && (
            <div className="profile-section-card">
              <h2>Your Game Collection</h2>
              
              <div className="games-collection">
                {SAMPLE_GAMES.map((game, index) => (
                  <div key={index} className="game-item-3d">
                    <GameCard3D game={game} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 