import React, { useState } from 'react';
import { FiImage, FiVideo, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import './Create.css';

const Create = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('caption', caption);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                navigate('/');
            } else {
                console.error('Failed to create post');
            }
        } catch (err) {
            console.error('Error creating post:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-container">
            <div className="create-header">
                <h2>Create new post</h2>
                <button
                    className="share-btn"
                    onClick={handleSubmit}
                    disabled={!file || loading}
                >
                    {loading ? 'Sharing...' : 'Share'}
                </button>
            </div>

            <div className="create-body">
                {preview ? (
                    <div className="preview-container">
                        {file.type.startsWith('video') ? (
                            <video src={preview} controls className="media-preview" />
                        ) : (
                            <img src={preview} alt="Preview" className="media-preview" />
                        )}
                        <button className="remove-btn" onClick={() => { setFile(null); setPreview(null); }}>
                            <FiX />
                        </button>
                    </div>
                ) : (
                    <div className="upload-placeholder">
                        <FiImage size={48} />
                        <p>Drag photos and videos here</p>
                        <label htmlFor="file-upload" className="select-btn">
                            Select from computer
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            hidden
                        />
                    </div>
                )}

                <div className="caption-section">
                    <div className="user-info">
                        <div className="user-avatar-sm"></div>
                        <span className="username">{JSON.parse(localStorage.getItem('user'))?.username}</span>
                    </div>
                    <textarea
                        placeholder="Write a caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        maxLength="2200"
                    />
                    <div className="char-count">{caption.length}/2,200</div>
                </div>
            </div>
        </div>
    );
};

export default Create;
