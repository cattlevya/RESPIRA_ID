import React from 'react';
import Sidebar from './Sidebar';
import SidebarExpert from './SidebarExpert';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

const AppShell = ({ children }) => {
    const { user } = useAuth();

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
            {/* Sidebar based on Role */}
            {user?.role === 'expert' ? <SidebarExpert /> : <Sidebar />}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:ml-[260px] transition-all duration-300">
                <Header />

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-6 pb-12">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>

                {/* Fixed Status Bar REMOVED */}
            </div>
        </div>
    );
};

export default AppShell;
