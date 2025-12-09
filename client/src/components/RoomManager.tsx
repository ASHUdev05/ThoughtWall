import React, { useState, useEffect } from 'react';
import { roomService, type Room } from '../services/thoughtService';

interface Props {
    activeRoomId?: number;
    onRoomSelect: (roomId?: number) => void;
}

const RoomManager: React.FC<Props> = ({ activeRoomId, onRoomSelect }) => {
    // 1. Initialize with empty array to prevent .map() crashes
    const [rooms, setRooms] = useState<Room[]>([]); 
    const [inputCode, setInputCode] = useState("");
    const [newRoomName, setNewRoomName] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        try {
            const data = await roomService.getMyRooms();
            // 2. Validate data is actually an array before setting state
            if (Array.isArray(data)) {
                setRooms(data);
            } else {
                console.error("Expected array of rooms, got:", data);
                setRooms([]);
            }
        } catch (e) { 
            console.error("Failed to load rooms:", e);
            setRooms([]); // Fallback to empty array on error
        }
    };

    const handleCreate = async () => {
        if(!newRoomName.trim()) return;
        try {
            await roomService.create(newRoomName);
            setNewRoomName("");
            setShowCreate(false);
            loadRooms();
        } catch (e) {
            alert("Failed to create room.");
        }
    };

    const handleJoin = async () => {
        if(!inputCode.trim()) return;
        try {
            await roomService.join(inputCode);
            setInputCode("");
            loadRooms();
        } catch (e) { 
            alert("Invalid Room Code or already joined."); 
        }
    };

    return (
        <div style={{ padding: '1rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <h3 style={{marginTop:0, fontSize: '1.1rem', color: 'var(--text-color)'}}>Collaborative Rooms</h3>
            
            <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap'}}>
                <button 
                    className={`filter-chip ${!activeRoomId ? 'active' : ''}`}
                    onClick={() => onRoomSelect(undefined)}
                >
                    👤 Personal Board
                </button>
                
                {/* 3. Safe mapping with optional chaining just in case */}
                {rooms?.map(room => (
                    <button
                        key={room.id}
                        className={`filter-chip ${activeRoomId === room.id ? 'active' : ''}`}
                        onClick={() => onRoomSelect(room.id)}
                        title={`Code: ${room.code}`}
                    >
                        👥 {room.name}
                    </button>
                ))}
            </div>

            <div style={{display:'flex', gap: '1rem', alignItems:'center', flexWrap: 'wrap'}}>
                {showCreate ? (
                    <div style={{display:'flex', gap:'0.5rem'}}>
                        <input 
                            className="thought-input" 
                            style={{padding: '5px 10px'}} 
                            placeholder="Room Name" 
                            value={newRoomName} 
                            onChange={e => setNewRoomName(e.target.value)} 
                        />
                        <button className="tag-btn active" onClick={handleCreate}>Save</button>
                        <button className="tag-btn" onClick={() => setShowCreate(false)}>Cancel</button>
                    </div>
                ) : (
                    <button className="tag-btn" onClick={() => setShowCreate(true)}>+ New Room</button>
                )}
                
                <div style={{height: '20px', width: '1px', background: 'var(--border-color)'}}></div>

                <div style={{display:'flex', gap:'0.5rem'}}>
                    <input 
                        className="thought-input" 
                        style={{padding: '5px 10px', width: '120px'}} 
                        placeholder="Enter Code" 
                        value={inputCode} 
                        onChange={e => setInputCode(e.target.value)} 
                    />
                    <button className="tag-btn" onClick={handleJoin}>Join</button>
                </div>
            </div>
            
            {activeRoomId && (
                <small style={{display:'block', marginTop:'10px', color:'var(--text-color)', opacity:0.7}}>
                    Share code <strong>{rooms.find(r => r.id === activeRoomId)?.code}</strong> to invite others.
                </small>
            )}
        </div>
    );
};
export default RoomManager;