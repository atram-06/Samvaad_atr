import React, { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';
import DefaultAvatar from './DefaultAvatar';
import './SearchDrawer.css';

const MAX_SEARCH_HISTORY = 10;

const SearchDrawer = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [followingUsers, setFollowingUsers] = useState(new Set());

    // Load search history from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('searchHistory');
        if (stored) {
            try {
                setSearchHistory(JSON.parse(stored));
            } catch (err) {
                console.error('Failed to load search history:', err);
            }
        }
    }, []);

    // Debounced search function
    useEffect(() => {
        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timeoutId = setTimeout(async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data);

                    // Initialize following state
                    const following = new Set();
                    data.forEach(user => {
                        if (user.isFollowing) {
                            following.add(user.id);
                        }
                    });
                    setFollowingUsers(following);
                } else {
                    console.error('Search failed:', res.status);
                    setSearchResults([]);
                }
            } catch (err) {
                console.error('Search error:', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleClear = () => {
        setQuery('');
        setSearchResults([]);
    };

    const saveToSearchHistory = (user) => {
        const newHistory = [
            { ...user, searchedAt: new Date().toISOString() },
            ...searchHistory.filter(u => u.id !== user.id)
        ].slice(0, MAX_SEARCH_HISTORY);

        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    };

    const clearAllHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('searchHistory');
    };

    const removeFromHistory = (userId, e) => {
        e.stopPropagation();
        const newHistory = searchHistory.filter(u => u.id !== userId);
        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    };

    const handleFollowToggle = async (userId, e) => {
        e.stopPropagation();

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setFollowingUsers(prev => {
                    const newSet = new Set(prev);
                    if (data.isFollowing) {
                        newSet.add(userId);
                    } else {
                        newSet.delete(userId);
                    }
                    return newSet;
                });

                // Update search results
                setSearchResults(prev => prev.map(user =>
                    user.id === userId ? { ...user, isFollowing: data.isFollowing } : user
                ));

                // Update search history
                setSearchHistory(prev => prev.map(user =>
                    user.id === userId ? { ...user, isFollowing: data.isFollowing } : user
                ));
            }
        } catch (err) {
            console.error('Follow toggle error:', err);
        }
    };

    const handleUserClick = (user) => {
        saveToSearchHistory(user);
    };

    const renderUserItem = (user, isHistory = false) => (
        <div
            className="search-item"
            key={user.id}
            onClick={() => !isHistory && handleUserClick(user)}
        >
            <div className="search-avatar">
                {user.profilePic ? (
                    <img src={user.profilePic} alt={user.username} />
                ) : (
                    <DefaultAvatar username={user.username} size={44} />
                )}
            </div>
            <div className="search-info">
                <span className="search-username">{user.username}</span>
                <span className="search-fullname">{user.fullname || 'Instagram User'}</span>
            </div>
            {isHistory ? (
                <button
                    className="remove-history"
                    onClick={(e) => removeFromHistory(user.id, e)}
                    aria-label="Remove from history"
                >
                    <FiX />
                </button>
            ) : (
                <button
                    className={`follow-btn ${followingUsers.has(user.id) ? 'following' : ''}`}
                    onClick={(e) => handleFollowToggle(user.id, e)}
                >
                    {followingUsers.has(user.id) ? 'Following' : 'Follow'}
                </button>
            )}
        </div>
    );

    return (
        <>
            {/* Overlay to close drawer when clicking outside */}
            <div className={`search-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>

            <div className={`search-drawer ${isOpen ? 'open' : ''}`}>
                <div className="search-header">
                    <span className="search-title">Search</span>
                    <div className="search-input-container">
                        <FiSearch className="search-icon-input" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus={isOpen}
                        />
                        {query && (
                            <button className="search-clear" onClick={handleClear}>
                                <FiX />
                            </button>
                        )}
                    </div>
                </div>

                <div className="search-content">
                    {query.trim() ? (
                        // Show search results
                        <>
                            {isSearching ? (
                                <div className="search-loading">
                                    <div className="spinner"></div>
                                </div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map(user => renderUserItem(user, false))
                            ) : (
                                <div className="no-results">
                                    <p>No results found.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        // Show search history
                        <>
                            {searchHistory.length > 0 ? (
                                <>
                                    <div className="search-section-header">
                                        <span className="section-title">Recent</span>
                                        <button className="clear-all" onClick={clearAllHistory}>
                                            Clear all
                                        </button>
                                    </div>
                                    {searchHistory.map(user => renderUserItem(user, true))}
                                </>
                            ) : (
                                <div className="no-results">
                                    <p>No recent searches.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default SearchDrawer;
