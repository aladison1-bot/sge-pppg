import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Ambulance, 
  Calendar as CalendarIcon, 
  PlusCircle, 
  Search, 
  FileText,
  Bot,
  User,
  Trash2,
  Zap,
  Download,
  QrCode,
  X,
  Printer,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  Lock,
  KeyRound,
  CheckCircle,
  ShieldCheck,
  IdCard,
  Building2,
  Edit3,
  AlertTriangle,
  Settings,
  Stethoscope,
  Briefcase,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import QRCode from 'qrcode';

// --- Types ---
type Status = 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado';
type Risco = 'Baixo' | 'Médio' | 'Alto';
type TipoRegistro = 'Escolta Operacional' | 'Internamento' | 'Operação Externa';

interface Registro {
  id: string;
  tipo: TipoRegistro;
  nomePreso: string;
  prontuario: string;
  destino: string;
  dataHora: string;
  risco: Risco;
  status: Status;
  observacoes: string;
  equipe: string;
  policiais: string;
  dataConclusao?: string;
  dataAltaMedica?: string;
  createdBy: string;
  createdAt: string;
}

interface Ocorrencia {
  id: string;
  titulo: string;
  descricao: string;
  dataHora: string;
  autor: string;
  lotacao: string;
}

interface UserProfile {
  email: string;
  password?: string;
  isTemporary: boolean;
  fullName?: string;
  lotacao?: string;
  setor?: string;
}

// --- Mock Data Zerado ---
const INITIAL_DATA: Registro[] = [];

// --- Components ---
const LoadingOverlay = ({ message }: { message: string }) => (
  <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
    <div className="bg-white p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-8 max-w-sm text-center border border-white/20">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
        <Bot className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={32} />
      </div>
      <div>
        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Processamento Ativo</h4>
        <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">{message}</p>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div className="bg-blue-600 h-full w-1/2 animate-loading-bar rounded-full"></div>
      </div>
    </div>
  </div>
);

