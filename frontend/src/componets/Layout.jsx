import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import NotificationsDrawer from './NotificationsDrawer';
import SearchDrawer from './SearchDrawer';
import CreatePostModal from './CreatePostModal';
import './Layout.css';

const Layout = ({ children }) => {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const toggleNotifications = () => {
        setIsNotificationsOpen(!isNotificationsOpen);
        if (isSearchOpen) setIsSearchOpen(false);
    };

    const toggleCreatePost = () => {
        setIsCreatePostOpen(!isCreatePostOpen);
    };

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
        if (isNotificationsOpen) setIsNotificationsOpen(false);
    };

    const location = useLocation();
    const showRightSidebar = location.pathname === '/';
    const isMessagesPage = location.pathname.startsWith('/messages');

    return (
        <div className="app-layout">
            <div className="mobile-nav">
                <Navbar
                    onToggleNotifications={toggleNotifications}
                    onToggleCreatePost={toggleCreatePost}
                />
            </div>
            <div className="main-container">
                <Sidebar
                    collapsed={isSearchOpen || isNotificationsOpen}
                    onToggleCreatePost={toggleCreatePost}
                    onToggleSearch={toggleSearch}
                    onToggleNotifications={toggleNotifications}
                />
                <SearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
                <NotificationsDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
                <CreatePostModal isOpen={isCreatePostOpen} onClose={() => setIsCreatePostOpen(false)} />

                <main
                    className={`content-area ${isSearchOpen ? 'search-active' : ''} ${!showRightSidebar ? 'no-right-sidebar' : ''} ${isMessagesPage ? 'no-padding' : ''}`}
                    style={isMessagesPage ? { padding: 0, overflow: 'hidden', height: '100%' } : {}}
                >
                    {children}
                </main>
                {showRightSidebar && <RightSidebar />}
            </div>
        </div>
    );
};

export default Layout;
