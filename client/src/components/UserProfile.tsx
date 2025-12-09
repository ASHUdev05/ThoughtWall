import React, { useEffect, useState } from 'react';
import { userService, type UserProfile } from '../services/userService';
import { roomService } from '../services/thoughtService';

interface Props {
    onClose: () => void;
    onLogout: () => void;
    onNavigateToRoom: (id: number) => void;
}

const UserProfileView: React.FC<Props> = ({ onClose, onLogout, onNavigateToRoom }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await userService.getProfile();
            setProfile(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoom = async (roomId: number) => {
        if (!confirm("Are you sure? This will delete the room and all thoughts in it.")) return;
        try {
            await roomService.deleteRoom(roomId);
            loadProfile(); // Refresh
        } catch (e) {
            alert("Failed to delete room.");
        }
    };

    const handleDeleteAccount = async () => {
        const email = prompt("To confirm deletion, please type your email:");
        if (email !== profile?.email) return alert("Email does not match.");
        
        try {
            await userService.deleteAccount();
            onLogout(); // Log user out immediately
        } catch (e) {
            alert("Failed to delete account.");
        }
    };

    if (loading) return <div className="loading-spinner">Loading Profile...</div>;
    if (!profile) return <div>Error loading profile</div>;

    return (
        <div style={{ padding: '2rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '2rem'}}>
                <h2 style={{margin:0}}>My Profile</h2>
                <button className="tag-btn" onClick={onClose}>Close</button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3>👤 {profile.email}</h3>
            </div>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {/* Owned Rooms */}
                <div className="profile-section">
                    <h4>Owned Rooms</h4>
                    {profile.ownedRooms.length === 0 && <p style={{opacity:0.6}}>No rooms owned.</p>}
                    <ul style={{listStyle:'none', padding:0}}>
                        {profile.ownedRooms.map(r => (
                            <li key={r.id} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid var(--border-color)'}}>
                                <span>{r.name} <small>({r.code})</small></span>
                                <div>
                                    <button className="action-btn" onClick={() => { onNavigateToRoom(r.id); onClose(); }} title="Go to room">➡️</button>
                                    <button className="action-btn delete-btn" onClick={() => handleDeleteRoom(r.id)} title="Delete Room">×</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Assigned Tasks */}
                <div className="profile-section">
                    <h4>My Assigned Tasks</h4>
                    {profile.assignedTasks.length === 0 && <p style={{opacity:0.6}}>No tasks assigned.</p>}
                    <ul style={{listStyle:'none', padding:0}}>
                        {profile.assignedTasks.map(t => (
                            <li key={t.id} style={{padding:'10px', borderBottom:'1px solid var(--border-color)', opacity: t.completed ? 0.5 : 1}}>
                                <div style={{fontWeight:500}}>{t.content}</div>
                                <div style={{fontSize:'0.85rem', opacity:0.8}}>
                                    in <strong>{t.roomName}</strong> • {t.completed ? "Done" : "Pending"}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div style={{marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem'}}>
                <h4 style={{color: 'var(--primary-color)'}}>Danger Zone</h4>
                <button 
                    onClick={handleDeleteAccount}
                    style={{
                        background: '#ff6961', color: 'white', border:'none', 
                        padding: '10px 20px', borderRadius: '8px', fontWeight:'bold'
                    }}
                >
                    Delete My Account
                </button>
            </div>
        </div>
    );
};

export default UserProfileView;