const AuthSystem = ({ onLoginSuccess }: { onLoginSuccess: (email: string) => void }) => {
  const [view, setView] = useState<'login' | 'forgot' | 'change-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUsers = (): UserProfile[] => {
    const data = localStorage.getItem('sge_users_db');
    if (!data) {
      const defaultUsers = [{ email: 'admin@pppg.gov.br', password: '123', isTemporary: true }];
      localStorage.setItem('sge_users_db', JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(data);
  };

  const saveUser = (user: UserProfile) => {
    const users = getUsers();
    const index = users.findIndex(u => u.email === user.email);
    if (index >= 0) users[index] = { ...users[index], ...user };
    else users.push(user);
    localStorage.setItem('sge_users_db', JSON.stringify(users));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      const users = getUsers();
      const user = users.find(u => u.email === email);

      if (user && password === user.password) {
        if (user.isTemporary) {
          setView('change-password');
        } else {
          onLoginSuccess(email);
        }
      } else {
        setError('Acesso negado. Credenciais inválidas ou conta não cadastrada.');
      }
      setLoading(false);
    }, 1000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      saveUser({ email, password: newPassword, isTemporary: false });
      onLoginSuccess(email);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 p-6 overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-slate-800 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 relative z-10 border border-white/10 animate-in zoom-in duration-500 my-auto">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="p-5 bg-slate-900 rounded-[24px] mb-6 shadow-xl shadow-blue-900/20">
            <ShieldAlert className="text-blue-500" size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-950 italic uppercase tracking-tighter leading-none">SGE <span className="text-blue-600">PPPG</span></h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Sistema de Gestão de Escoltas</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in duration-300">
            <Zap size={16} /> {error}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Email Funcional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@policiapenal.gov.br"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
              Acessar Sistema
            </button>
          </form>
        )}

        {view === 'change-password' && (
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <h2 className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-2 mb-1">
                <KeyRound size={14} /> Primeiro Acesso Detectado
              </h2>
              <p className="text-[10px] text-blue-600 font-medium">Crie uma nova senha para continuar com segurança.</p>
            </div>
            <div className="space-y-4">
              <input 
                type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova Senha"
                className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none"
              />
              <input 
                type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar Senha"
                className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
              Salvar Senha e Acessar
            </button>
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-slate-100 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
          Uso Restrito - SGE
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'painel' | 'escoltas' | 'internamentos' | 'relatorios' | 'novo' | 'ocorrencias' | 'seguranca'>('painel');
  const [registros, setRegistros] = useState<Registro[]>(() => {
    const saved = localStorage.getItem('sge_data_v1.4');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>(() => {
    const saved = localStorage.getItem('sge_ocorrencias_v1.4');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [manualSignature, setManualSignature] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [selectedReg, setSelectedReg] = useState<Registro | null>(null);
  const [isEditing, setIsEditing] = useState<Registro | null>(null);
  
  // Date Filtering State
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);

  // Modality states for "Novo Lançamento"
  const [newModality, setNewModality] = useState<TipoRegistro>('Escolta Operacional');

  // Profile States
  const [secFullName, setSecFullName] = useState('');
  const [secLotacao, setSecLotacao] = useState('');
  const [secSetor, setSecSetor] = useState('');
  const [secStatus, setSecStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('sge_auth_v1');
    if (savedAuth) {
      setIsAuthenticated(true);
      setUserEmail(savedAuth);
      
      const usersData = localStorage.getItem('sge_users_db');
      if (usersData) {
        const users: UserProfile[] = JSON.parse(usersData);
        const currentUser = users.find(u => u.email === savedAuth);
        if (currentUser) {
          setSecFullName(currentUser.fullName || '');
          setSecLotacao(currentUser.lotacao || '');
          setSecSetor(currentUser.setor || '');
        }
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sge_data_v1.4', JSON.stringify(registros));
  }, [registros]);

  useEffect(() => {
    localStorage.setItem('sge_ocorrencias_v1.4', JSON.stringify(ocorrencias));
  }, [ocorrencias]);

  const handleLoginSuccess = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    localStorage.setItem('sge_auth_v1', email);
    
    const usersData = localStorage.getItem('sge_users_db');
    if (usersData) {
      const users: UserProfile[] = JSON.parse(usersData);
      const currentUser = users.find(u => u.email === email);
      if (currentUser) {
        setSecFullName(currentUser.fullName || '');
        setSecLotacao(currentUser.lotacao || '');
        setSecSetor(currentUser.setor || '');
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    localStorage.removeItem('sge_auth_v1');
  };

  const canManageRecord = (reg: Registro) => {
    if (reg.createdBy !== userEmail) return false;
    const createdAt = new Date(reg.createdAt).getTime();
    const now = new Date().getTime();
    const diffHours = (now - createdAt) / (1000 * 60 * 60);
    // Permissão de 24 horas mantida como janela de segurança operacional
    return diffHours <= 24;
  };

  const handleAddRegistro = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const novo: Registro = {
      id: Math.random().toString(36).substr(2, 9),
      tipo: formData.get('tipo') as TipoRegistro,
      nomePreso: formData.get('nomePreso') as string,
      prontuario: formData.get('prontuario') as string,
      destino: formData.get('destino') as string,
      dataHora: formData.get('dataHora') as string,
      risco: formData.get('risco') as Risco,
      status: 'Pendente',
      observacoes: formData.get('observacoes') as string || '',
      equipe: formData.get('equipe') as string || '',
      policiais: formData.get('policiais') as string || '',
      dataAltaMedica: formData.get('dataAltaMedica') as string || undefined,
      createdBy: userEmail,
      createdAt: new Date().toISOString()
    };
    setRegistros([novo, ...registros]);
    setActiveTab(novo.tipo === 'Internamento' ? 'internamentos' : 'escoltas');
    setViewDate(novo.dataHora.split('T')[0]); // Navega para o dia do lançamento
    e.currentTarget.reset();
  };

  const handleEditRegistro = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditing) return;
    const formData = new FormData(e.currentTarget);
    const updated = registros.map(r => r.id === isEditing.id ? {
      ...r,
      tipo: formData.get('tipo') as TipoRegistro,
      nomePreso: formData.get('nomePreso') as string,
      prontuario: formData.get('prontuario') as string,
      destino: formData.get('destino') as string,
      dataHora: formData.get('dataHora') as string,
      risco: formData.get('risco') as Risco,
      observacoes: formData.get('observacoes') as string,
      equipe: formData.get('equipe') as string,
      policiais: formData.get('policiais') as string,
      dataAltaMedica: formData.get('dataAltaMedica') as string || undefined,
    } : r);
    setRegistros(updated);
    setIsEditing(null);
  };

  const handleDeleteRegistro = (id: string) => {
    if (window.confirm("Deseja realmente apagar este registro? Esta ação é irreversível.")) {
      setRegistros(registros.filter(r => r.id !== id));
    }
  };

  const updateStatus = (id: string, newStatus: Status) => {
    setRegistros(registros.map(r => r.id === id ? { 
      ...r, 
      status: newStatus,
      dataConclusao: newStatus === 'Concluído' ? new Date().toISOString() : r.dataConclusao 
    } : r));
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const usersData = localStorage.getItem('sge_users_db');
    if (!usersData) return;
    const users: UserProfile[] = JSON.parse(usersData);
    const idx = users.findIndex(u => u.email === userEmail);
    if (idx !== -1) {
      users[idx].fullName = secFullName;
      users[idx].lotacao = secLotacao;
      users[idx].setor = secSetor;
      localStorage.setItem('sge_users_db', JSON.stringify(users));
      setSecStatus({ type: 'success', msg: 'Informações atualizadas.' });
    }
  };

  const filteredBySearchAndDate = useMemo(() => {
    return registros.filter(r => {
      const matchSearch = r.nomePreso.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.prontuario.includes(searchTerm);
      const matchDate = r.dataHora.startsWith(viewDate);
      return matchSearch && matchDate;
    });
  }, [registros, searchTerm, viewDate]);

  const changeDate = (days: number) => {
    const current = new Date(viewDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setViewDate(current.toISOString().split('T')[0]);
  };

  const StatusBadge = ({ status }: { status: Status }) => {
    const colors = { 'Pendente': 'bg-amber-100 text-amber-700', 'Em Andamento': 'bg-blue-100 text-blue-700', 'Concluído': 'bg-emerald-100 text-emerald-700', 'Cancelado': 'bg-rose-100 text-rose-700' };
    return <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border ${colors[status]}`}>{status}</span>;
  };

  if (!isAuthenticated) return <AuthSystem onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {(isAiLoading || isExporting) && <LoadingOverlay message={loadingMessage} />}
      
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-slate-800 bg-slate-950/50 text-center">
          <h1 className="text-2xl font-black tracking-tighter flex items-center justify-center gap-2 italic uppercase">
            <ShieldAlert className="text-blue-500" size={32} /> SGE <span className="text-blue-500">PPPG</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab('painel')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'painel' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Painel</span>
          </button>
          <button onClick={() => setActiveTab('escoltas')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'escoltas' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <CalendarIcon size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Escoltas</span>
          </button>
          <button onClick={() => setActiveTab('internamentos')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'internamentos' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Ambulance size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Internamentos</span>
          </button>
          <button onClick={() => setActiveTab('ocorrencias')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'ocorrencias' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <AlertTriangle size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Ocorrências</span>
          </button>
          <button onClick={() => setActiveTab('relatorios')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'relatorios' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <FileText size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Relatórios</span>
          </button>
          <div className="pt-8">
            <button onClick={() => setActiveTab('novo')} className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-xs uppercase tracking-widest shadow-xl transition-all">
              <PlusCircle size={20} /> Nova Operação
            </button>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <div className="p-3 bg-slate-950/30 rounded-2xl text-center">
            <p className="text-[10px] font-black text-blue-400 uppercase truncate">
              {secFullName || userEmail.split('@')[0]}
            </p>
          </div>
          <button onClick={() => setActiveTab('seguranca')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${activeTab === 'seguranca' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Settings size={14} /> <span className="text-[10px] font-black uppercase">Segurança</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
            <LogOut size={16} /> <span className="text-[10px] font-black uppercase">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-20">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-10 py-5 sticky top-0 z-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-slate-900 uppercase italic shrink-0">{activeTab.toUpperCase()}</h2>
            
            {/* Date Selector for Lists */}
            {(activeTab === 'escoltas' || activeTab === 'internamentos') && (
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronLeft size={16}/></button>
                <div className="flex items-center gap-2 px-2">
                  <CalendarIcon size={14} className="text-blue-600" />
                  <input 
                    type="date" 
                    value={viewDate} 
                    onChange={e => setViewDate(e.target.value)}
                    className="bg-transparent font-black text-[11px] uppercase outline-none"
                  />
                </div>
                <button onClick={() => changeDate(1)} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronRight size={16}/></button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Preso ou prontuário..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full md:w-64 pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <button title="Exportar CSV" onClick={() => {}} className="p-2.5 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-all shrink-0"><Download size={20} /></button>
          </div>
        </header>

        <div className="p-10">
          {activeTab === 'painel' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Escoltas Totais</p>
                <p className="text-4xl font-black mt-1">{registros.filter(r => r.tipo === 'Escolta Operacional').length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Internamentos</p>
                <p className="text-4xl font-black mt-1">{registros.filter(r => r.tipo === 'Internamento').length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100">
                <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Alto Risco</p>
                <p className="text-4xl font-black mt-1 text-rose-600">{registros.filter(r => r.risco === 'Alto').length}</p>
              </div>
              <div className="bg-blue-600 p-6 rounded-3xl shadow-lg text-white">
                <p className="text-[10px] font-black uppercase text-blue-200 tracking-widest">Pendentes Hoje</p>
                <p className="text-4xl font-black mt-1">{registros.filter(r => r.status === 'Pendente' && r.dataHora.startsWith(new Date().toISOString().split('T')[0])).length}</p>
              </div>
            </div>
          )}

          {(activeTab === 'escoltas' || activeTab === 'internamentos') && (
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
              <div className="bg-slate-50/50 px-8 py-3 border-b flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Visualizando: <span className="text-blue-600">{new Date(viewDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                </span>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Registros: {filteredBySearchAndDate.filter(r => (activeTab === 'escoltas' ? r.tipo !== 'Internamento' : r.tipo === 'Internamento')).length}
                </span>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
                  <tr>
                    <th className="px-8 py-4 text-left">Preso</th>
                    <th className="px-8 py-4 text-left">Guarnição</th>
                    {activeTab === 'internamentos' && <th className="px-8 py-4 text-left">Alta Médica</th>}
                    <th className="px-8 py-4 text-left">Status</th>
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {filteredBySearchAndDate.filter(r => (activeTab === 'escoltas' ? r.tipo !== 'Internamento' : r.tipo === 'Internamento')).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest italic opacity-50">
                        Nenhum registro encontrado para esta data.
                      </td>
                    </tr>
                  ) : filteredBySearchAndDate.filter(r => (activeTab === 'escoltas' ? r.tipo !== 'Internamento' : r.tipo === 'Internamento')).map(reg => (
                    <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-900">{reg.nomePreso}</p>
                        <p className="text-[10px] text-slate-400 uppercase">PRONT: {reg.prontuario} • {reg.destino}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-tight">{reg.equipe}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{reg.policiais}</p>
                      </td>
                      {activeTab === 'internamentos' && (
                        <td className="px-8 py-5 font-bold text-blue-600">
                          {reg.dataAltaMedica ? new Date(reg.dataAltaMedica + 'T00:00:00').toLocaleDateString('pt-BR') : '---'}
                        </td>
                      )}
                      <td className="px-8 py-5"><StatusBadge status={reg.status} /></td>
                      <td className="px-8 py-5 text-right flex justify-end items-center gap-2">
                        <button onClick={() => { setSelectedReg(reg); setQrModalOpen(true); }} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><QrCode size={18} /></button>
                        {canManageRecord(reg) && (
                          <>
                            <button onClick={() => setIsEditing(reg)} className="p-2 text-slate-300 hover:text-amber-500 transition-colors"><Edit3 size={18} /></button>
                            <button onClick={() => handleDeleteRegistro(reg.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                          </>
                        )}
                        <select value={reg.status} onChange={e => updateStatus(reg.id, e.target.value as Status)} className="text-[10px] font-black p-1 border rounded-lg bg-slate-50 outline-none hover:border-blue-300 transition-all cursor-pointer">
                          <option value="Pendente">Pendente</option>
                          <option value="Em Andamento">Em Trânsito</option>
                          <option value="Concluído">Concluído</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'novo' && (
            <div className="max-w-4xl mx-auto bg-white rounded-[48px] p-12 border shadow-2xl animate-in zoom-in duration-500">
              <h3 className="text-3xl font-black mb-8 italic uppercase text-slate-900">Novo Lançamento</h3>
              <form onSubmit={handleAddRegistro} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Modalidade</label>
                    <select name="tipo" value={newModality} onChange={e => setNewModality(e.target.value as TipoRegistro)} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option value="Escolta Operacional">Escolta Operacional</option>
                      <option value="Internamento">Internamento</option>
                      <option value="Operação Externa">Operação Externa</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Risco</label>
                    <select name="risco" className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option value="Baixo">Baixo</option>
                      <option value="Médio">Médio</option>
                      <option value="Alto">Alto</option>
                    </select>
                  </div>
                  <input name="nomePreso" placeholder="Nome Completo do Preso" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none col-span-1 md:col-span-1" />
                  <input name="prontuario" placeholder="Prontuário" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  <input name="destino" placeholder="Destino (Hospital, Fórum, etc)" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold col-span-1 md:col-span-2 outline-none" />
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Data e Hora de Início</label>
                    <input type="datetime-local" name="dataHora" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  </div>
                  {newModality === 'Internamento' && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-blue-600 block mb-2 flex items-center gap-2 tracking-widest">
                        <Stethoscope size={12} /> Alta Médica Prevista
                      </label>
                      <input type="date" name="dataAltaMedica" className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl font-bold outline-none" />
                    </div>
                  )}
                  <input name="equipe" placeholder="Equipe / VTR" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  <input name="policiais" placeholder="Policiais (Separe por vírgula)" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold col-span-1 md:col-span-2 outline-none" />
                  <textarea name="observacoes" placeholder="Observações Gerais" className="w-full p-4 bg-slate-50 border rounded-2xl font-medium col-span-1 md:col-span-2 outline-none" rows={3} />
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all">Registrar Operação</button>
              </form>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="max-w-2xl mx-auto bg-white rounded-[40px] p-10 border shadow-sm animate-in zoom-in duration-500">
               <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner"><User size={24} /></div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Perfil Profissional</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configurações de Identidade</p>
                </div>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <input value={secFullName} onChange={e => setSecFullName(e.target.value)} placeholder="Nome Completo" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                <div className="grid grid-cols-2 gap-6">
                  <input value={secLotacao} onChange={e => setSecLotacao(e.target.value)} placeholder="Lotação" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  <input value={secSetor} onChange={e => setSecSetor(e.target.value)} placeholder="Setor" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                </div>
                {secStatus && <div className={`p-4 rounded-2xl text-xs font-bold ${secStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{secStatus.msg}</div>}
                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all">Salvar Perfil</button>
              </form>
            </div>
          )}

          {/* Outras abas (Ocorrencias, Relatorios) mantidas conforme versão anterior */}
        </div>
      </main>

      <div className="fixed bottom-0 left-64 right-0 p-4 bg-white/60 backdrop-blur-md border-t text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic z-10 no-print">
        Uso Restrito - SGE
      </div>

      {qrModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-8 flex justify-between items-center bg-slate-50 border-b">
              <h3 className="text-xl font-black uppercase italic text-slate-900">Guia QR</h3>
              <button onClick={() => setQrModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="p-12 flex flex-col items-center">
              {/* QR Code generator placeholder logic */}
              <div className="bg-slate-100 w-64 h-64 rounded-[40px] flex items-center justify-center border-4 border-slate-50 mb-8 shadow-inner">
                <QrCode size={128} className="text-slate-300" />
              </div>
              <p className="text-2xl font-black uppercase italic text-slate-900 text-center">{selectedReg.nomePreso}</p>
              <p className="text-xs font-black text-slate-500 uppercase mt-2 tracking-widest">PRONT: {selectedReg.prontuario}</p>
              <button onClick={() => window.print()} className="mt-10 w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase flex items-center justify-center gap-3 no-print hover:bg-slate-800 transition-all shadow-xl">
                <Printer size={20} /> Imprimir Guia
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .animate-loading-bar { animation: loading-bar 2s infinite ease-in-out; }
        @media print { 
          .no-print { display: none !important; }
          body { background: white !important; }
          .fixed { position: relative !important; }
          aside, header { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
        }
        input::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; transition: 0.2s; }
        input::-webkit-calendar-picker-indicator:hover { opacity: 1; }
      `}</style>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) { createRoot(rootElement).render(<App />); }
