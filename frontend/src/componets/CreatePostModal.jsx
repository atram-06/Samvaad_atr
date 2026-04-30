import React, { useState, useRef, useEffect } from 'react';
import { FiImage, FiArrowLeft, FiVideo, FiMusic, FiFileText, FiCamera } from 'react-icons/fi';
import DefaultAvatar from './DefaultAvatar';
import './CreatePostModal.css';
import { API_BASE_URL } from '../config/api';

const CreatePostModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1); // 1: Category, 2: Content
    const [category, setCategory] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [caption, setCaption] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            setShowCamera(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please allow permissions.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                const file = new File([blob], "camera_capture.png", { type: "image/png" });
                setSelectedFile(file);
                setPreviewUrl(URL.createObjectURL(file));
                stopCamera();
            }, 'image/png');
        }
    };

    // Attach stream to video element when camera view is shown
    useEffect(() => {
        if (showCamera && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [showCamera]);

    // Cleanup on unmount or close
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!isOpen) return null;

    const handleCategorySelect = (cat) => {
        setCategory(cat);
        setStep(2);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
            setCategory(null);
            setSelectedFile(null);
            setPreviewUrl(null);
            setCaption('');
        }
    };

    const handleShare = async () => {
        if (category !== 'blog' && !selectedFile) return;
        if (category === 'blog' && !caption.trim()) return;

        const formData = new FormData();
        if (selectedFile) formData.append('file', selectedFile);
        formData.append('caption', caption);
        formData.append('category', category);

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Post created:', data);
                alert('Uploaded successfully!');
                onClose();
                // Reset
                setStep(1);
                setCategory(null);
                setSelectedFile(null);
                setPreviewUrl(null);
                setCaption('');
                window.location.reload(); // Refresh to show new post
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to share post');
            }
        } catch (err) {
            console.error('Error sharing post:', err);
            alert('An error occurred while sharing.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderCategorySelection = () => (
        <div className="category-selection">
            <h3 className="modal-subtitle">What do you want to share?</h3>
            <div className="category-grid">
                <button className="category-btn" onClick={() => handleCategorySelect('post')}>
                    <div className="cat-icon-wrapper post-bg"><FiImage size={24} /></div>
                    <span>Post</span>
                </button>
                <button className="category-btn" onClick={() => handleCategorySelect('video')}>
                    <div className="cat-icon-wrapper video-bg"><FiVideo size={24} /></div>
                    <span>Video</span>
                </button>
                <button className="category-btn" onClick={() => handleCategorySelect('music')}>
                    <div className="cat-icon-wrapper music-bg"><FiMusic size={24} /></div>
                    <span>Music</span>
                </button>
                <button className="category-btn" onClick={() => handleCategorySelect('blog')}>
                    <div className="cat-icon-wrapper blog-bg"><FiFileText size={24} /></div>
                    <span>Blog</span>
                </button>
            </div>
        </div>
    );



    const renderContentCreation = () => (
        <div className="content-creation">
            {category === 'blog' ? (
                <div className="blog-editor">
                    <textarea
                        className="blog-input"
                        placeholder="Write your blog post here..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        autoFocus
                    />
                </div>
            ) : (
                <div className="media-upload-section">
                    {showCamera ? (
                        <div className="camera-view">
                            <video ref={videoRef} autoPlay playsInline className="camera-video-preview" />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                            <div className="camera-controls">
                                <button className="camera-capture-btn" onClick={capturePhoto}>
                                    <div className="camera-capture-inner"></div>
                                </button>
                                <button className="camera-cancel-btn" onClick={stopCamera}>Cancel</button>
                            </div>
                        </div>
                    ) : !selectedFile ? (
                        <div className="upload-placeholder">
                            <div className="upload-options-row">
                                <div className="upload-icon-circle" onClick={() => fileInputRef.current.click()}>
                                    {category === 'video' ? <FiVideo size={32} /> : category === 'music' ? <FiMusic size={32} /> : <FiImage size={32} />}
                                </div>
                                {category === 'post' && (
                                    <div className="upload-icon-circle camera-icon-btn" onClick={startCamera}>
                                        <FiCamera size={32} />
                                    </div>
                                )}
                            </div>
                            <p>Select {category} to upload {category === 'post' && 'or take a photo'}</p>
                            <button className="select-btn-primary" onClick={() => fileInputRef.current.click()}>
                                Select from computer
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept={category === 'video' ? "video/*" : category === 'music' ? "audio/*" : "image/*"}
                                onChange={handleFileSelect}
                            />
                        </div>
                    ) : (
                        <div className="preview-layout">
                            <div className="media-preview">
                                {category === 'video' ? (
                                    <video src={previewUrl} controls className="preview-content" />
                                ) : category === 'music' ? (
                                    <div className="audio-preview">
                                        <FiMusic size={48} />
                                        <audio src={previewUrl} controls />
                                    </div>
                                ) : (
                                    <img src={previewUrl} alt="Preview" className="preview-content" />
                                )}
                                <button className="change-media-btn" onClick={() => setSelectedFile(null)}>Change</button>
                            </div>
                            <div className="caption-area">
                                <div className="user-info-mini">
                                    {user.profilePic ? (
                                        <img src={user.profilePic} alt={user.username} className="user-avatar-mini" />
                                    ) : (
                                        <DefaultAvatar size="sm" />
                                    )}
                                    <span className="username-mini">{user.username || 'You'}</span>
                                </div>
                                <textarea
                                    className="caption-input-mini"
                                    placeholder="Write a caption..."
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="create-post-overlay">
            <div className={`create-post-modal ${step === 2 && selectedFile ? 'expanded' : ''}`}>
                <div className="modal-header">
                    {step === 1 ? (
                        <>
                            <div style={{ width: '32px' }}></div>
                            <span className="modal-title">Create new post</span>
                            <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
                        </>
                    ) : (
                        <>
                            <button className="modal-btn back" onClick={handleBack} disabled={isLoading}><FiArrowLeft size={24} /></button>
                            <span className="modal-title">New {category}</span>
                            <button
                                className="modal-btn share"
                                onClick={handleShare}
                                disabled={isLoading || (category !== 'blog' && !selectedFile) || (category === 'blog' && !caption.trim())}
                            >
                                {isLoading ? 'Sharing...' : 'Share'}
                            </button>
                        </>
                    )}
                </div>
                <div className="modal-body">
                    {step === 1 ? renderCategorySelection() : renderContentCreation()}
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;
