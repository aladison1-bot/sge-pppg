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
  FileDown,
  FileType,
  Filter,
  Eye,
  ClipboardList,
  Clock,
  MapPin,
  Shield,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
type Status = 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado';
type Risco = 'Baixo' | 'Médio' | 'Alto';
type TipoRegistro = 'Escolta Operacional' | 'Internamento' | 'Operação Externa';
type PDFFilter = 'Todos' | TipoRegistro;
type UnidadeEscopo = 'Cadeias Públicas' | 'Setor de Escolta Prisional' | 'Setor de Operações Especiais' | 'Administração Central';

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
  unidadeOrigem: UnidadeEscopo;
  createdBy: string;
  createdAt: string;
  dataAltaMedica?: string;
}

interface UserProfile {
  email: string;
  password?: string;
  isTemporary: boolean;
  fullName?: string;
  lotacao?: UnidadeEscopo;
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
        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Ação do Sistema</h4>
        <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">{message}</p>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div className="bg-blue-600 h-full w-1/2 animate-loading-bar rounded-full"></div>
      </div>
    </div>
  </div>
);

const AuthSystem = ({ onLoginSuccess }: { onLoginSuccess: (user: UserProfile) => void }) => {
  const [view, setView] = useState<'login' | 'change-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<UnidadeEscopo>('Cadeias Públicas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUsers = (): UserProfile[] => {
    const data = localStorage.getItem('sge_users_db_v3');
    if (!data) {
      // Definido o email solicitado pelo usuário como Administrador Mestre
      const defaultUsers: UserProfile[] = [{ 
        email: 'aladison@policiapenal.pr.gov.br', 
        password: '123', 
        isTemporary: true, 
        lotacao: 'Administração Central' 
      }];
      localStorage.setItem('sge_users_db_v3', JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(data);
  };

  const saveUser = (user: UserProfile) => {
    const users = getUsers();
    const index = users.findIndex(u => u.email === user.email);
    if (index >= 0) users[index] = { ...users[index], ...user };
    else users.push(user);
    localStorage.setItem('sge_users_db_v3', JSON.stringify(users));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      const users = getUsers();
      const inputEmail = email.trim().toLowerCase();
      const inputPassword = password.trim();
      
      const user = users.find(u => u.email.toLowerCase() === inputEmail);

      if (user && inputPassword === user.password) {
        if (user.isTemporary) {
          setView('change-password');
        } else {
          onLoginSuccess(user);
        }
      } else {
        setError('Acesso negado. Credenciais inválidas para o domínio Polícia Penal PR.');
      }
      setLoading(false);
    }, 800);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNew = newPassword.trim();
    if (cleanNew !== confirmPassword.trim()) {
      setError('As senhas não coincidem.');
      return;
    }
    if (cleanNew.length < 3) {
      setError('A senha deve ser mais forte (min 3 carac).');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const updatedUser: UserProfile = { 
        email: email.trim().toLowerCase(), 
        password: cleanNew, 
        isTemporary: false,
        lotacao: selectedUnit,
        fullName: email.split('@')[0].toUpperCase()
      };
      saveUser(updatedUser);
      onLoginSuccess(updatedUser);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 p-6 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 relative z-10 border border-white/10 animate-in zoom-in duration-500 my-auto">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="p-5 bg-slate-900 rounded-[24px] mb-6 shadow-xl shadow-blue-900/20">
            <ShieldAlert className="text-blue-500" size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-950 italic uppercase tracking-tighter leading-none">SGE <span className="text-blue-600">PPPG</span></h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Portal de Segurança Institucional</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-3">
            <Zap size={16} /> {error}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">E-mail Institucional</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm" 
                placeholder="ex: aladison@policiapenal.pr.gov.br" 
                autoCapitalize="none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Senha de Acesso</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm" 
                placeholder="••••" 
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
              Entrar no Portal
            </button>
            <div className="text-center">
              <p className="text-[10px] text-slate-400">Admin: aladison@policiapenal.pr.gov.br</p>
              <p className="text-[10px] text-slate-400">Senha Padrão: 123</p>
            </div>
          </form>
        )}

        {view === 'change-password' && (
          <form onSubmit={handleChangePassword} className="space-y-6">
            <p className="text-[10px] text-blue-600 font-black uppercase text-center mb-4">Configuração Final de Credenciais</p>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Vínculo de Lotação</label>
              <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value as UnidadeEscopo)} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none text-sm uppercase">
                <option value="Administração Central">Administração Central</option>
                <option value="Cadeias Públicas">Cadeias Públicas</option>
                <option value="Setor de Escolta Prisional">Setor de Escolta Prisional</option>
                <option value="Setor de Operações Especiais">Setor de Operações Especiais</option>
              </select>
            </div>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova Senha Personalizada" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar Nova Senha" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98]">Finalizar e Acessar</button>
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-slate-100 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic flex flex-col gap-1">
          <span>SGE - PROTOCOLO RESTRITO</span>
          <span className="text-blue-500">Desenvolvido V-1.0 2026</span>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'painel' | 'escoltas' | 'internamentos' | 'operacoes' | 'novo' | 'seguranca'>('painel');
  const [registros, setRegistros] = useState<Registro[]>(() => {
    const saved = localStorage.getItem('sge_data_v1.0_2026');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [adminContext, setAdminContext] = useState<UnidadeEscopo | 'Global'>('Global');
  const [searchTerm, setSearchTerm] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registro | null>(null);
  const [isEditing, setIsEditing] = useState<Registro | null>(null);
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllDates, setShowAllDates] = useState(false);
  const [newModality, setNewModality] = useState<TipoRegistro>('Escolta Operacional');
  const [pdfTypeFilter, setPdfTypeFilter] = useState<PDFFilter>('Todos');
  const [isGeneratingObs, setIsGeneratingObs] = useState(false);

  const [secFullName, setSecFullName] = useState('');
  const [secNewPassword, setSecNewPassword] = useState('');
  const [secConfirmPassword, setSecConfirmPassword] = useState('');
  const [secStatus, setSecStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setSecFullName(currentUser.fullName || '');
    }
  }, [currentUser]);

  useEffect(() => {
    const savedAuth = localStorage.getItem('sge_auth_v1');
    if (savedAuth) {
      const usersData = localStorage.getItem('sge_users_db_v3');
      if (usersData) {
        const users: UserProfile[] = JSON.parse(usersData);
        const user = users.find(u => u.email === savedAuth);
        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
        }
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sge_data_v1.0_2026', JSON.stringify(registros));
  }, [registros]);

  const handleLoginSuccess = (user: UserProfile) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    localStorage.setItem('sge_auth_v1', user.email);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('sge_auth_v1');
  };

  // ISOLAMENTO DE DADOS: Administrador vê tudo ou filtra, usuários veem apenas sua unidade
  const registrosExibiveis = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.lotacao === 'Administração Central') {
      if (adminContext === 'Global') return registros;
      return registros.filter(r => r.unidadeOrigem === adminContext);
    }
    // RIGOROSO: Retorna apenas o que pertence à unidade do usuário logado
    return registros.filter(r => r.unidadeOrigem === currentUser.lotacao);
  }, [registros, currentUser, adminContext]);

  const filteredRegistros = useMemo(() => {
    return registrosExibiveis.filter(r => {
      const lowerSearch = searchTerm.toLowerCase();
      const matchSearch = r.nomePreso.toLowerCase().includes(lowerSearch) || 
                          r.prontuario.toLowerCase().includes(lowerSearch) ||
                          r.destino.toLowerCase().includes(lowerSearch) ||
                          r.status.toLowerCase().includes(lowerSearch);
      
      if (showAllDates) return matchSearch;
      return matchSearch && r.dataHora.startsWith(viewDate);
    });
  }, [registrosExibiveis, searchTerm, viewDate, showAllDates]);

  const handleAddRegistro = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const tipo = formData.get('tipo') as TipoRegistro;
    const nomePreso = tipo === 'Operação Externa' ? '-' : (formData.get('nomePreso') as string);
    const prontuario = tipo === 'Operação Externa' ? '-' : (formData.get('prontuario') as string || '');
    const destino = formData.get('destino') as string;
    const dataHora = formData.get('dataHora') as string;
    const risco = formData.get('risco') as Risco;
    const observacoes = formData.get('observacoes') as string || '';

    // Unidade de origem é automática baseada na lotação do usuário, ou selecionada pelo admin
    const unidadeAlocada: UnidadeEscopo = currentUser.lotacao === 'Administração Central' 
      ? (adminContext === 'Global' ? 'Cadeias Públicas' : adminContext) 
      : currentUser.lotacao!;

    const novo: Registro = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      tipo,
      nomePreso,
      prontuario,
      destino,
      dataHora,
      risco,
      status: 'Pendente',
      observacoes,
      unidadeOrigem: unidadeAlocada,
      createdBy: currentUser.email,
      createdAt: new Date().toISOString()
    };
    
    setLoadingMessage("Protocolando Protocolo SGE...");
    setIsActionLoading(true);
    
    setTimeout(() => {
        setRegistros(prev => [novo, ...prev]);
        setIsActionLoading(false);
        setActiveTab(novo.tipo === 'Internamento' ? 'internamentos' : 'escoltas');
        setViewDate(novo.dataHora.split('T')[0]);
        setShowAllDates(false);
        form.reset();
    }, 600);
  };

  const handleEditRegistro = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditing) return;
    const formData = new FormData(e.currentTarget);
    const updated = registros.map(r => r.id === isEditing.id ? {
      ...r,
      tipo: formData.get('tipo') as TipoRegistro,
      nomePreso: formData.get('nomePreso') as string || r.nomePreso,
      prontuario: formData.get('prontuario') as string || r.prontuario,
      destino: formData.get('destino') as string || r.destino,
      dataHora: formData.get('dataHora') as string || r.dataHora,
      risco: formData.get('risco') as Risco,
      observacoes: formData.get('observacoes') as string || r.observacoes,
    } : r);
    setRegistros(updated);
    setIsEditing(null);
  };

  const updateStatus = (id: string, newStatus: Status) => {
    setRegistros(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const handleExportPDF = () => {
    let baseData = filteredRegistros;
    if (pdfTypeFilter !== 'Todos') baseData = baseData.filter(r => r.tipo === pdfTypeFilter);
    if (baseData.length === 0) return alert("Nenhum registro para exportação.");

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>SGE Relatório Unificado</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #0f172a; font-size: 10px; }
            header { border-bottom: 2px solid #1e293b; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            h1 { margin: 0; font-size: 18px; }
            .meta { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
            th { background: #f8fafc; text-align: left; padding: 6px; border: 1px solid #cbd5e1; font-size: 8px; }
            td { padding: 6px; border: 1px solid #cbd5e1; vertical-align: top; word-wrap: break-word; }
            .footer { margin-top: 40px; text-align: center; font-size: 7px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 5px; }
          </style>
        </head>
        <body>
          <header>
            <div>
              <h1>SGE <span>PPPG</span> - RELATÓRIO OPERACIONAL</h1>
              <div class="meta">Unidade: ${currentUser?.lotacao} | Contexto: ${adminContext}</div>
            </div>
            <div style="text-align: right">
              <div class="meta">Emissão: ${new Date().toLocaleString()}</div>
              <div class="meta">Desenvolvido V-1.0 2026</div>
            </div>
          </header>
          <table>
            <thead>
              <tr>
                <th style="width: 15%">Tipo</th>
                <th style="width: 25%">Identificação</th>
                <th style="width: 20%">Local/Destino</th>
                <th style="width: 10%">Risco/Status</th>
                <th style="width: 30%">Observações</th>
              </tr>
            </thead>
            <tbody>
              ${baseData.map(r => `
                <tr>
                  <td>${r.tipo}</td>
                  <td>${r.tipo === 'Operação Externa' ? 'OP. EXTERNA' : `<strong>${r.nomePreso}</strong><br/>Pront: ${r.prontuario}`}</td>
                  <td>${r.destino}</td>
                  <td>${r.risco}<br/>${r.status}</td>
                  <td>${r.observacoes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">DOCUMENTO DE USO RESTRITO - POLÍCIA PENAL PR - DESENVOLVIDO V-1.0 2026</div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const suggestObservations = async (form: HTMLFormElement) => {
    const formData = new FormData(form);
    const destino = formData.get('destino');
    if (!destino) return alert("Defina o destino primeiro.");

    setIsGeneratingObs(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const prompt = `Gere um relato técnico operacional sucinto e formal para uma movimentação prisional com destino ${destino}.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      const obsTextarea = form.querySelector('textarea[name="observacoes"]') as HTMLTextAreaElement;
      if (obsTextarea) obsTextarea.value = response.text || '';
    } catch (e) { console.error(e); } finally { setIsGeneratingObs(false); }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSecStatus(null);
    if (!currentUser) return;
    const usersData = localStorage.getItem('sge_users_db_v3');
    const users: UserProfile[] = JSON.parse(usersData || '[]');
    const idx = users.findIndex(u => u.email === currentUser.email);
    if (idx === -1) return;
    if (secNewPassword && secNewPassword !== secConfirmPassword) return setSecStatus({ type: 'error', msg: 'Senhas divergentes.' });
    if (secNewPassword) users[idx].password = secNewPassword;
    users[idx].fullName = secFullName;
    localStorage.setItem('sge_users_db_v3', JSON.stringify(users));
    setCurrentUser(users[idx]);
    setSecStatus({ type: 'success', msg: 'Perfil atualizado.' });
    setSecNewPassword(''); setSecConfirmPassword('');
  };

  if (!isAuthenticated || !currentUser) return <AuthSystem onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {isActionLoading && <LoadingOverlay message={loadingMessage} />}
      
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20 no-print shrink-0">
        <div className="p-8 border-b border-slate-800 bg-slate-950/50 text-center">
          <h1 className="text-2xl font-black tracking-tighter flex items-center justify-center gap-2 italic uppercase leading-none">
            <ShieldAlert className="text-blue-500" size={32} /> SGE <span className="text-blue-500">PPPG</span>
          </h1>
          <div className="mt-4 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-lg">
            <p className="text-[8px] font-black uppercase text-blue-400 tracking-widest truncate">{currentUser.lotacao}</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <button onClick={() => setActiveTab('painel')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'painel' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Início</span>
          </button>
          <button onClick={() => { setActiveTab('escoltas'); setShowAllDates(false); setSearchTerm(''); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'escoltas' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <CalendarIcon size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Escoltas</span>
          </button>
          <button onClick={() => { setActiveTab('internamentos'); setShowAllDates(false); setSearchTerm(''); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'internamentos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Ambulance size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Saúde</span>
          </button>
          <button onClick={() => setActiveTab('operacoes')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'operacoes' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Activity size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Relatórios</span>
          </button>
          
          <div className="pt-6">
            <button onClick={() => setActiveTab('novo')} className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-[0.98]">
              <PlusCircle size={18} /> Novo Atendimento
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 text-center">
          <p className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 italic">Desenvolvido V-1.0 2026</p>
          <button onClick={() => setActiveTab('seguranca')} className={`w-full flex items-center gap-3 px-4 py-2 mb-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-all ${activeTab === 'seguranca' && 'text-white'}`}>
            <Settings size={14} /> <span className="text-[10px] font-black uppercase">Meu Perfil</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
            <LogOut size={16} /> <span className="text-[10px] font-black uppercase">Deslogar</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-5 sticky top-0 z-10 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div className="flex items-center gap-6 w-full md:w-auto">
            <h2 className="text-xl font-black text-slate-900 uppercase italic whitespace-nowrap">{activeTab === 'painel' ? 'Dashboard Gestor' : activeTab.toUpperCase()}</h2>
            {(activeTab === 'escoltas' || activeTab === 'internamentos') && (
              <div className="flex items-center gap-2">
                 <input type="date" value={viewDate} onChange={e => { setViewDate(e.target.value); setShowAllDates(false); }} className={`p-2 border rounded-xl text-xs font-black uppercase outline-none transition-colors ${showAllDates ? 'bg-slate-100 opacity-50' : 'bg-slate-100'}`} />
                 {showAllDates && <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">Visão Geral</span>}
              </div>
            )}
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Pesquisar registros..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
          </div>
        </header>

        <div className="p-4 md:p-10 pb-20">
          {activeTab === 'painel' && (
            <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
              
              {/* SELETOR DE CONTEXTO PARA ADMINISTRADOR */}
              {currentUser.lotacao === 'Administração Central' && (
                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
                   <div className="flex items-center gap-3">
                      <ArrowRightLeft className="text-blue-600" size={20} />
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 leading-none">ADMIN: Alternar Visão de Unidade</h4>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      <button onClick={() => setAdminContext('Global')} className={`py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all ${adminContext === 'Global' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>Global</button>
                      <button onClick={() => setAdminContext('Cadeias Públicas')} className={`py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all ${adminContext === 'Cadeias Públicas' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>Cadeias</button>
                      <button onClick={() => setAdminContext('Setor de Escolta Prisional')} className={`py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all ${adminContext === 'Setor de Escolta Prisional' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>Escolta</button>
                      <button onClick={() => setAdminContext('Setor de Operações Especiais')} className={`py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all ${adminContext === 'Setor de Operações Especiais' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>S.O.E.</button>
                   </div>
                </div>
              )}

              <div className="bg-slate-900 p-10 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
                <div className="relative z-10 text-center md:text-left">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Resumo do Plantão</h3>
                  <p className="text-xs text-slate-400 mt-2 uppercase font-black tracking-widest">Acesso de: {currentUser.fullName}</p>
                  <p className="text-[11px] text-blue-500 font-black mt-4 uppercase italic">Desenvolvido V-1.0 2026</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] text-center shrink-0 min-w-[200px]">
                   <ShieldCheck className="mx-auto mb-2 text-emerald-400" size={32} />
                   <p className="text-xs font-black uppercase text-emerald-400">Ambiente Monitorado</p>
                   <p className="text-[9px] text-slate-500 uppercase mt-1">Lotação: {currentUser.lotacao}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div onClick={() => { setActiveTab('escoltas'); setShowAllDates(true); }} className="bg-white p-8 rounded-[32px] border border-slate-200 flex flex-col items-center cursor-pointer hover:scale-[1.02] transition-all shadow-sm">
                  <LayoutDashboard className="text-blue-600 mb-2" size={24} />
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Escoltas Externas</p>
                  <p className="text-4xl font-black mt-1">{registrosExibiveis.filter(r => r.tipo === 'Escolta Operacional').length}</p>
                </div>
                <div onClick={() => { setActiveTab('internamentos'); setShowAllDates(true); }} className="bg-white p-8 rounded-[32px] border border-slate-200 flex flex-col items-center cursor-pointer hover:scale-[1.02] transition-all shadow-sm">
                  <Ambulance className="text-emerald-600 mb-2" size={24} />
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Internamentos</p>
                  <p className="text-4xl font-black mt-1">{registrosExibiveis.filter(r => r.tipo === 'Internamento').length}</p>
                </div>
                <div onClick={() => { setActiveTab('escoltas'); setSearchTerm('Alto'); setShowAllDates(true); }} className="bg-white p-8 rounded-[32px] border border-rose-100 flex flex-col items-center cursor-pointer hover:scale-[1.02] transition-all shadow-sm">
                  <ShieldAlert className="text-rose-600 mb-2" size={24} />
                  <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest text-center">Críticos/Urgência</p>
                  <p className="text-4xl font-black mt-1 text-rose-600">{registrosExibiveis.filter(r => r.risco === 'Alto').length}</p>
                </div>
                <div className="bg-blue-600 p-8 rounded-[32px] shadow-xl text-white flex flex-col items-center">
                  <Clock className="text-blue-200 mb-2" size={24} />
                  <p className="text-[10px] font-black uppercase text-blue-200 tracking-widest text-center">Pendentes (24h)</p>
                  <p className="text-4xl font-black mt-1">{registrosExibiveis.filter(r => r.status === 'Pendente' && r.dataHora.startsWith(new Date().toISOString().split('T')[0])).length}</p>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'escoltas' || activeTab === 'internamentos') && (
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
              <div className="bg-slate-50 px-8 py-4 border-b flex justify-between items-center">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Listagem de Protocolos Ativos | Unidade: {currentUser.lotacao}</p>
                 <p className="text-[9px] font-black text-blue-500 uppercase italic">Desenvolvido V-1.0 2026</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                    <tr>
                      <th className="px-8 py-5 text-left">Identificação / Movimentação</th>
                      {activeTab === 'internamentos' && <th className="px-8 py-5 text-left">Setor Saúde</th>}
                      <th className="px-8 py-5 text-left">Status Operacional</th>
                      <th className="px-8 py-5 text-left">Origem Protocolo</th>
                      <th className="px-8 py-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filteredRegistros.filter(r => (activeTab === 'escoltas' ? r.tipo !== 'Internamento' : r.tipo === 'Internamento')).length === 0 ? (
                      <tr><td colSpan={5} className="py-24 text-center text-slate-400 font-black uppercase tracking-widest opacity-40 italic">Nenhum protocolo encontrado para os critérios selecionados.</td></tr>
                    ) : filteredRegistros.filter(r => (activeTab === 'escoltas' ? r.tipo !== 'Internamento' : r.tipo === 'Internamento')).map(reg => (
                      <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 uppercase">{reg.tipo === 'Operação Externa' ? 'OP. EXTERNA ESTRATÉGICA' : reg.nomePreso}</p>
                            {reg.risco === 'Alto' && <span className="bg-rose-100 text-rose-600 text-[8px] font-black px-2 py-0.5 rounded-full">ALERTA</span>}
                          </div>
                          <p className="text-[10px] text-slate-400 uppercase mt-1">PRONT: {reg.prontuario || '-'} • DESTINO: {reg.destino}</p>
                        </td>
                        {activeTab === 'internamentos' && <td className="px-8 py-6 text-[10px] font-black text-blue-600 uppercase italic"><MapPin size={12} className="inline mr-1" /> {reg.quarto || 'N/D'}</td>}
                        <td className="px-8 py-6">
                          <select value={reg.status} onChange={e => updateStatus(reg.id, e.target.value as Status)} className="text-[10px] font-black p-2 border rounded-xl bg-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all">
                            <option value="Pendente">Pendente</option>
                            <option value="Em Andamento">Em Andamento</option>
                            <option value="Concluído">Concluído</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-[10px] font-black text-slate-500 uppercase truncate max-w-[150px]">{reg.unidadeOrigem}</p>
                          <p className="text-[8px] text-slate-400 uppercase">{reg.createdBy.split('@')[0]}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setIsEditing(reg)} className="p-3 text-amber-500 hover:bg-amber-50 rounded-2xl transition-all" title="Editar"><Edit3 size={18} /></button>
                            <button onClick={() => { setSelectedReg(reg); setDetailModalOpen(true); }} className="p-3 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all" title="Ver Ficha"><Eye size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'novo' && (
            <div className="max-w-4xl mx-auto bg-white rounded-[40px] p-6 md:p-12 border shadow-2xl animate-in zoom-in duration-500">
              <div className="flex justify-between items-center mb-10 border-b pb-6">
                 <div>
                    <h3 className="text-3xl font-black italic uppercase text-slate-900 leading-none">Protocolo SGE PPPG</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Unidade Responsável: {currentUser.lotacao}</p>
                 </div>
                 <p className="text-[11px] font-black text-blue-600 uppercase italic">Desenvolvido V-1.0 2026</p>
              </div>

              <form onSubmit={handleAddRegistro} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest ml-1">Modalidade Atendimento</label>
                    <select name="tipo" value={newModality} onChange={e => setNewModality(e.target.value as TipoRegistro)} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-blue-500/10">
                      <option value="Escolta Operacional">Escolta Operacional</option>
                      <option value="Internamento">Internamento Hospitalar</option>
                      <option value="Operação Externa">Operação de Apoio/Externa</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest ml-1">Classificação de Risco</label>
                    <select name="risco" className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-blue-500/10">
                      <option value="Baixo">Verde - Risco Baixo</option>
                      <option value="Médio">Amarelo - Risco Médio</option>
                      <option value="Alto">Vermelho - Risco Alto</option>
                    </select>
                  </div>
                  
                  {newModality !== 'Operação Externa' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest ml-1">Identificação Nominal</label>
                        <input name="nomePreso" placeholder="Nome Completo do Custodiado" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest ml-1">Documento Prontuário</label>
                        <input name="prontuario" placeholder="Nº Prontuário / SISP" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-1 md:col-span-2 p-6 bg-slate-900 rounded-3xl text-[10px] font-black text-blue-400 uppercase italic leading-relaxed">
                      MODALIDADE ESTRATÉGICA: Identificação individual preservada no sistema por segurança do comboio.
                    </div>
                  )}
                  
                  <div className={newModality === 'Internamento' ? 'col-span-1' : 'col-span-1 md:col-span-2'}>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest ml-1">Local de Destino</label>
                    <input name="destino" placeholder="Ex: Hospital da Cruz / Unidade Prisional" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10" />
                  </div>

                  {newModality === 'Internamento' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-blue-600 block ml-1 tracking-widest flex items-center gap-1"><BedDouble size={12}/> Quarto/Leito</label>
                      <input name="quarto" placeholder="Ex: Q. 101 / L. 02" className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10" />
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 block ml-1 tracking-widest mb-2">Programação Horária</label>
                    <input type="datetime-local" name="dataHora" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10" />
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <div className="flex justify-between items-center mb-2 px-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Relato Operacional</label>
                      <button type="button" onClick={(e) => suggestObservations(e.currentTarget.closest('form') as HTMLFormElement)} disabled={isGeneratingObs} className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors">
                        {isGeneratingObs ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />} Sugestão IA
                      </button>
                    </div>
                    <textarea name="observacoes" placeholder="Informe aqui intercorrências, equipe responsável e detalhes técnicos..." className="w-full p-5 bg-slate-50 border rounded-3xl font-medium outline-none min-h-[140px] focus:ring-4 focus:ring-blue-500/10 transition-all" rows={4} />
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-[0.98]">
                    Protocolar no SGE
                </button>
              </form>
            </div>
          )}

          {activeTab === 'operacoes' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
              <div className="bg-slate-900 p-10 md:p-14 rounded-[40px] text-white shadow-2xl text-center relative overflow-hidden">
                <FileType className="mx-auto mb-6 text-blue-400" size={56} />
                <h3 className="text-3xl font-black mb-2 italic uppercase tracking-tighter leading-none">Exportação Operacional</h3>
                <p className="text-[11px] text-blue-500 font-black uppercase tracking-widest mb-10">Desenvolvido V-1.0 2026</p>
                
                <div className="max-w-xl mx-auto">
                  <div className="bg-slate-800 p-8 md:p-12 rounded-[32px] border border-slate-700 text-center flex flex-col items-center gap-8">
                    <div className="w-full space-y-6 pt-6">
                      <p className="text-xs text-slate-400 uppercase font-black">Somente dados vinculados à unidade <span className="text-white">{currentUser.lotacao}</span></p>
                      <select value={pdfTypeFilter} onChange={(e) => setPdfTypeFilter(e.target.value as PDFFilter)} className="w-full p-4 bg-slate-900 border border-slate-700 rounded-2xl text-sm font-black uppercase outline-none text-white focus:ring-4 focus:ring-blue-500/20">
                         <option value="Todos">Visão Geral Setorial</option>
                         <option value="Escolta Operacional">Apenas Escoltas</option>
                         <option value="Internamento">Apenas Internamentos</option>
                         <option value="Operação Externa">Operações Externas</option>
                      </select>
                      <button onClick={handleExportPDF} className="w-full py-5 bg-blue-600 rounded-3xl font-black uppercase text-xs shadow-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                        <FileDown size={22} /> Gerar PDF Oficial
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="max-w-xl mx-auto space-y-8 animate-in zoom-in duration-500">
              <div className="bg-white rounded-[40px] p-8 md:p-12 border shadow-sm text-center">
                <p className="text-[10px] font-black text-blue-600 uppercase italic mb-8 leading-none">SGE PPPG • DESENVOLVIDO V-1.0 2026</p>
                <h3 className="text-2xl font-black uppercase italic mb-8 border-b pb-4">Configuração Funcional</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-6 text-left">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 block ml-1 tracking-widest">Nome de Guerra / Completo</label>
                    <input value={secFullName} onChange={e => setSecFullName(e.target.value)} placeholder="Nome Profissional" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  </div>
                  <div className="p-5 bg-slate-900 rounded-3xl">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-2 tracking-widest">E-mail de Login</p>
                    <p className="text-sm font-black text-white uppercase flex items-center gap-2 truncate"><User size={16} className="text-blue-500" /> {currentUser.email}</p>
                  </div>
                  <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">Troca de Senha</h4>
                    <div className="space-y-4">
                      <input type="password" value={secNewPassword} onChange={e => setSecNewPassword(e.target.value)} placeholder="Nova Senha Segura" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                      <input type="password" value={secConfirmPassword} onChange={e => setSecConfirmPassword(e.target.value)} placeholder="Repetir Senha" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                    </div>
                  </div>
                  {secStatus && <div className={`p-4 rounded-2xl text-xs font-bold ${secStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{secStatus.msg}</div>}
                  <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest active:scale-[0.98]">Confirmar Alterações</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FICHA MODAL DETALHE */}
      {detailModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl p-6 md:p-12 flex flex-col relative">
            <button onClick={() => setDetailModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full no-print"><X size={28} /></button>
            <div className="text-center mb-10 border-b pb-8">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Ficha de Protocolo SGE</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">ID: {selectedReg.id} | Unidade Emissora: {selectedReg.unidadeOrigem}</p>
              <p className="text-[9px] text-blue-500 font-black mt-2 uppercase italic">Desenvolvido V-1.0 2026</p>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pessoa Sob Custódia</p>
                  <p className="text-xl font-black text-slate-900 uppercase">{selectedReg.nomePreso}</p>
                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase italic">Prontuário: {selectedReg.prontuario}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Itinerário & Agenda</p>
                  <p className="text-sm font-bold text-slate-800 uppercase leading-tight">{selectedReg.destino}</p>
                  <p className="text-[10px] text-blue-600 font-bold mt-2 uppercase">Início: {new Date(selectedReg.dataHora).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><ClipboardList size={14}/> Relatório Operacional Completo</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedReg.observacoes || 'Nenhum relato adicional protocolado.'}</p>
              </div>
            </div>
            <button onClick={() => window.print()} className="mt-8 w-full py-5 bg-slate-950 text-white rounded-3xl font-black uppercase flex items-center justify-center gap-3 no-print active:scale-95 transition-all"><Printer size={22} /> Imprimir Ficha Operacional</button>
          </div>
        </div>
      )}

      {/* RODAPÉ FIXO DE VERSIONAMENTO */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-3 bg-white/70 backdrop-blur-md border-t text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic z-10 no-print flex flex-col md:flex-row items-center justify-center gap-2">
        <span>SGE PPPG • SISTEMA DE MOVIMENTAÇÃO PRISIONAL</span>
        <span className="hidden md:inline">•</span>
        <span className="text-blue-500 font-black">DESENVOLVIDO V-1.0 2026</span>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .animate-loading-bar { animation: loading-bar 1.5s infinite ease-in-out; }
        @media print { 
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          aside, header { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; overflow: visible !important; height: auto !important; }
          .fixed { position: static !important; }
          .rounded-[40px] { border-radius: 0 !important; box-shadow: none !important; border: 1px solid #eee !important; }
        }
      `}</style>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) { createRoot(rootElement).render(<App />); }
