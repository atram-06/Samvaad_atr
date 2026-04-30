import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            setMessage('If an account exists with this email, you will receive a password reset link shortly.');
            setEmail('');
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    {/* Logo/Brand */}
                    <div className="auth-brand">
                        <div className="brand-icon">
                            <img src="/logo.jpg" alt="SAMVAAD Logo" className="brand-logo" />
                        </div>
                        <h1 className="brand-name">SAMVAAD</h1>
                    </div>

                    {/* Header */}
                    <div className="auth-header">
                        <h2 className="auth-title">Forgot Password?</h2>
                        <p className="auth-subtitle">
                            Enter your email and we'll send you a link to reset your password
                        </p>
                    </div>

                    {/* Success Message */}
                    {message && (
                        <div className="success-message">
                            <FiCheckCircle />
                            <span>{message}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email</label>
                            <div className="input-wrapper">
                                <FiMail className="input-icon" />
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <div className="auth-footer">
                        <Link to="/login" className="back-link">
                            <FiArrowLeft />
                            Back to Login
                        </Link>
                    </div>
                </div>

                {/* Decorative Background */}
                <div className="auth-decoration">
                    <div className="decoration-circle circle-1"></div>
                    <div className="decoration-circle circle-2"></div>
                    <div className="decoration-circle circle-3"></div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
