import React from 'react';
import { FiUser } from 'react-icons/fi';
import './DefaultAvatar.css';

const DefaultAvatar = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'default-avatar-sm',
        md: 'default-avatar-md',
        lg: 'default-avatar-lg',
        xl: 'default-avatar-xl'
    };

    return (
        <div className={`default-avatar ${sizeClasses[size]} ${className}`}>
            <FiUser />
        </div>
    );
};

export default DefaultAvatar;
