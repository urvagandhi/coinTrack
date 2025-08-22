import { useState, useEffect } from 'react';
import './Dashboard.css';

interface User {
    id: string;
    username: string;
    name: string;
    dateOfBirth: string;
    email: string;
    phoneNumber: string;
    createdAt: string;
    updatedAt: string;
}

export const Dashboard = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('http://localhost:8080/api/user/{id}');

            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.status}`);
            }

            const userData = await response.json();
            setUsers(userData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching users';
            setError(errorMessage);
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Invalid date';
        }
    };

    const calculateAge = (dateOfBirth: string) => {
        try {
            const today = new Date();
            const birthDate = new Date(dateOfBirth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            return age;
        } catch {
            return 0;
        }
    };

    const getUsersUnder30Count = () => {
        return users.filter(user => calculateAge(user.dateOfBirth) < 30).length;
    };

    const getNewUsersCount = () => {
        const thirtyDaysAgo = new Date().getTime() - (30 * 24 * 60 * 60 * 1000);
        return users.filter(user => {
            try {
                return new Date(user.createdAt).getTime() > thirtyDaysAgo;
            } catch {
                return false;
            }
        }).length;
    };

    if (loading) {
        return (
            <div className="dashboard">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading users...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard">
                <div className="error-container">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={fetchUsers} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>User Management Dashboard</h1>
                <div className="user-stats">
                    <div className="stat-item">
                        <span className="stat-number">{users.length}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{getUsersUnder30Count()}</span>
                        <span className="stat-label">Under 30</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{getNewUsersCount()}</span>
                        <span className="stat-label">New Users (30d)</span>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                <section className="users-section">
                    <div className="section-header">
                        <h2>All Users</h2>
                        <button onClick={fetchUsers} className="refresh-button">
                            🔄 Refresh
                        </button>
                    </div>

                    {users.length === 0 ? (
                        <div className="empty-state">
                            <p>No users found</p>
                        </div>
                    ) : (
                        <div className="users-grid">
                            {users.map(user => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    formatDate={formatDate}
                                    calculateAge={calculateAge}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

interface UserCardProps {
    user: User;
    formatDate: (dateString: string) => string;
    calculateAge: (dateOfBirth: string) => number;
}

const UserCard = ({ user, formatDate, calculateAge }: UserCardProps) => {
    const handleViewUser = () => {
        console.log('View user:', user.id);
        // TODO: Implement view user functionality
    };

    const handleEditUser = () => {
        console.log('Edit user:', user.id);
        // TODO: Implement edit user functionality
    };

    const handleDeleteUser = () => {
        console.log('Delete user:', user.id);
        // TODO: Implement delete user functionality
    };

    return (
        <div className="user-card">
            <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="user-info">
                <h3 className="user-name">{user.name || 'Unknown'}</h3>
                <p className="user-username">@{user.username || 'unknown'}</p>
                <div className="user-details">
                    <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{user.email || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{user.phoneNumber || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Age:</span>
                        <span className="detail-value">{calculateAge(user.dateOfBirth)} years</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Joined:</span>
                        <span className="detail-value">{formatDate(user.createdAt)}</span>
                    </div>
                </div>
            </div>
            <div className="user-actions">
                <button className="action-btn view-btn" onClick={handleViewUser}>
                    View
                </button>
                <button className="action-btn edit-btn" onClick={handleEditUser}>
                    Edit
                </button>
                <button className="action-btn delete-btn" onClick={handleDeleteUser}>
                    Delete
                </button>
            </div>
        </div>
    );
};
