import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Ambulance, 
  Calendar, 
  PlusCircle, 
  Search, 
  FileText,
  Bot,
  User,
  MapPin,
  Trash2,
  Activity,
  Zap,
  Download,
  QrCode,
  X,
  Printer,
  Loader2,
  ExternalLink,
  LogIn,
  LogOut,
  Mail,
  Lock,
  ArrowLeft,
  KeyRound,
  CheckCircle,
  ShieldCheck,
  IdCard,
  Send,
  Building2,
  Edit3,
  AlertTriangle,
  Clock,
  MessageSquare,
  Users,
  Shield,
  Settings
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import QRCode from 'qrcode';

// --- Types ---
type Status = 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado';
type Risco = 'Baixo' | 'Médio' | 'Alto';
type TipoRegistro = 'Escolta Operacional' | 'Internamento' | 'Operação Externa';
type Periodo = 'Diário' | 'Mensal' | 'Anual';

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
}

// --- Mock Data ---
const INITIAL_DATA: Registro[] = [
  {
    id: '1',
    tipo: 'Escolta Operacional',
    nomePreso: 'João Silva Oliveira',
    prontuario: '12345-6',
    destino: 'Fórum Criminal - Barra Funda',
    dataHora: new Date().toISOString(),
    risco: 'Médio',
    status: 'Concluído',
    observacoes: 'Audiência de instrução realizada sem intercorrências.',
    dataConclusao: new Date().toISOString(),
    createdBy: 'admin@pppg.gov.br',
    createdAt: new Date().toISOString(),
    equipe: 'ALFA-01',
    policiais: 'SGT Silva, SD Oliveira'
  }
];

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
  const [view, setView] = useState<'login' | 'forgot' | 'change-password' | 'confirmation'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTempPass, setLastTempPass] = useState('');

  const getUsers = (): UserProfile[] => {
    const data = localStorage.getItem('sge_users_db');
    // Pre-populate with a default admin user if DB is empty
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
    if (index >= 0) users[index] = user;
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
        setError('Acesso negado. Credenciais inválidas ou conta não cadastrada pelo gestor.');
      }
      setLoading(false);
    }, 1000);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setError('Recuperação de senha desativada. Entre em contato com o Gestor da Unidade para resetar sua senha.');
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
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Senha</label>
                <button type="button" onClick={() => setView('forgot')} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">Esqueci minha senha</button>
              </div>
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

        {view === 'forgot' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recuperar Acesso</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">O acesso a este sistema é controlado pelo Gestor. Se você esqueceu sua senha ou não possui acesso, por favor, solicite formalmente à administração da Unidade.</p>
            <button onClick={() => setView('login')} className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Voltar ao Login</button>
          </div>
        )}

        {view === 'change-password' && (
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <h2 className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-2 mb-1">
                <KeyRound size={14} /> Primeiro Acesso Detectado
              </h2>
              <p className="text-[10px] text-blue-600 font-medium">Você está usando uma senha temporária. Por segurança, crie uma nova senha agora.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm"
                  />
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              Salvar Senha e Acessar
            </button>
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-slate-100 text-center text-slate-400 text-[9px] font-black uppercase tracking-widest">
          Uso Restrito - Polícia Penal - SGE PPPG v1.3.1
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
    const saved = localStorage.getItem('sge_data_v1.3');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>(() => {
    const saved = localStorage.getItem('sge_ocorrencias_v1.3');
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

  // Security Tab States
  const [secNewPassword, setSecNewPassword] = useState('');
  const [secConfirmPassword, setSecConfirmPassword] = useState('');
  const [secStatus, setSecStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('sge_auth_v1');
    if (savedAuth) {
      setIsAuthenticated(true);
      setUserEmail(savedAuth);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sge_data_v1.3', JSON.stringify(registros));
  }, [registros]);

  useEffect(() => {
    localStorage.setItem('sge_ocorrencias_v1.3', JSON.stringify(ocorrencias));
  }, [ocorrencias]);

  const handleLoginSuccess = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    localStorage.setItem('sge_auth_v1', email);
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
      createdBy: userEmail,
      createdAt: new Date().toISOString()
    };
    setRegistros([novo, ...registros]);
    setActiveTab(novo.tipo === 'Internamento' ? 'internamentos' : 'escoltas');
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

  const handleAddOcorrencia = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nova: Ocorrencia = {
      id: Math.random().toString(36).substr(2, 9),
      titulo: formData.get('titulo') as string,
      descricao: formData.get('descricao') as string,
      dataHora: new Date().toISOString(),
      autor: userEmail.split('@')[0].toUpperCase(),
      lotacao: 'GRI / PPPG'
    };
    setOcorrencias([nova, ...ocorrencias]);
    e.currentTarget.reset();
  };

  const handleUpdateSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (secNewPassword !== secConfirmPassword) {
      setSecStatus({ type: 'error', msg: 'Senhas não coincidem.' });
      return;
    }
    if (secNewPassword.length < 6) {
      setSecStatus({ type: 'error', msg: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    const usersData = localStorage.getItem('sge_users_db');
    if (usersData) {
      const users: UserProfile[] = JSON.parse(usersData);
      const idx = users.findIndex(u => u.email === userEmail);
      if (idx !== -1) {
        users[idx].password = secNewPassword;
        users[idx].isTemporary = false;
        localStorage.setItem('sge_users_db', JSON.stringify(users));
        setSecStatus({ type: 'success', msg: 'Senha alterada com sucesso.' });
        setSecNewPassword('');
        setSecConfirmPassword('');
      }
    }
  };

  const handleShowQr = async (reg: Registro) => {
    const text = `SGE PPPG - ${reg.tipo.toUpperCase()}\nPRESO: ${reg.nomePreso}\nPRONT: ${reg.prontuario}\nDESTINO: ${reg.destino}\nDATA: ${new Date(reg.dataHora).toLocaleString('pt-BR')}\nEQUIPE: ${reg.equipe}\nPOLICIAIS: ${reg.policiais}\nRISCO: ${reg.risco}`;
    try {
      const url = await QRCode.toDataURL(text, { width: 600, margin: 2 });
      setQrDataUrl(url);
      setSelectedReg(reg);
      setQrModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    setLoadingMessage('Exportando dados...');
    await new Promise(r => setTimeout(r, 1000));
    const headers = ['Tipo', 'Preso', 'Prontuario', 'Destino', 'Data', 'Risco', 'Status', 'Equipe', 'Policiais'];
    const rows = registros.map(r => [r.tipo, r.nomePreso, r.prontuario, r.destino, r.dataHora, r.risco, r.status, r.equipe, r.policiais]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SGE_Export.csv';
    a.click();
    setIsExporting(false);
  };

  const generateReport = async () => {
    if (!manualSignature) return alert("Assine o relatório.");
    setIsAiLoading(true);
    setLoadingMessage("IA gerando relatório oficial...");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const prompt = `Gere um relatório formal de Policiamento Penal das escoltas: ${JSON.stringify(registros)}. Assine como: ${manualSignature}`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiReport(response.text);
    } catch (e) {
      setAiReport("Erro na geração de relatório via IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredBySearch = useMemo(() => {
    return registros.filter(r => 
      r.nomePreso.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.prontuario.includes(searchTerm) ||
      r.destino.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [registros, searchTerm]);

  const StatusBadge = ({ status }: { status: Status }) => {
    const colors = { 'Pendente': 'bg-amber-100 text-amber-700', 'Em Andamento': 'bg-blue-100 text-blue-700', 'Concluído': 'bg-emerald-100 text-emerald-700', 'Cancelado': 'bg-rose-100 text-rose-700' };
    return <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border ${colors[status]}`}>{status}</span>;
  };

  if (!isAuthenticated) return <AuthSystem onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {(isAiLoading || isExporting) && <LoadingOverlay message={loadingMessage} />}
      
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-slate-800 bg-slate-950/50">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2 italic uppercase">
            <ShieldAlert className="text-blue-500" size={32} /> SGE <span className="text-blue-500">PPPG</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab('painel')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'painel' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Painel</span>
          </button>
          <button onClick={() => setActiveTab('escoltas')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'escoltas' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Calendar size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Escoltas</span>
          </button>
          <button onClick={() => setActiveTab('internamentos')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'internamentos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Ambulance size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Internamentos</span>
          </button>
          <button onClick={() => setActiveTab('ocorrencias')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'ocorrencias' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <AlertTriangle size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Ocorrências</span>
          </button>
          <button onClick={() => setActiveTab('relatorios')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'relatorios' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <FileText size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Relatórios</span>
          </button>
          <div className="pt-8">
            <button onClick={() => setActiveTab('novo')} className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-xs uppercase tracking-widest shadow-xl">
              <PlusCircle size={20} /> Nova Operação
            </button>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <div className="p-3 bg-slate-950/30 rounded-2xl">
            <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2">
              <User size={10} /> {userEmail.split('@')[0]}
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

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-10 py-5 sticky top-0 z-10 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900 uppercase italic">{activeTab.toUpperCase()}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-xl text-sm" />
            </div>
            <button onClick={exportToCSV} className="p-2.5 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200"><Download size={20} /></button>
          </div>
        </header>

        <div className="p-10">
          {activeTab === 'painel' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border">
                <p className="text-[10px] font-black uppercase text-slate-500">Escoltas Totais</p>
                <p className="text-4xl font-black mt-1">{registros.filter(r => r.tipo === 'Escolta Operacional').length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border">
                <p className="text-[10px] font-black uppercase text-slate-500">Internamentos</p>
                <p className="text-4xl font-black mt-1">{registros.filter(r => r.tipo === 'Internamento').length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100">
                <p className="text-[10px] font-black uppercase text-rose-500">Alto Risco</p>
                <p className="text-4xl font-black mt-1 text-rose-600">{registros.filter(r => r.risco === 'Alto').length}</p>
              </div>
              <div className="bg-blue-600 p-6 rounded-3xl shadow-lg text-white">
                <p className="text-[10px] font-black uppercase text-blue-200">Pendentes</p>
                <p className="text-4xl font-black mt-1">{registros.filter(r => r.status === 'Pendente').length}</p>
              </div>
            </div>
          )}

          {(activeTab === 'escoltas' || activeTab === 'internamentos') && (
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                  <tr>
                    <th className="px-8 py-4 text-left">Preso</th>
                    <th className="px-8 py-4 text-left">Guarnição</th>
                    <th className="px-8 py-4 text-left">Status</th>
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {filteredBySearch.filter(r => (activeTab === 'escoltas' ? r.tipo !== 'Internamento' : r.tipo === 'Internamento')).map(reg => (
                    <tr key={reg.id} className="hover:bg-slate-50">
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-900">{reg.nomePreso}</p>
                        <p className="text-[10px] text-slate-400">PRONT: {reg.prontuario} • {reg.destino}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[10px] font-black text-blue-600">{reg.equipe}</p>
                        <p className="text-[10px] text-slate-500">{reg.policiais}</p>
                      </td>
                      <td className="px-8 py-5"><StatusBadge status={reg.status} /></td>
                      <td className="px-8 py-5 text-right flex justify-end items-center gap-2">
                        <button onClick={() => handleShowQr(reg)} className="p-2 text-slate-300 hover:text-blue-500"><QrCode size={18} /></button>
                        {canManageRecord(reg) && (
                          <>
                            <button onClick={() => setIsEditing(reg)} className="p-2 text-slate-300 hover:text-amber-500"><Edit3 size={18} /></button>
                            <button onClick={() => handleDeleteRegistro(reg.id)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={18} /></button>
                          </>
                        )}
                        <select value={reg.status} onChange={e => updateStatus(reg.id, e.target.value as Status)} className="text-[10px] font-black p-1 border rounded-lg bg-slate-50 outline-none">
                          <option value="Pendente">Pendente</option>
                          <option value="Em Andamento">Em Trânsito</option>
                          <option value="Concluído">Concluído</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'novo' && (
            <div className="max-w-4xl mx-auto bg-white rounded-[48px] p-12 border shadow-2xl">
              <h3 className="text-3xl font-black mb-8 italic uppercase">Novo Lançamento</h3>
              <form onSubmit={handleAddRegistro} className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="col-span-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Modalidade</label>
                    <select name="tipo" className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs uppercase outline-none">
                      <option value="Escolta Operacional">Escolta Operacional</option>
                      <option value="Internamento">Internamento</option>
                      <option value="Operação Externa">Operação Externa</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Risco</label>
                    <select name="risco" className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs uppercase outline-none">
                      <option value="Baixo">Baixo</option>
                      <option value="Médio">Médio</option>
                      <option value="Alto">Alto</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Nome do Preso</label>
                    <input name="nomePreso" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Prontuário</label>
                    <input name="prontuario" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Destino</label>
                    <input name="destino" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Data e Hora</label>
                    <input type="datetime-local" name="dataHora" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Equipe (VTR/Base)</label>
                    <input name="equipe" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Nomes dos Policiais</label>
                    <input name="policiais" placeholder="Ex: SGT Silva, SD Souza..." className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Observações</label>
                    <textarea name="observacoes" className="w-full p-4 bg-slate-50 border rounded-2xl font-medium outline-none" rows={3} />
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all">Cadastrar Operação</button>
              </form>
            </div>
          )}

          {activeTab === 'ocorrencias' && (
            <div className="max-w-4xl mx-auto space-y-10">
              <div className="bg-white p-10 rounded-[40px] border shadow-sm">
                <h3 className="text-xl font-black mb-6 uppercase">Novo Comunicado</h3>
                <form onSubmit={handleAddOcorrencia} className="space-y-6">
                  <input name="titulo" required placeholder="Título do Evento" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  <textarea name="descricao" required placeholder="Relato detalhado..." className="w-full p-4 bg-slate-50 border rounded-2xl font-medium outline-none" rows={4} />
                  <button type="submit" className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs">Publicar</button>
                </form>
              </div>
              <div className="space-y-6">
                {ocorrencias.map(oc => (
                  <div key={oc.id} className="bg-white p-8 rounded-[40px] border shadow-sm flex gap-6">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center font-black text-blue-600 shrink-0">{oc.autor[0]}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-lg">{oc.titulo}</h4>
                        <span className="text-[9px] font-black text-slate-400 uppercase">{new Date(oc.dataHora).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-2">{oc.descricao}</p>
                      <p className="text-[9px] font-black text-blue-500 uppercase mt-4">AUTOR: {oc.autor} • LOTAÇÃO: {oc.lotacao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'relatorios' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-slate-900 p-12 rounded-[48px] text-white">
                <h3 className="text-3xl font-black mb-6 italic uppercase">Relatório Estratégico IA</h3>
                <input value={manualSignature} onChange={e => setManualSignature(e.target.value)} placeholder="Assinatura Funcional" className="w-full p-4 bg-slate-800 rounded-2xl mb-6 text-white outline-none" />
                <button onClick={generateReport} disabled={isAiLoading} className="w-full py-5 bg-blue-600 rounded-3xl font-black uppercase shadow-lg shadow-blue-500/20">{isAiLoading ? 'Processando...' : 'Gerar com Gemini AI'}</button>
              </div>
              {aiReport && (
                <div className="bg-white p-12 rounded-[48px] border shadow-xl animate-in fade-in zoom-in duration-500">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">{aiReport}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="max-w-xl mx-auto bg-white rounded-[40px] p-10 border shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase">Segurança da Conta</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Alterar Senha de Acesso</p>
                </div>
              </div>
              
              {secStatus && (
                <div className={`mb-6 p-4 rounded-2xl text-xs font-bold ${secStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {secStatus.msg}
                </div>
              )}

              <form onSubmit={handleUpdateSecurity} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase block ml-1">Nova Senha</label>
                  <input 
                    type="password" value={secNewPassword} onChange={e => setSecNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase block ml-1">Confirmar Nova Senha</label>
                  <input 
                    type="password" value={secConfirmPassword} onChange={e => setSecConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Atualizar Senha</button>
              </form>
            </div>
          )}
        </div>
      </main>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl">
          <div className="bg-white rounded-[48px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 flex justify-between items-center bg-slate-50 border-b">
              <h3 className="text-xl font-black uppercase italic">Editar Lançamento</h3>
              <button onClick={() => setIsEditing(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleEditRegistro} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <input name="nomePreso" defaultValue={isEditing.nomePreso} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                <input name="prontuario" defaultValue={isEditing.prontuario} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                <input name="destino" defaultValue={isEditing.destino} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold col-span-2 outline-none" />
                <input type="datetime-local" name="dataHora" defaultValue={isEditing.dataHora.slice(0, 16)} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                <input name="equipe" defaultValue={isEditing.equipe} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                <input name="policiais" defaultValue={isEditing.policiais} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold col-span-2 outline-none" />
                <textarea name="observacoes" defaultValue={isEditing.observacoes} className="w-full p-4 bg-slate-50 border rounded-2xl font-medium col-span-2 outline-none" rows={3} />
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {qrModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 flex justify-between items-center bg-slate-50 border-b">
              <h3 className="text-xl font-black uppercase italic">Guia Operacional QR</h3>
              <button onClick={() => setQrModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="p-12 flex flex-col items-center">
              <img src={qrDataUrl || ''} alt="QR" className="w-64 h-64 border-8 border-slate-50 rounded-[48px] mb-8 shadow-sm" />
              <p className="text-2xl font-black uppercase italic text-slate-900">{selectedReg.nomePreso}</p>
              <p className="text-xs font-black text-slate-500 uppercase mt-2">PRONT: {selectedReg.prontuario}</p>
              <div className="mt-8 p-6 bg-slate-50 rounded-3xl w-full text-[10px] text-slate-600 font-bold uppercase text-center border space-y-1">
                <p><span className="text-blue-600">Equipe:</span> {selectedReg.equipe}</p>
                <p><span className="text-blue-600">Policiais:</span> {selectedReg.policiais}</p>
              </div>
              <button onClick={() => window.print()} className="mt-10 w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase flex items-center justify-center gap-3 no-print hover:bg-slate-800 transition-all">
                <Printer size={18} /> Imprimir Guia
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
          .bg-slate-900\/90 { background: white !important; }
          .shadow-2xl { shadow: none !important; }
          .rounded-\[48px\] { border-radius: 0 !important; border: 1px solid #ccc !important; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active  {
            -webkit-box-shadow: 0 0 0 30px #f8fafc inset !important;
        }
      `}</style>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) { createRoot(rootElement).render(<App />); }
