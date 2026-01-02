import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from '../../assets/logo.png';
import log1Bg from '../../assets/background.jpeg';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(username, password);
            // Login function returns { success: true, user: userData } on success
            if (result?.success) {
                navigate('/dashboard', { replace: true });
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            setError(err.message || 'Invalid username or password');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-left">
                <div className="login-welcome-container">
                    <h2 className="login-welcome-text">Welcome to Brooklyn Private School</h2>
                </div>
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo-container">
                            <img src={logoImage} alt="Logo" className="login-logo" />
                        </div>
                        <h1 className="login-title">Login Now</h1>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        {error && (
                            <div className="login-error-message">
                                {error}
                            </div>
                        )}

                        <div className="form-field">
                            <label htmlFor="username" className="form-label">
                                Username <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="username"
                                className="login-input"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setError('');
                                }}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="password" className="form-label">
                                Password <span className="required">*</span>
                            </label>
                            <input
                                type="password"
                                id="password"
                                className="login-input"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="forgot-password-container">
                            <a href="#" className="forgot-password-link">Forgot Password?</a>
                        </div>

                        <button
                            type="submit"
                            className="login-submit-btn"
                            disabled={loading}
                            style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                        >
                            {loading ? 'Logging in...' : 'Submit'}
                        </button>

                        <div className="register-link-container">
                            <span className="register-text">Don't have an account? </span>
                            <a href="#" className="register-link">Register for User Account</a>
                        </div>
                    </form>
                </div>
                <div className="login-footer">
                    <p className="login-copyright">
                        © All rights reserved by <span className="xedra-text"><span className="xedra-x">X</span><span className="xedra-edra">edra</span></span> Systems 2025
                    </p>
                </div>
            </div>

            <div className="login-right" style={{ backgroundImage: `url(${log1Bg})` }}>
                <div className="login-right-pattern"></div>
            </div>
        </div>
    );
};

export default Login;
