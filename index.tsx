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
  ChevronRight,
  ClipboardCheck,
  Sparkles,
  BedDouble,
  Activity,
  FileDown
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
  quarto?: string;
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

interface UserProfile {
  email: string;
  password?: string;
  isTemporary: boolean;
  fullName?: string;
  lotacao?: string;
  setor?: string;
}

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
  const [view, setView] = useState<'login' | 'change-password'>('login');
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
        setError('Acesso negado. Credenciais inválidas.');
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
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 relative z-10 border border-white/10 animate-in zoom-in duration-500 my-auto">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="p-5 bg-slate-900 rounded-[24px] mb-6 shadow-xl shadow-blue-900/20">
            <ShieldAlert className="text-blue-500" size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-950 italic uppercase tracking-tighter leading-none">SGE <span className="text-blue-600">PPPG</span></h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Sistema de Gestão de Escoltas</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-3">
            <Zap size={16} /> {error}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Email Funcional</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm" placeholder="exemplo@policiapenal.gov.br" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Senha</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
              Acessar Sistema
            </button>
          </form>
        )}

        {view === 'change-password' && (
          <form onSubmit={handleChangePassword} className="space-y-6">
            <p className="text-[10px] text-blue-600 font-medium text-center">Defina uma nova senha segura para o seu primeiro acesso.</p>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova Senha" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar Senha" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Salvar e Acessar</button>
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-slate-100 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic flex flex-col gap-1">
          <span>USO RESTRITO - SGE</span>
          <span className="text-[9px] font-medium normal-case">desenvolvido V-1.0 2026</span>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'painel' | 'escoltas' | 'internamentos' | 'operacoes' | 'novo' | 'seguranca'>('painel');
  const [registros, setRegistros] = useState<Registro[]>(() => {
    const saved = localStorage.getItem('sge_data_v1.5');
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
  const [isEditing, setIsEditing] = useState<Registro | null>(null);
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newModality, setNewModality] = useState<TipoRegistro>('Escolta Operacional');
  
  // Security State
  const [secFullName, setSecFullName] = useState('');
  const [secLotacao, setSecLotacao] = useState('');
  const [secSetor, setSecSetor] = useState('');
  const [secNewPassword, setSecNewPassword] = useState('');
  const [secConfirmPassword, setSecConfirmPassword] = useState('');
  const [secStatus, setSecStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Observations AI Generation State
  const [isGeneratingObs, setIsGeneratingObs] = useState(false);

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
    localStorage.setItem('sge_data_v1.5', JSON.stringify(registros));
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

  const handleAddRegistro = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const novo: Registro = {
      id: Math.random().toString(36).substr(2, 9),
      tipo: formData.get('tipo') as TipoRegistro,
      nomePreso: formData.get('nomePreso') as string,
      prontuario: formData.get('prontuario') as string || '',
      destino: formData.get('destino') as string,
      quarto: formData.get('quarto') as string || undefined,
      dataHora: formData.get('dataHora') as string,
      risco: formData.get('risco') as Risco,
      status: 'Pendente',
      observacoes: formData.get('observacoes') as string || '',
      equipe: formData.get('equipe') as string || '',
      policiais: formData.get('policiais') as string || '',
      dataConclusao: undefined,
      dataAltaMedica: formData.get('dataAltaMedica') as string || undefined,
      createdBy: userEmail,
      createdAt: new Date().toISOString()
    };
    setRegistros([novo, ...registros]);
    setActiveTab(novo.tipo === 'Internamento' ? 'internamentos' : 'escoltas');
    setViewDate(novo.dataHora.split('T')[0]);
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
      prontuario: formData.get('prontuario') as string || '',
      destino: formData.get('destino') as string,
      quarto: formData.get('quarto') as string || undefined,
      dataHora: formData.get('dataHora') as string,
      risco: formData.get('risco') as Risco,
      observacoes: formData.get('observacoes') as string || '',
      equipe: formData.get('equipe') as string || '',
      policiais: formData.get('policiais') as string || '',
      dataAltaMedica: formData.get('dataAltaMedica') as string || undefined,
    } : r);
    setRegistros(updated);
    setIsEditing(null);
  };

  const handleDeleteRegistro = (id: string) => {
    if (window.confirm("Apagar permanentemente este registro?")) {
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

  const filteredBySearchAndDate = useMemo(() => {
    return registros.filter(r => {
      const lowerSearch = searchTerm.toLowerCase();
      const matchSearch = r.nomePreso.toLowerCase().includes(lowerSearch) || 
                          r.prontuario.includes(lowerSearch) ||
                          r.risco.toLowerCase().includes(lowerSearch) ||
                          r.status.toLowerCase().includes(lowerSearch);
      const matchDate = r.dataHora.startsWith(viewDate);
      return matchSearch && matchDate;
    });
  }, [registros, searchTerm, viewDate]);

  const generateReport = async () => {
    if (!manualSignature) return alert("Assine o relatório manualmente.");
    setIsAiLoading(true);
    setLoadingMessage("IA gerando resumo operacional diário...");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const dailyData = filteredBySearchAndDate.map(r => ({
        Preso: r.nomePreso,
        Tipo: r.tipo,
        Destino: r.destino,
        Quarto: r.quarto || 'N/A',
        Status: r.status,
        Horario: r.dataHora
      }));
      const prompt = `Gere um resumo simplificado das operações penitenciárias para o dia ${viewDate}. 
      Baseie-se nestes dados: ${JSON.stringify(dailyData)}. 
      Apresente em formato de tópicos diretos e técnicos.
      Assinatura do Policial Responsável: ${manualSignature}
      Email do Operador: ${userEmail}`;
      
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiReport(response.text);
    } catch (e) {
      setAiReport("Erro na geração do resumo de operações.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    const dailyData = filteredBySearchAndDate;
    if (dailyData.length === 0) return alert("Nenhum dado para baixar nesta data.");

    const operatorName = secFullName || userEmail;
    const dateNow = new Date().toLocaleString('pt-BR');
    
    // CSV Header with Operator info
    let csvContent = `RELATORIO DE ATENDIMENTOS DIARIOS - SGE PPPG\n`;
    csvContent += `Data de Referencia: ${viewDate}\n`;
    csvContent += `Download realizado por: ${operatorName}\n`;
    csvContent += `Data/Hora do Download: ${dateNow}\n\n`;
    
    // Columns
    csvContent += `TIPO;NOME;PRONTUARIO;DESTINO;QUARTO;RISCO;STATUS;DATA_HORA;OBSERVACOES\n`;

    dailyData.forEach(r => {
      const row = [
        r.tipo,
        r.nomePreso,
        r.prontuario,
        r.destino,
        r.quarto || 'N/A',
        r.risco,
        r.status,
        r.dataHora,
        (r.observacoes || '').replace(/;/g, ',').replace(/\n/g, ' ')
      ].join(';');
      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SGE_PPPG_OPERACAO_${viewDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const suggestObservations = async (form: HTMLFormElement) => {
    const formData = new FormData(form);
    const nome = formData.get('nomePreso');
    const destino = formData.get('destino');
    const tipo = formData.get('tipo');
    const risco = formData.get('risco');

    if (!nome || !destino) return alert("Preencha nome e destino para sugestão.");

    setIsGeneratingObs(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const prompt = `Gere uma observação técnica operacional curta e formal para um lançamento de ${tipo} do preso ${nome} para o destino ${destino} com risco ${risco}. Seja conciso.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      const obsTextarea = form.querySelector('textarea[name="observacoes"]') as HTMLTextAreaElement;
      if (obsTextarea) obsTextarea.value = response.text || '';
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingObs(false);
    }
  };

  const handleUpdateSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSecStatus(null);
    const usersData = localStorage.getItem('sge_users_db');
    if (!usersData) return;
    
    const users: UserProfile[] = JSON.parse(usersData);
    const idx = users.findIndex(u => u.email === userEmail);
    if (idx === -1) return;

    // Password Update Logic
    if (secNewPassword) {
      if (secNewPassword !== secConfirmPassword) {
        setSecStatus({ type: 'error', msg: 'Novas senhas não coincidem.' });
        return;
      }
      if (secNewPassword.length < 6) {
        setSecStatus({ type: 'error', msg: 'Senha deve ter 6+ caracteres.' });
        return;
      }
      users[idx].password = secNewPassword;
    }

    // Profile Update Logic
    users[idx].fullName = secFullName;
    users[idx].lotacao = secLotacao;
    users[idx].setor = secSetor;

    localStorage.setItem('sge_users_db', JSON.stringify(users));
    setSecStatus({ type: 'success', msg: 'Perfil e/ou senha atualizados com sucesso.' });
    setSecNewPassword('');
    setSecConfirmPassword('');
  };

  // Funções de clique no painel
  const goToEscoltas = () => { setActiveTab('escoltas'); setSearchTerm(''); };
  const goToInternamentos = () => { setActiveTab('internamentos'); setSearchTerm(''); };
  const goToAltoRisco = () => { setActiveTab('escoltas'); setSearchTerm('Alto'); };
  const goToPendentesHoje = () => { setActiveTab('escoltas'); setViewDate(new Date().toISOString().split('T')[0]); setSearchTerm('Pendente'); };

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
          <button onClick={() => setActiveTab('painel')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'painel' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Painel Gestor</span>
          </button>
          <button onClick={() => setActiveTab('escoltas')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'escoltas' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <CalendarIcon size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Escoltas</span>
          </button>
          <button onClick={() => setActiveTab('internamentos')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'internamentos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Ambulance size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Internamentos</span>
          </button>
          <button onClick={() => setActiveTab('operacoes')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'operacoes' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Activity size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Operações</span>
          </button>
          <div className="pt-8">
            <button onClick={() => setActiveTab('novo')} className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-xs uppercase tracking-widest shadow-xl transition-all">
              <PlusCircle size={20} /> Novo Lançamento
            </button>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <button onClick={() => setActiveTab('seguranca')} className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${activeTab === 'seguranca' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Settings size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Segurança</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
            <LogOut size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-10 py-5 sticky top-0 z-10 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-black text-slate-900 uppercase italic">{activeTab.toUpperCase()}</h2>
            {(activeTab === 'escoltas' || activeTab === 'internamentos' || activeTab === 'operacoes') && (
              <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} className="p-2 bg-slate-100 border rounded-xl text-xs font-black uppercase outline-none" />
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
        </header>

        <div className="p-10 pb-20">
          {activeTab === 'painel' && (
            <div className="max-w-md mx-auto space-y-6">
              <div 
                onClick={goToEscoltas}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all active:scale-[0.98]"
              >
                <LayoutDashboard className="text-blue-600 mb-2" size={32} />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Escoltas Totais</p>
                <p className="text-5xl font-black mt-1">{registros.filter(r => r.tipo === 'Escolta Operacional').length}</p>
                <span className="mt-4 text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">Clique para visualizar <ChevronRight size={10}/></span>
              </div>
              <div 
                onClick={goToInternamentos}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all active:scale-[0.98]"
              >
                <Ambulance className="text-emerald-600 mb-2" size={32} />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Internamentos</p>
                <p className="text-5xl font-black mt-1">{registros.filter(r => r.tipo === 'Internamento').length}</p>
                <span className="mt-4 text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">Clique para visualizar <ChevronRight size={10}/></span>
              </div>
              <div 
                onClick={goToAltoRisco}
                className="bg-white p-8 rounded-3xl shadow-sm border border-rose-200 flex flex-col items-center cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all active:scale-[0.98]"
              >
                <ShieldAlert className="text-rose-600 mb-2" size={32} />
                <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Alto Risco</p>
                <p className="text-5xl font-black mt-1 text-rose-600">{registros.filter(r => r.risco === 'Alto').length}</p>
                <span className="mt-4 text-[9px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">Clique para visualizar <ChevronRight size={10}/></span>
              </div>
              <div 
                onClick={goToPendentesHoje}
                className="bg-blue-600 p-8 rounded-3xl shadow-xl text-white flex flex-col items-center cursor-pointer hover:scale-[1.02] hover:shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                <ClipboardCheck className="text-blue-200 mb-2" size={32} />
                <p className="text-[10px] font-black uppercase text-blue-200 tracking-widest">Pendentes Hoje</p>
                <p className="text-5xl font-black mt-1">{registros.filter(r => r.status === 'Pendente' && r.dataHora.startsWith(new Date().toISOString().split('T')[0])).length}</p>
                <span className="mt-4 text-[9px] font-black text-blue-200 uppercase tracking-widest flex items-center gap-1">Clique para visualizar <ChevronRight size={10}/></span>
              </div>
            </div>
          )}

          {(activeTab === 'escoltas' || activeTab === 'internamentos') && (
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
              <div className="bg-slate-50/50 px-8 py-3 border-b text-[10px] font-black uppercase text-slate-400 tracking-widest flex justify-between items-center">
                <span>DIA: <span className="text-blue-600">{new Date(viewDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span></span>
                {searchTerm && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px]">Filtro ativo: "{searchTerm}"</span>}
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                  <tr>
                    <th className="px-8 py-4 text-left">Identificação</th>
                    {activeTab === 'internamentos' && <th className="px-8 py-4 text-left">Localização</th>}
                    <th className="px-8 py-4 text-left">Status Operacional</th>
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {filteredBySearchAndDate.filter(r => (activeTab === 'escoltas' ? r.tipo !== 'Internamento' : r.tipo === 'Internamento')).length === 0 ? (
                    <tr><td colSpan={activeTab === 'internamentos' ? 4 : 3} className="py-20 text-center text-slate-400 font-black uppercase tracking-widest opacity-50">Sem registros para esta data ou filtro aplicado.</td></tr>
                  ) : filteredBySearchAndDate.filter(r => (activeTab === 'escoltas' ? r.tipo !== 'Internamento' : r.tipo === 'Internamento')).map(reg => (
                    <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{reg.nomePreso}</p>
                          {reg.risco === 'Alto' && <span className="bg-rose-100 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Alto Risco</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase">PRONT: {reg.prontuario || 'N/A'} • {reg.destino}</p>
                      </td>
                      {activeTab === 'internamentos' && (
                        <td className="px-8 py-5">
                          <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1"><BedDouble size={12}/> {reg.quarto || 'NÃO INFORMADO'}</p>
                        </td>
                      )}
                      <td className="px-8 py-5">
                        <select value={reg.status} onChange={e => updateStatus(reg.id, e.target.value as Status)} className="text-[10px] font-black p-2 border rounded-xl bg-white outline-none">
                          <option value="Pendente">Pendente</option>
                          <option value="Em Andamento">{reg.tipo === 'Internamento' ? 'Internado (Em VTR/Hospital)' : 'Em Trânsito'}</option>
                          <option value="Concluído">{reg.tipo === 'Internamento' ? 'Alta Médica Concluída' : 'Operação Concluída'}</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td className="px-8 py-5 text-right flex justify-end gap-3">
                        <button onClick={() => setIsEditing(reg)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg" title="Editar"><Edit3 size={18} /></button>
                        <button onClick={() => handleDeleteRegistro(reg.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg" title="Excluir"><Trash2 size={18} /></button>
                        <button onClick={() => { setSelectedReg(reg); setQrModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="QR Code"><QrCode size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'novo' && (
            <div className="max-w-4xl mx-auto bg-white rounded-[40px] p-12 border shadow-2xl animate-in zoom-in duration-500">
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
                  <input name="nomePreso" placeholder="Nome do Preso" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  <input name="prontuario" placeholder="Prontuário" required={newModality !== 'Operação Externa'} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  
                  <div className={newModality === 'Internamento' ? 'col-span-1' : 'col-span-1 md:col-span-2'}>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Destino</label>
                    <input name="destino" placeholder="Local de Destino" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  </div>

                  {newModality === 'Internamento' && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-blue-600 block mb-2 tracking-widest flex items-center gap-1"><BedDouble size={12}/> Nº Quarto/Leito</label>
                      <input name="quarto" placeholder="Ex: Quarto 304, Leito A" className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl font-bold outline-none" />
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Início da Operação</label>
                      <input type="datetime-local" name="dataHora" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                    </div>
                    {newModality === 'Internamento' && (
                      <div>
                        <label className="text-[10px] font-black uppercase text-blue-600 block mb-2 tracking-widest">Previsão de Alta</label>
                        <input type="date" name="dataAltaMedica" className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl font-bold outline-none" />
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Observações Operacionais</label>
                      <button 
                        type="button" 
                        onClick={(e) => suggestObservations(e.currentTarget.closest('form') as HTMLFormElement)} 
                        disabled={isGeneratingObs}
                        className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors"
                      >
                        {isGeneratingObs ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                        Sugerir com IA
                      </button>
                    </div>
                    <textarea name="observacoes" placeholder="Relato técnico ou intercorrências..." className="w-full p-4 bg-slate-50 border rounded-2xl font-medium outline-none" rows={4} />
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all">Registrar Operação</button>
              </form>
            </div>
          )}

          {activeTab === 'operacoes' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
              <div className="bg-slate-900 p-12 rounded-[40px] text-white shadow-2xl text-center">
                <Bot className="mx-auto mb-4 text-blue-400" size={48} />
                <h3 className="text-2xl font-black mb-6 italic uppercase">Gerenciar Operações do Dia</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
                  <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 text-left flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-black uppercase text-blue-400 mb-2">Resumo com IA</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed mb-4">Gera um relatório técnico consolidado usando Inteligência Artificial baseado nos lançamentos da data selecionada.</p>
                    </div>
                    <div className="space-y-4">
                      <input value={manualSignature} onChange={e => setManualSignature(e.target.value)} placeholder="Assinatura p/ Relatório" className="w-full p-3 bg-slate-900 rounded-xl text-xs outline-none border border-slate-700" />
                      <button onClick={generateReport} disabled={isAiLoading} className="w-full py-4 bg-blue-600 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-blue-500 transition-all">
                        {isAiLoading ? 'Analisando...' : 'Gerar Resumo IA'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 text-left flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-black uppercase text-emerald-400 mb-2">Exportar Dados</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed mb-4">Baixe a planilha completa de atendimentos desta data. O arquivo incluirá a identificação do operador responsável.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-900 rounded-xl text-[9px] font-black uppercase text-slate-500 border border-slate-700">
                        Responsável: {secFullName || userEmail}
                      </div>
                      <button onClick={handleDownloadCSV} className="w-full py-4 bg-emerald-600 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-2">
                        <FileDown size={16} /> Baixar Atendimentos (CSV)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {aiReport && (
                <div className="bg-white p-12 rounded-[40px] border shadow-xl animate-in zoom-in duration-500 relative">
                   <button onClick={() => window.print()} className="absolute top-8 right-8 p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all no-print" title="Imprimir Relatório"><Printer size={20} /></button>
                   <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium text-slate-700 print:text-xs">{aiReport}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="max-w-xl mx-auto space-y-8 animate-in zoom-in duration-500">
              <div className="bg-white rounded-[40px] p-10 border shadow-sm">
                <h3 className="text-xl font-black uppercase mb-8 border-b pb-4">Configurações de Segurança</h3>
                <form onSubmit={handleUpdateSecurity} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 ml-1 tracking-widest">Nome Funcional</label>
                    <input value={secFullName} onChange={e => setSecFullName(e.target.value)} placeholder="Nome Completo" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 ml-1 tracking-widest">Unidade</label>
                      <input value={secLotacao} onChange={e => setSecLotacao(e.target.value)} placeholder="Ex: PPPG" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 ml-1 tracking-widest">Divisão/Setor</label>
                      <input value={secSetor} onChange={e => setSecSetor(e.target.value)} placeholder="Ex: GRI" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-2"><Lock size={14}/> Gestão de Senha</h4>
                    <div className="space-y-4">
                      <input 
                        type="password" 
                        value={secNewPassword} 
                        onChange={e => setSecNewPassword(e.target.value)} 
                        placeholder="Nova Senha" 
                        className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" 
                      />
                      <input 
                        type="password" 
                        value={secConfirmPassword} 
                        onChange={e => setSecConfirmPassword(e.target.value)} 
                        placeholder="Confirmar Nova Senha" 
                        className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" 
                      />
                    </div>
                  </div>

                  {secStatus && (
                    <div className={`p-4 rounded-2xl text-xs font-bold ${secStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      {secStatus.msg}
                    </div>
                  )}

                  <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">Salvar Perfil e Acesso</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in zoom-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl p-10">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h3 className="text-xl font-black uppercase italic">Editar Registro</h3>
              <button onClick={() => setIsEditing(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleEditRegistro} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Modalidade</label>
                  <select name="tipo" defaultValue={isEditing.tipo} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs uppercase outline-none">
                    <option value="Escolta Operacional">Escolta Operacional</option>
                    <option value="Internamento">Internamento</option>
                    <option value="Operação Externa">Operação Externa</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Risco</label>
                  <select name="risco" defaultValue={isEditing.risco} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs uppercase outline-none">
                    <option value="Baixo">Baixo</option>
                    <option value="Médio">Médio</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>
                <input name="nomePreso" defaultValue={isEditing.nomePreso} placeholder="Nome do Preso" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                <input name="prontuario" defaultValue={isEditing.prontuario} placeholder="Prontuário" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                
                <input name="destino" defaultValue={isEditing.destino} placeholder="Destino" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                
                {isEditing.tipo === 'Internamento' && (
                  <input name="quarto" defaultValue={isEditing.quarto} placeholder="Quarto/Leito" className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl font-bold outline-none" />
                )}

                <div className="col-span-1 md:col-span-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Início</label>
                  <input type="datetime-local" name="dataHora" defaultValue={isEditing.dataHora.slice(0, 16)} required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                </div>
                
                <div className="col-span-1 md:col-span-2">
                   <textarea name="observacoes" defaultValue={isEditing.observacoes} placeholder="Observações Técnicas" className="w-full p-4 bg-slate-50 border rounded-2xl font-medium outline-none" rows={3} />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {qrModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in zoom-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl p-10 flex flex-col items-center">
            <h3 className="text-xl font-black uppercase italic mb-8 border-b w-full text-center pb-4">Identificação Digital Operacional</h3>
            <div className="bg-slate-100 p-8 rounded-[40px] mb-8 border-4 border-slate-50 shadow-inner">
               <QrCode size={128} className="text-slate-400" />
            </div>
            <p className="text-2xl font-black uppercase italic text-slate-900 text-center">{selectedReg.nomePreso}</p>
            <p className="text-xs font-black text-slate-500 uppercase mt-2 tracking-widest">PRONT: {selectedReg.prontuario || 'N/A'}</p>
            {selectedReg.quarto && <p className="text-[10px] font-black text-blue-600 uppercase mt-1">QUARTO/LEITO: {selectedReg.quarto}</p>}
            <button onClick={() => window.print()} className="mt-10 w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase flex items-center justify-center gap-3 no-print hover:bg-slate-800 transition-all shadow-lg"><Printer size={20} /> Imprimir Ficha de Identificação</button>
            <button onClick={() => setQrModalOpen(false)} className="mt-4 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-600">Fechar Janela</button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-64 right-0 p-4 bg-white/60 backdrop-blur-md border-t text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic z-10 no-print flex flex-col gap-0.5">
        <span>USO RESTRITO - SGE</span>
        <span className="text-[9px] font-medium normal-case">desenvolvido V-1.0 2026</span>
      </div>

      <style>{`
        @keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .animate-loading-bar { animation: loading-bar 2s infinite ease-in-out; }
        @media print { 
          .no-print { display: none !important; }
          body { background: white !important; }
          aside, header { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; overflow: visible !important; height: auto !important; }
          .rounded-[40px], .rounded-[32px] { border-radius: 0 !important; box-shadow: none !important; border: 1px solid #eee !important; }
        }
      `}</style>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) { createRoot(rootElement).render(<App />); }
