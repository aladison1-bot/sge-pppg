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
  RefreshCcw,
  ShieldCheck,
  // BadgeId was not found in lucide-react, using IdCard instead
  IdCard
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
  guarnicao?: string;
  dataConclusao?: string;
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
    dataConclusao: new Date().toISOString()
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
  const [view, setView] = useState<'login' | 'forgot' | 'first-access' | 'change-password' | 'confirmation'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUsers = (): UserProfile[] => {
    const data = localStorage.getItem('sge_users_db');
    return data ? JSON.parse(data) : [];
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
      const validPassword = user ? user.password : '123456';

      if (password === validPassword) {
        if (user?.isTemporary || !user) {
          if (!user) saveUser({ email, password: 'password', isTemporary: true });
          setView('change-password');
        } else {
          onLoginSuccess(email);
        }
      } else {
        setError('Credenciais inválidas. Verifique seus dados.');
      }
      setLoading(false);
    }, 1000);
  };

  const handleRequestTemporary = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      saveUser({ email, password: 'TEMPPASS123', isTemporary: true });
      setView('confirmation');
      setLoading(false);
    }, 1500);
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

  const renderTitle = () => (
    <div className="flex flex-col items-center mb-10 text-center">
      <div className="p-5 bg-slate-900 rounded-[24px] mb-6 shadow-xl shadow-blue-900/20">
        <ShieldAlert className="text-blue-500" size={48} />
      </div>
      <h1 className="text-3xl font-black text-slate-950 italic uppercase tracking-tighter leading-none">SGE <span className="text-blue-600">PPPG</span></h1>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Sistema de Gestão de Escoltas</p>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 p-6 overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-slate-800 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 relative z-10 border border-white/10 animate-in zoom-in duration-500 my-auto">
        {renderTitle()}

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
            <button type="button" onClick={() => setView('first-access')} className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-blue-600 transition-all">
              Primeiro Acesso ao SGE
            </button>
          </form>
        )}

        {(view === 'forgot' || view === 'first-access') && (
          <form onSubmit={handleRequestTemporary} className="space-y-6">
            <button type="button" onClick={() => setView('login')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all mb-4">
              <ArrowLeft size={14} /> Voltar para o login
            </button>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{view === 'forgot' ? 'Recuperar Acesso' : 'Ativar Sistema'}</h2>
              <p className="text-xs text-slate-500 font-medium">Insira seu e-mail funcional para receber um link de acesso e senha temporária.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Email Funcional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@policiapenal.gov.br"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
              {view === 'forgot' ? 'Enviar Nova Senha' : 'Ativar Primeiro Acesso'}
            </button>
          </form>
        )}

        {view === 'confirmation' && (
          <div className="text-center space-y-8 animate-in zoom-in duration-500">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                <CheckCircle size={40} />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">E-mail de Segurança Enviado!</h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Um link de verificação e sua <b>senha temporária</b> foram encaminhados para <span className="text-blue-600 font-bold">{email}</span>. 
                <br/><br/>
                <i>Para fins de teste, use a senha: <span className="bg-slate-100 px-2 py-1 rounded font-mono text-slate-900">TEMPPASS123</span></i>
              </p>
            </div>
            <button onClick={() => setView('login')} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest">
              Entendido, Ir para Login
            </button>
          </div>
        )}

        {view === 'change-password' && (
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="space-y-2">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <h2 className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-2 mb-1">
                  <KeyRound size={14} /> Atualização Obrigatória
                </h2>
                <p className="text-[10px] text-blue-600 font-medium">Detectamos um acesso com senha temporária ou primeiro login. Por segurança, altere sua senha para continuar.</p>
              </div>
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
              Salvar Nova Senha e Acessar
            </button>
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-relaxed">
            Uso Restrito - Polícia Penal<br/>Todos os acessos são monitorados e rastreados.
          </p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'painel' | 'escoltas' | 'internamentos' | 'relatorios' | 'novo'>('painel');
  const [viewPeriod, setViewPeriod] = useState<Periodo>('Diário');
  const [registros, setRegistros] = useState<Registro[]>(() => {
    const saved = localStorage.getItem('sge_data_final_v1');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
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

  useEffect(() => {
    const savedAuth = localStorage.getItem('sge_auth_v1');
    if (savedAuth) {
      setIsAuthenticated(true);
      setUserEmail(savedAuth);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sge_data_final_v1', JSON.stringify(registros));
  }, [registros]);

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

  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
  const isSameMonth = (d1: Date, d2: Date) => d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  const isSameYear = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear();

  const filteredByPeriod = useMemo(() => {
    const now = new Date();
    return registros.filter(r => {
      const regDate = new Date(r.dataHora);
      if (viewPeriod === 'Diário') return isSameDay(regDate, now);
      if (viewPeriod === 'Mensal') return isSameMonth(regDate, now);
      return isSameYear(regDate, now);
    });
  }, [registros, viewPeriod]);

  const displayRegistros = useMemo(() => {
    return registros.filter(r => {
      const isCorrectTab = (activeTab === 'escoltas' && (r.tipo === 'Escolta Operacional' || r.tipo === 'Operação Externa')) || 
                           (activeTab === 'internamentos' && r.tipo === 'Internamento');
      const matchSearch = r.nomePreso.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.prontuario.includes(searchTerm) ||
                          r.destino.toLowerCase().includes(searchTerm.toLowerCase());
      return isCorrectTab && matchSearch;
    });
  }, [registros, activeTab, searchTerm]);

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
      observacoes: formData.get('observacoes') as string,
      guarnicao: formData.get('guarnicao') as string || undefined,
    };
    setRegistros([...registros, novo]);
    setActiveTab(novo.tipo === 'Internamento' ? 'internamentos' : 'escoltas');
  };

  const updateStatus = (id: string, newStatus: Status) => {
    setRegistros(registros.map(r => r.id === id ? { 
      ...r, 
      status: newStatus,
      dataConclusao: newStatus === 'Concluído' ? new Date().toISOString() : r.dataConclusao 
    } : r));
  };

  const exportToCSV = async () => {
    if (displayRegistros.length === 0) return;
    setIsExporting(true);
    setLoadingMessage('Consolidando banco de dados para exportação CSV...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const headers = ['Tipo', 'Nome Preso', 'Prontuario', 'Destino', 'Data/Hora', 'Risco', 'Status', 'Guarnicao', 'Observacoes'];
    const rows = displayRegistros.map(r => [r.tipo, r.nomePreso, r.prontuario, r.destino, new Date(r.dataHora).toLocaleString('pt-BR'), r.risco, r.status, r.guarnicao || '', r.observacoes.replace(/\n/g, ' ')]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SGE_PPPG_Export_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setIsExporting(false);
  };

  const handleShowQr = async (reg: Registro) => {
    const text = `SGE PPPG - ${reg.tipo.toUpperCase()}\nPRESO: ${reg.nomePreso}\nPRONT: ${reg.prontuario}\nDESTINO: ${reg.destino}\nDATA: ${new Date(reg.dataHora).toLocaleString('pt-BR')}\nRISCO: ${reg.risco}`;
    try {
      const url = await QRCode.toDataURL(text, { width: 600, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } });
      setQrDataUrl(url);
      setSelectedReg(reg);
      setQrModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const generateReport = async () => {
    if (!manualSignature.trim()) {
      alert('Por favor, preencha seu Nome Completo ou CPF para assinar o relatório.');
      return;
    }

    setIsAiLoading(true);
    setAiReport(null);
    setLoadingMessage('Varrendo prontuários e registros de movimentação...');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const messages = ['Analisando registros...', 'Consultando Gemini...', 'Formatando dossiê final...'];
      let msgIndex = 0;
      const interval = setInterval(() => { msgIndex = (msgIndex + 1) % messages.length; setLoadingMessage(messages[msgIndex]); }, 2500);

      const dadosParaIA = filteredByPeriod.map(r => `- [${r.tipo}] STATUS: ${r.status.toUpperCase()} | Preso: ${r.nomePreso} | Prontuário: ${r.prontuario} | Destino: ${r.destino} | Risco: ${r.risco}`).join('\n');
      const prompt = `Você é um Policial Penal. Gere um relatório INTEGRAL e ESTRUTURADO das movimentações do período ${viewPeriod}. Foque na clareza e formalidade. 

      Ao final, assine o documento seguindo este formato exato:
      "Assinado por: ${manualSignature.trim()} - Email: ${userEmail}"

      DADOS: 
      ${dadosParaIA}`;

      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt 
      });
      clearInterval(interval);
      setAiReport(response.text || 'Erro na extração.');
    } catch (error) {
      setAiReport('Falha na IA. Verifique conexão.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const StatusBadge = ({ status }: { status: Status }) => {
    const colors = { 'Pendente': 'bg-amber-100 text-amber-700 border-amber-200', 'Em Andamento': 'bg-blue-100 text-blue-700 border-blue-200', 'Concluído': 'bg-emerald-100 text-emerald-700 border-emerald-200', 'Cancelado': 'bg-rose-100 text-rose-700 border-rose-200' };
    return <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase ${colors[status]}`}>{status}</span>;
  };

  if (!isAuthenticated) {
    return <AuthSystem onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {(isAiLoading || isExporting) && <LoadingOverlay message={loadingMessage} />}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-slate-800 bg-slate-950/50">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2 italic uppercase">
            <ShieldAlert className="text-blue-500 fill-blue-500/20" size={32} /> SGE <span className="text-blue-500">PPPG</span>
          </h1>
          <p className="text-slate-500 text-[10px] uppercase font-bold mt-2 tracking-widest leading-none">Gestão de Custódia</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => setActiveTab('painel')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'painel' ? 'bg-blue-600 shadow-xl shadow-blue-900/40 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Painel de Gestão</span>
          </button>
          <button onClick={() => setActiveTab('escoltas')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'escoltas' ? 'bg-blue-600 shadow-xl shadow-blue-900/40 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Calendar size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Escoltas / Externas</span>
          </button>
          <button onClick={() => setActiveTab('internamentos')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'internamentos' ? 'bg-blue-600 shadow-xl shadow-blue-900/40 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Ambulance size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Internamentos</span>
          </button>
          <button onClick={() => setActiveTab('relatorios')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'relatorios' ? 'bg-blue-600 shadow-xl shadow-blue-900/40 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <FileText size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Relatórios de IA</span>
          </button>
          <div className="pt-8">
            <button onClick={() => setActiveTab('novo')} className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-900/40 transition-all font-black text-xs uppercase tracking-widest">
              <PlusCircle size={20} /> Nova Operação
            </button>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-950/30 rounded-2xl mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white italic">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Operador Logado</p>
              <p className="text-xs font-bold text-white truncate">{userEmail.split('@')[0]}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all group">
            <LogOut size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-10 py-5 sticky top-0 z-10 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
              {activeTab === 'painel' ? 'Painel de Gestão' : activeTab === 'escoltas' ? 'Escoltas e Operações Externas' : activeTab}
            </h2>
            {(activeTab === 'painel' || activeTab === 'relatorios') && (
              <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                {(['Diário', 'Mensal', 'Anual'] as Periodo[]).map(p => (
                  <button key={p} onClick={() => { setViewPeriod(p); if (activeTab === 'relatorios') setAiReport(null); }}
                    className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewPeriod === p ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {(activeTab === 'escoltas' || activeTab === 'internamentos') && (
              <button onClick={exportToCSV} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm group">
                <Download size={16} /> Exportar CSV
              </button>
            )}
            <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Nome ou prontuário..." className="pl-12 pr-6 py-2.5 w-full border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-slate-100/50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </header>

        <div className="p-10">
          {activeTab === 'painel' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative group hover:border-blue-500 transition-all overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Escoltas Operacionais</p>
                    <p className="text-5xl font-black mt-2 text-slate-900 tracking-tighter">{filteredByPeriod.filter(r => r.tipo === 'Escolta Operacional').length}</p>
                  </div>
                  <Calendar className="absolute right-6 bottom-6 text-slate-100" size={64} />
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative group hover:border-indigo-500 transition-all overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Operações Externas</p>
                    <p className="text-5xl font-black mt-2 text-slate-900 tracking-tighter">{filteredByPeriod.filter(r => r.tipo === 'Operação Externa').length}</p>
                  </div>
                  <ExternalLink className="absolute right-6 bottom-6 text-slate-100" size={64} />
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative group hover:border-emerald-500 transition-all overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Internamentos</p>
                    <p className="text-5xl font-black mt-2 text-slate-900 tracking-tighter">{filteredByPeriod.filter(r => r.tipo === 'Internamento').length}</p>
                  </div>
                  <Ambulance className="absolute right-6 bottom-6 text-slate-100" size={64} />
                </div>
                <div className="bg-rose-600 p-8 rounded-[32px] shadow-2xl text-white relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest">GRI Alto Risco</p>
                    <p className="text-5xl font-black mt-2 text-white tracking-tighter">{filteredByPeriod.filter(r => r.risco === 'Alto').length}</p>
                  </div>
                  <Zap className="absolute right-6 bottom-6 text-rose-500/50" size={64} />
                </div>
              </div>

              <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase text-xs tracking-widest">
                    <Activity size={20} className="text-blue-500" /> Movimentações Recentes ({viewPeriod})
                  </h3>
                  <button onClick={() => setActiveTab('escoltas')} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">Ver Todos</button>
                </div>
                <div className="divide-y divide-slate-100">
                  {filteredByPeriod.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 italic font-medium">Nenhum registro encontrado.</div>
                  ) : (
                    filteredByPeriod.slice(0, 10).map(reg => (
                      <div key={reg.id} className="p-5 hover:bg-slate-50/50 transition flex items-center gap-6 group">
                        <div className={`p-4 rounded-2xl ${reg.tipo === 'Escolta Operacional' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {reg.tipo === 'Escolta Operacional' ? <Calendar size={24} /> : <Ambulance size={24} />}
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-base text-slate-900 leading-none">{reg.nomePreso}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">{reg.tipo} • PRONT: {reg.prontuario}</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <button onClick={() => handleShowQr(reg)} className="p-2.5 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><QrCode size={20} /></button>
                           <StatusBadge status={reg.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'relatorios' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in duration-500">
              <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden border border-slate-800">
                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="p-5 bg-blue-600/20 rounded-[32px] border border-blue-500/20"><Bot className="text-blue-400" size={48} /></div>
                    <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Análise Gemini AI</h3>
                  </div>
                  <p className="text-slate-400 text-base max-w-xl mb-10 leading-relaxed">Gere dossiês técnicos oficiais. Para assinar o documento, insira seu identificador abaixo.</p>
                  
                  <div className="max-w-md space-y-3 mb-10">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block ml-1">Assinatura Oficial (Nome Completo ou CPF)</label>
                    <div className="relative">
                      <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={manualSignature}
                        onChange={(e) => setManualSignature(e.target.value)}
                        placeholder="Digite sua assinatura funcional..."
                        className="w-full pl-12 pr-6 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 outline-none font-bold text-sm transition-all text-white placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <button onClick={generateReport} disabled={isAiLoading} className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl disabled:opacity-50">
                    {isAiLoading ? <Loader2 className="animate-spin" size={20} /> : 'Gerar Relatório Estratégico'}
                  </button>
                </div>
                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
              </div>

              {aiReport && (
                <div className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
                  <div className="prose prose-slate max-w-none"><div className="whitespace-pre-wrap font-medium text-slate-800 text-sm leading-relaxed tracking-tight">{aiReport}</div></div>
                  <div className="mt-16 pt-10 border-t border-slate-100 flex justify-end gap-4 no-print">
                    <button onClick={() => window.print()} className="px-10 py-4 border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"><Printer size={18} /> Imprimir</button>
                    <button onClick={() => setAiReport(null)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Fechar</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {(activeTab === 'escoltas' || activeTab === 'internamentos') && (
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Modalidade</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">GRI</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-sm">
                  {displayRegistros.map(reg => (
                    <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-900">{reg.nomePreso}</p>
                        <p className="text-[10px] text-slate-400 uppercase">PRONT: {reg.prontuario}</p>
                      </td>
                      <td className="px-8 py-6"><span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{reg.tipo}</span></td>
                      <td className="px-8 py-6"><span className={`text-[10px] font-black uppercase ${reg.risco === 'Alto' ? 'text-rose-600' : 'text-slate-600'}`}>{reg.risco}</span></td>
                      <td className="px-8 py-6"><StatusBadge status={reg.status} /></td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => handleShowQr(reg)} className="p-2 text-slate-400 hover:text-blue-600"><QrCode size={20} /></button>
                          <select value={reg.status} onChange={(e) => updateStatus(reg.id, e.target.value as Status)} className="text-[10px] font-black border-slate-200 rounded-xl p-2 outline-none">
                            <option value="Pendente">Pendente</option>
                            <option value="Em Andamento">Em Trânsito</option>
                            <option value="Concluído">Concluído</option>
                          </select>
                          <button onClick={() => setRegistros(registros.filter(r => r.id !== reg.id))} className="p-2 text-slate-200 hover:text-rose-600"><Trash2 size={20} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'novo' && (
            <div className="max-w-4xl mx-auto bg-white rounded-[48px] border border-slate-200 shadow-2xl p-12">
              <h3 className="text-4xl font-black text-slate-900 mb-10 flex items-center gap-5 tracking-tighter italic uppercase leading-none">
                <PlusCircle className="text-blue-600" size={40} /> Registro Operacional
              </h3>
              <form onSubmit={handleAddRegistro} className="space-y-10">
                <div className="grid grid-cols-2 gap-10">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Modalidade</label>
                    <select name="tipo" required className="w-full p-5 bg-slate-100 border border-slate-200 rounded-[24px] font-black text-xs uppercase">
                      <option value="Escolta Operacional">Escolta Operacional</option>
                      <option value="Internamento">Internamento Hospitalar</option>
                      <option value="Operação Externa">Operação Externa</option>
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Risco (GRI)</label>
                    <select name="risco" required className="w-full p-5 bg-slate-100 border border-slate-200 rounded-[24px] font-black text-xs uppercase">
                      <option value="Baixo">GRI Baixo</option>
                      <option value="Médio">GRI Médio</option>
                      <option value="Alto">GRI Alto</option>
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Custodiado</label>
                    <input type="text" name="nomePreso" required placeholder="Nome Completo" className="w-full p-5 bg-slate-100 border border-slate-200 rounded-[24px] font-bold text-sm" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Prontuário</label>
                    <input type="text" name="prontuario" required placeholder="00000-0" className="w-full p-5 bg-slate-100 border border-slate-200 rounded-[24px] font-bold text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Destino</label>
                    <input type="text" name="destino" required placeholder="Ex: Hospital Regional" className="w-full p-5 bg-slate-100 border border-slate-200 rounded-[24px] font-bold text-sm" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Data/Hora</label>
                    <input type="datetime-local" name="dataHora" required className="w-full p-5 bg-slate-100 border border-slate-200 rounded-[24px] font-bold text-sm" />
                  </div>
                </div>
                <div className="flex justify-end gap-6 pt-10 border-t border-slate-100">
                   <button type="button" onClick={() => setActiveTab('painel')} className="px-10 py-4 text-slate-400 font-black uppercase text-xs">Cancelar</button>
                   <button type="submit" className="px-16 py-5 bg-blue-600 text-white font-black rounded-[24px] hover:bg-blue-700 shadow-2xl uppercase text-xs tracking-widest italic transition-all">Confirmar Operação</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {qrModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[48px] w-full max-w-xl overflow-hidden shadow-2xl border border-white/20">
             <div className="p-10 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Guia de Trânsito QR</h3>
                <button onClick={() => setQrModalOpen(false)} className="p-4 hover:bg-slate-200 rounded-[24px] transition-all"><X size={28} className="text-slate-400" /></button>
             </div>
             <div id="printable-qr" className="p-12 flex flex-col items-center bg-white">
                <img src={qrDataUrl || ''} alt="QR" className="w-72 h-72 border-8 border-slate-900 rounded-[64px] mb-10" />
                <p className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic text-center">{selectedReg.nomePreso}</p>
                <p className="text-xs font-black text-slate-500 uppercase mt-4">PRONT: {selectedReg.prontuario}</p>
             </div>
             <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-6 no-print">
                <button onClick={() => window.print()} className="flex-1 py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-800 transition-all"><Printer size={20} /> Imprimir</button>
                <button onClick={() => setQrModalOpen(false)} className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-900 rounded-[24px] font-black text-xs uppercase hover:bg-slate-50 transition-all">Fechar</button>
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
        }
      `}</style>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) { createRoot(rootElement).render(<App />); }