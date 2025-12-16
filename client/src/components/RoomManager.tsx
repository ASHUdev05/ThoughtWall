import React, { useState, useEffect } from "react";
import { roomService, type Room, type RoomRequest, type User } from "../services/thoughtService";
import { userService } from "../services/userService";

interface Props {
  activeRoomId?: number;
  onRoomSelect: (roomId?: number) => void;
}

const RoomManager: React.FC<Props> = ({ activeRoomId, onRoomSelect }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [inputCode, setInputCode] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Moderation State
  const [showModModal, setShowModModal] = useState(false);
  const [activeRoomData, setActiveRoomData] = useState<Room | null>(null);
  const [requests, setRequests] = useState<RoomRequest[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const currentUser = userService.getUser();

  const loadRooms = async () => {
    try {
      const data = await roomService.getMyRooms();
      if (Array.isArray(data)) setRooms(data);
      else setRooms([]);
    } catch (e) {
      console.error(e);
      setRooms([]);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleCreate = async () => {
    if (!newRoomName.trim()) return;
    try {
      await roomService.create(newRoomName);
      setNewRoomName("");
      setShowCreate(false);
      loadRooms();
    } catch {
      alert("Failed to create room.");
    }
  };

  const handleJoin = async () => {
    if (!inputCode.trim()) return;
    try {
      const res = await roomService.join(inputCode);
      alert(res.message); // "Request sent"
      setInputCode("");
      loadRooms(); // In case immediate join logic changes later
    } catch (e: any) {
      alert(e.message || "Failed to join room.");
    }
  };

  const openModeration = async (room: Room) => {
    setActiveRoomData(room);
    setLoading(true);
    setShowModModal(true);
    try {
        const reqs = await roomService.getRequests(room.id);
        const mems = await roomService.getMembers(room.id);
        setRequests(reqs);
        setMembers(mems);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleApprove = async (reqId: number) => {
    if(!activeRoomData) return;
    await roomService.approveRequest(activeRoomData.id, reqId);
    openModeration(activeRoomData); // Refresh
  };

  const handleKick = async (userId: number) => {
    if(!activeRoomData || !confirm("Kick this user?")) return;
    await roomService.kickUser(activeRoomData.id, userId);
    openModeration(activeRoomData); // Refresh
  };

  return (
    <div
      style={{
        padding: "1rem",
        background: "var(--card-bg)",
        borderRadius: "12px",
        border: "1px solid var(--border-color)",
        marginBottom: "1.5rem",
      }}
    >
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h3 style={{ marginTop: 0, fontSize: "1.1rem", color: "var(--text-color)" }}>
            Collaborative Rooms
        </h3>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button
          className={`filter-chip ${!activeRoomId ? "active" : ""}`}
          onClick={() => onRoomSelect(undefined)}
        >
          👤 Personal
        </button>

        {rooms?.map((room) => (
          <div key={room.id} style={{position:'relative', display:'inline-block'}}>
            <button
                className={`filter-chip ${activeRoomId === room.id ? "active" : ""}`}
                onClick={() => onRoomSelect(room.id)}
                title={`Code: ${room.code}`}
                style={{paddingRight: room.owner?.email === currentUser?.sub ? '30px' : '12px'}}
            >
                👥 {room.name}
            </button>
            {room.owner?.email === currentUser?.sub && (
                <span 
                    onClick={(e) => { e.stopPropagation(); openModeration(room); }}
                    style={{
                        position:'absolute', right:'5px', top:'50%', transform:'translateY(-50%)', 
                        cursor:'pointer', fontSize:'0.8rem', opacity: 0.7
                    }}
                    title="Manage Room"
                >
                    ⚙️
                </span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        {showCreate ? (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              className="thought-input"
              style={{ padding: "5px 10px" }}
              placeholder="Room Name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />
            <button className="tag-btn active" onClick={handleCreate}>Save</button>
            <button className="tag-btn" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        ) : (
          <button className="tag-btn" onClick={() => setShowCreate(true)}>+ New Room</button>
        )}

        <div style={{ height: "20px", width: "1px", background: "var(--border-color)" }}></div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            className="thought-input"
            style={{ padding: "5px 10px", width: "120px" }}
            placeholder="Enter Code"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
          />
          <button className="tag-btn" onClick={handleJoin}>Join</button>
        </div>
      </div>

      {activeRoomId && (
        <small style={{ display: "block", marginTop: "10px", color: "var(--text-color)", opacity: 0.7 }}>
          Share code <strong>{rooms.find((r) => r.id === activeRoomId)?.code}</strong> to invite others.
        </small>
      )}

      {/* Moderation Modal */}
      {showModModal && activeRoomData && (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxHeight:'80vh', overflowY:'auto'}}>
                <h3>Manage: {activeRoomData.name}</h3>
                <p>Code: <strong>{activeRoomData.code}</strong></p>
                
                {loading ? <p>Loading...</p> : (
                    <>
                        <h4>Pending Requests ({requests.length})</h4>
                        {requests.length === 0 && <small>No pending requests.</small>}
                        <ul style={{listStyle:'none', padding:0}}>
                            {requests.map(req => (
                                <li key={req.id} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border-color)'}}>
                                    <span>{req.user.email}</span>
                                    <div>
                                        <button className="tag-btn active" style={{marginRight:'5px', padding:'2px 8px'}} onClick={() => handleApprove(req.id)}>Accept</button>
                                        <button className="tag-btn" style={{padding:'2px 8px'}} onClick={() => roomService.rejectRequest(activeRoomData.id, req.id).then(() => openModeration(activeRoomData))}>Reject</button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <h4 style={{marginTop:'1.5rem'}}>Members ({members.length})</h4>
                        <ul style={{listStyle:'none', padding:0}}>
                            {members.map(mem => (
                                <li key={mem.id} style={{display:'flex', justifyContent:'space-between', padding:'8px 0'}}>
                                    <span>{mem.email} {mem.id === activeRoomData.owner?.id ? '(Owner)' : ''}</span>
                                    {mem.id !== activeRoomData.owner?.id && (
                                        <button className="delete-btn" style={{fontSize:'1rem'}} onClick={() => handleKick(mem.id)}>Kick</button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </>
                )}
                
                <button className="tag-btn" style={{marginTop:'2rem', width:'100%'}} onClick={() => setShowModModal(false)}>Close</button>
            </div>
        </div>
      )}
    </div>
  );
};
export default RoomManager;