import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';

// --- THE DASHBOARD COMPONENT ---
const Dashboard = ({ onLogout }) => {
  const [stats, setStats] = useState({ total_tasks: 0, completed: 0, pending: 0 });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [s, p, t, u] = await Promise.all([
        api.get('/dashboard/'), api.get('/projects/'), api.get('/tasks/'), api.get('/users/')
      ]);
      setStats(s.data); setProjects(p.data); setTasks(t.data); setTeam(u.data);
    } catch (err) { 
      console.error("Fetch Error:", err);
      if (err.response?.status === 401) onLogout(); // Redirect to login if token is invalid
    }
  };

  const handleCreateProject = async () => {
    if (!projectName) return;
    try {
      await api.post('/projects/', { name: projectName, description: '' });
      setProjectName('');
      await fetchData(); // Refresh list to update dropdown
      alert("Project Created!");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create project");
    }
  };

  const handleAssignTask = async () => {
    if (!taskTitle || !selectedProject || !selectedUser) {
      alert("Please fill all fields");
      return;
    }
    try {
      await api.post('/tasks/', {
        title: taskTitle,
        project_id: parseInt(selectedProject),
        assignee_id: parseInt(selectedUser)
      });
      setTaskTitle('');
      fetchData();
    } catch (err) {
      alert("Failed to assign task");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    await api.patch(`/tasks/${taskId}/status?status=${newStatus}`);
    fetchData();
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-6 shadow-xl flex flex-col">
        <h2 className="text-xl font-bold mb-10 text-blue-400 text-center uppercase tracking-widest">Task Nexus</h2>
        <nav className="flex-1 space-y-4">
          <div className="text-gray-400 uppercase text-xs font-semibold px-2">Main Menu</div>
          <button className="w-full text-left p-3 bg-slate-800 rounded-lg text-blue-400 font-medium">Dashboard</button>
        </nav>
        <button onClick={onLogout} className="w-full text-left p-3 text-red-400 hover:bg-slate-800 rounded-lg transition-colors font-medium">
          Sign Out
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800">Project Overview</h1>
          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 px-8 text-center min-w-[140px]">
              <span className="block text-2xl font-bold text-blue-600">{stats.total_tasks}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Total Tasks</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 px-8 text-center min-w-[140px]">
              <span className="block text-2xl font-bold text-green-600">{stats.completed}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Completed</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4 text-slate-700">New Project</h3>
              <input value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full border-gray-200 border p-3 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Project Name..." />
              <button onClick={handleCreateProject} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Create Project</button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4 text-slate-700">Assign Task</h3>
              <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="w-full border-gray-200 border p-3 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-green-500" placeholder="Task description..." />
              <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full border-gray-200 border p-3 rounded-lg mb-3 outline-none">
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full border-gray-200 border p-3 rounded-lg mb-4 outline-none">
                <option value="">Assign To...</option>
                {team.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
              <button onClick={handleAssignTask} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 shadow-lg shadow-green-200 transition-all">Assign Task</button>
            </div>

            {team.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-slate-700">Team Insights</h3>
                <div className="space-y-3">
                  {team.map(member => (
                    <div key={member.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg transition">
                      <span className="text-sm font-medium text-slate-600">{member.username}</span>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase font-bold">{member.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 text-lg font-bold text-slate-700">Team Progress</div>
              <div className="divide-y divide-gray-100">
                {tasks.length === 0 ? <p className="p-10 text-center text-gray-400 italic">No tasks active.</p> : tasks.map(t => (
                  <div key={t.id} className="p-6 flex flex-col hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="block font-bold text-slate-800 text-lg">{t.title}</span>
                        <span className="text-sm text-gray-500 bg-slate-100 px-2 py-0.5 rounded">Project #{t.project_id}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleStatusChange(t.id, 'todo')} className={`px-4 py-1.5 text-xs font-bold rounded-full border ${t.status === 'todo' ? 'bg-slate-200 border-slate-400 text-slate-700' : 'text-slate-400 border-slate-200'}`}>Todo</button>
                        <button onClick={() => handleStatusChange(t.id, 'in_progress')} className={`px-4 py-1.5 text-xs font-bold rounded-full border ${t.status === 'in progress' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'text-slate-400 border-slate-200'}`}>Active</button>
                        <button onClick={() => handleStatusChange(t.id, 'done')} className={`px-4 py-1.5 text-xs font-bold rounded-full border ${t.status === 'done' ? 'bg-green-100 border-green-400 text-green-700' : 'text-slate-400 border-slate-200'}`}>Done</button>
                      </div>
                    </div>
                    <div className="mt-2 pt-4 border-t border-slate-100">
                      <input 
                        type="text" 
                        placeholder="Add a comment... (Enter to save)" 
                        className="w-full text-sm border-none bg-slate-100 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && e.target.value) {
                            try {
                              await api.post(`/tasks/${t.id}/comments`, { content: e.target.value });
                              e.target.value = '';
                              alert("Comment saved!");
                            } catch (err) { alert("Failed to save comment"); }
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- THE MAIN APP COMPONENT ---
function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    const cleanUsername = username.trim();
    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', cleanUsername);
        formData.append('password', password);
        const response = await api.post('/login/', formData);
        const newToken = response.data.access_token;
        setToken(newToken);
        localStorage.setItem('token', newToken);
      } else {
        await api.post('/signup/', { username: cleanUsername, password, role: 'member' });
        alert('Signup successful! Please log in.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
          <h2 className="text-3xl font-extrabold mb-8 text-center text-slate-800">{isLogin ? 'Welcome Back' : 'Get Started'}</h2>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100">{error}</div>}
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border-slate-200 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-slate-200 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
            <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 shadow-lg">{isLogin ? 'Login' : 'Create Account'}</button>
          </form>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-blue-600 text-sm font-semibold hover:underline">
            {isLogin ? "New here? Create an account" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;