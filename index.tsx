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
  Shield
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
type Status = 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado';
type Risco = 'Baixo' | 'Médio' | 'Alto';
type TipoRegistro = 'Escolta Operacional' | 'Internamento' | 'Operação Externa';
type PDFFilter = 'Todos' | TipoRegistro;
type UnidadeEscopo = 'Cadeia Pública' | 'Setor de Escolta' | 'Setor de Operações Especiais' | 'Administração Central';

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
  unidadeOrigem: UnidadeEscopo;
  createdAt: string;
}

interface UserProfile {
  email: string;
  password?: string;
  isTemporary: boolean;
  fullName?: string;
  lotacao?: UnidadeEscopo;
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

const AuthSystem = ({ onLoginSuccess }: { onLoginSuccess: (user: UserProfile) => void }) => {
  const [view, setView] = useState<'login' | 'change-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<UnidadeEscopo>('Cadeia Pública');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUsers = (): UserProfile[] => {
    const data = localStorage.getItem('sge_users_db');
    if (!data) {
      const defaultUsers: UserProfile[] = [{ email: 'admin@pppg.gov.br', password: '123', isTemporary: true, lotacao: 'Administração Central' }];
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
        setError('Acesso negado. Credenciais inválidas. Certifique-se de não haver espaços extras.');
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
      setError('A senha deve ter no mínimo 3 caracteres.');
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
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Gestão por Unidade Operacional</p>
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
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm" 
                placeholder="ex: admin@pppg.gov.br"
                autoCapitalize="none"
                autoComplete="email"
                spellCheck="false"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Senha</label>
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
              Acessar Sistema
            </button>
          </form>
        )}

        {view === 'change-password' && (
          <form onSubmit={handleChangePassword} className="space-y-6">
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest text-center mb-4">Configuração Inicial de Acesso</p>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Sua Unidade de Lotação</label>
              <select 
                value={selectedUnit} 
                onChange={(e) => setSelectedUnit(e.target.value as UnidadeEscopo)}
                className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none text-sm uppercase"
              >
                <option value="Cadeia Pública">Cadeia Pública</option>
                <option value="Setor de Escolta">Setor de Escolta</option>
                <option value="Setor de Operações especiais">Setor de Operações Especiais</option>
              </select>
            </div>

            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova Senha" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar Senha" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
            
            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98]">
              Finalizar e Entrar
            </button>
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-slate-100 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic flex flex-col gap-1">
          <span>SGE - ACESSO RESTRITO</span>
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
    const saved = localStorage.getItem('sge_data_v1.5');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registro | null>(null);
  const [isEditing, setIsEditing] = useState<Registro | null>(null);
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllDates, setShowAllDates] = useState(false);
  const [newModality, setNewModality] = useState<TipoRegistro>('Escolta Operacional');
  const [pdfTypeFilter, setPdfTypeFilter] = useState<PDFFilter>('Todos');
  const [isGeneratingObs, setIsGeneratingObs] = useState(false);

  // Security State (Profile)
  const [secFullName, setSecFullName] = useState('');
  const [secNewPassword, setSecNewPassword] = useState('');
  const [secConfirmPassword, setSecConfirmPassword] = useState('');
  const [secStatus, setSecStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('sge_auth_v1');
    if (savedAuth) {
      const usersData = localStorage.getItem('sge_users_db');
      if (usersData) {
        const users: UserProfile[] = JSON.parse(usersData);
        const user = users.find(u => u.email === savedAuth);
        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
          setSecFullName(user.fullName || '');
        }
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sge_data_v1.5', JSON.stringify(registros));
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

  // --- Filtro de Isolamento de Unidade ---
  const registrosFiltradosPorUnidade = useMemo(() => {
    if (!currentUser) return [];
    // Admin Central vê tudo
    if (currentUser.lotacao === 'Administração Central') return registros;
    // Outras unidades veem apenas o seu escopo
    return registros.filter(r => r.unidadeOrigem === currentUser.lotacao);
  }, [registros, currentUser]);

  const filteredBySearchAndDate = useMemo(() => {
    return registrosFiltradosPorUnidade.filter(r => {
      const lowerSearch = searchTerm.toLowerCase();
      const matchSearch = r.nomePreso.toLowerCase().includes(lowerSearch) || 
                          r.prontuario.toLowerCase().includes(lowerSearch) ||
                          r.risco.toLowerCase().includes(lowerSearch) ||
                          r.status.toLowerCase().includes(lowerSearch) ||
                          r.tipo.toLowerCase().includes(lowerSearch) ||
                          r.destino.toLowerCase().includes(lowerSearch);
      
      if (showAllDates) return matchSearch;
      const matchDate = r.dataHora.startsWith(viewDate);
      return matchSearch && matchDate;
    });
  }, [registrosFiltradosPorUnidade, searchTerm, viewDate, showAllDates]);

  const handleAddRegistro = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    const formData = new FormData(e.currentTarget);
    const tipo = formData.get('tipo') as TipoRegistro;
    
    const novo: Registro = {
      id: Math.random().toString(36).substr(2, 9),
      tipo: tipo,
      nomePreso: tipo === 'Operação Externa' ? '-' : (formData.get('nomePreso') as string),
      prontuario: tipo === 'Operação Externa' ? '-' : (formData.get('prontuario') as string || ''),
      destino: formData.get('destino') as string,
      quarto: formData.get('quarto') as string || undefined,
      dataHora: formData.get('dataHora') as string,
      risco: formData.get('risco') as Risco,
      status: 'Pendente',
      observacoes: formData.get('observacoes') as string || '',
      equipe: '',
      policiais: '',
      unidadeOrigem: currentUser.lotacao || 'Cadeia Pública',
      createdBy: currentUser.email,
      createdAt: new Date().toISOString()
    };
    setRegistros([novo, ...registros]);
    setActiveTab(novo.tipo === 'Internamento' ? 'internamentos' : 'escoltas');
    setViewDate(novo.dataHora.split('T')[0]);
    setShowAllDates(false);
    e.currentTarget.reset();
  };

  const handleEditRegistro = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditing) return;
    const formData = new FormData(e.currentTarget);
    const tipo = formData.get('tipo') as TipoRegistro;
    
    const updated = registros.map(r => r.id === isEditing.id ? {
      ...r,
      tipo: tipo,
      nomePreso: tipo === 'Operação Externa' ? '-' : (formData.get('nomePreso') as string),
      prontuario: tipo === 'Operação Externa' ? '-' : (formData.get('prontuario') as string || ''),
      destino: formData.get('destino') as string,
      quarto: formData.get('quarto') as string || undefined,
      dataHora: formData.get('dataHora') as string,
      risco: formData.get('risco') as Risco,
      observacoes: formData.get('observacoes') as string || '',
    } : r);
    setRegistros(updated);
    setIsEditing(null);
  };

  const updateStatus = (id: string, newStatus: Status) => {
    setRegistros(registros.map(r => r.id === id ? { 
      ...r, 
      status: newStatus,
      dataConclusao: newStatus === 'Concluído' ? new Date().toISOString() : r.dataConclusao 
    } : r));
  };

  const handleExportPDF = () => {
    let baseData = filteredBySearchAndDate;
    if (pdfTypeFilter !== 'Todos') {
      baseData = baseData.filter(r => r.tipo === pdfTypeFilter);
    }
    if (baseData.length === 0) return alert("Nenhum dado encontrado para exportação.");

    const operatorName = secFullName || currentUser?.email || 'Operador SGE';
    const dateNow = new Date().toLocaleString('pt-BR');
    const displayDate = showAllDates ? "TODAS AS DATAS" : new Date(viewDate + 'T00:00:00').toLocaleDateString('pt-BR');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Relatório Operacional - ${currentUser?.lotacao}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.4; font-size: 10px; }
            header { border-bottom: 2px solid #334155; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            h1 { margin: 0; font-size: 18px; text-transform: uppercase; }
            h1 span { color: #2563eb; }
            .meta { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; table-layout: fixed; }
            th { background: #f1f5f9; text-align: left; padding: 6px; text-transform: uppercase; border: 1px solid #cbd5e1; font-size: 8px; }
            td { padding: 6px; border: 1px solid #cbd5e1; vertical-align: top; word-wrap: break-word; }
            .signature-space { margin-top: 60px; display: flex; justify-content: space-around; }
            .sig-box { border-top: 1px solid #334155; width: 40%; text-align: center; padding-top: 5px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <header>
            <div>
              <h1>SGE <span>PPPG</span></h1>
              <div class="meta">${currentUser?.lotacao}</div>
              <div class="meta">Modalidade: ${pdfTypeFilter}</div>
            </div>
            <div style="text-align: right">
              <div class="meta">Período: ${displayDate}</div>
              <div class="meta">Exportado: ${dateNow}</div>
            </div>
          </header>
          <table>
            <thead>
              <tr>
                <th style="width: 15%">Tipo</th>
                <th style="width: 25%">Identificação</th>
                <th style="width: 15%">Destino</th>
                <th style="width: 10%">Risco/Status</th>
                <th style="width: 35%">Observações</th>
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
          <div class="signature-space">
            <div class="sig-box">
              <div style="margin-bottom: 2px">${operatorName}</div>
              Emissor Responsável
            </div>
            <div class="sig-box">
              <div style="margin-bottom: 2px">&nbsp;</div>
              Chefe do Setor / Unidade
            </div>
          </div>
          <footer style="margin-top: 40px; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            DOCUMENTO OPERACIONAL RESTRITO - POLÍCIA PENAL PPPG
          </footer>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const suggestObservations = async (form: HTMLFormElement) => {
    const formData = new FormData(form);
    const nome = formData.get('nomePreso');
    const destino = formData.get('destino');
    const tipo = formData.get('tipo');
    const risco = formData.get('risco');
    if (!destino) return alert("Preencha o destino.");

    setIsGeneratingObs(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const prompt = `Gere uma observação técnica operacional curta para uma ${tipo} com destino ${destino} e risco ${risco}. Seja formal.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      const obsTextarea = form.querySelector('textarea[name="observacoes"]') as HTMLTextAreaElement;
      if (obsTextarea) obsTextarea.value = response.text || '';
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingObs(false);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSecStatus(null);
    if (!currentUser) return;
    
    const usersData = localStorage.getItem('sge_users_db');
    if (!usersData) return;
    const users: UserProfile[] = JSON.parse(usersData);
    const idx = users.findIndex(u => u.email === currentUser.email);
    if (idx === -1) return;

    if (secNewPassword && secNewPassword !== secConfirmPassword) {
      setSecStatus({ type: 'error', msg: 'Senhas não coincidem.' });
      return;
    }

    if (secNewPassword) users[idx].password = secNewPassword;
    users[idx].fullName = secFullName;

    localStorage.setItem('sge_users_db', JSON.stringify(users));
    setCurrentUser(users[idx]);
    setSecStatus({ type: 'success', msg: 'Perfil atualizado.' });
    setSecNewPassword(''); setSecConfirmPassword('');
  };

  const goToEscoltas = () => { setActiveTab('escoltas'); setSearchTerm(''); setShowAllDates(true); };
  const goToInternamentos = () => { setActiveTab('internamentos'); setSearchTerm(''); setShowAllDates(true); };
  const goToAltoRisco = () => { setActiveTab('escoltas'); setSearchTerm('Alto'); setShowAllDates(true); };
  const goToPendentesHoje = () => { setActiveTab('escoltas'); setViewDate(new Date().toISOString().split('T')[0]); setSearchTerm('Pendente'); setShowAllDates(false); };

  if (!isAuthenticated || !currentUser) return <AuthSystem onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {(isAiLoading || isExporting) && <LoadingOverlay message={loadingMessage} />}
      
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20 no-print shrink-0">
        <div className="p-8 border-b border-slate-800 bg-slate-950/50 text-center">
          <h1 className="text-2xl font-black tracking-tighter flex items-center justify-center gap-2 italic uppercase">
            <ShieldAlert className="text-blue-500" size={32} /> SGE <span className="text-blue-500">PPPG</span>
          </h1>
          <div className="mt-4 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-lg">
            <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest truncate">{currentUser.lotacao}</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <button onClick={() => setActiveTab('painel')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'painel' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Painel Gestor</span>
          </button>
          <button onClick={() => { setActiveTab('escoltas'); setShowAllDates(false); setSearchTerm(''); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'escoltas' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <CalendarIcon size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Escoltas</span>
          </button>
          <button onClick={() => { setActiveTab('internamentos'); setShowAllDates(false); setSearchTerm(''); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'internamentos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Ambulance size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Internamentos</span>
          </button>
          <button onClick={() => setActiveTab('operacoes')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'operacoes' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Activity size={18} /> <span className="text-sm font-black uppercase tracking-tighter">Operações</span>
          </button>
          <div className="pt-8">
            <button onClick={() => setActiveTab('novo')} className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.98]">
              <PlusCircle size={20} /> Novo Lançamento
            </button>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <button onClick={() => setActiveTab('seguranca')} className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${activeTab === 'seguranca' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Settings size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Meu Perfil</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
            <LogOut size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 md:px-10 py-5 sticky top-0 z-10 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div className="flex items-center gap-6 w-full md:w-auto">
            <h2 className="text-xl font-black text-slate-900 uppercase italic whitespace-nowrap">{activeTab.toUpperCase()}</h2>
            {(activeTab === 'escoltas' || activeTab === 'internamentos' || activeTab === 'operacoes') && (
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                 <input 
                  type="date" 
                  value={viewDate} 
                  onChange={e => { setViewDate(e.target.value); setShowAllDates(false); }} 
                  className={`p-2 border rounded-xl text-xs font-black uppercase outline-none transition-colors ${showAllDates ? 'bg-slate-100 opacity-50' : 'bg-slate-100'}`} 
                 />
                 {showAllDates && (
                   <button 
                    onClick={() => { setShowAllDates(false); setSearchTerm(''); }}
                    className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-all whitespace-nowrap"
                   >
                     Filtro Geral Ativo
                   </button>
                 )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Pesquisar registros da unidade..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-10 pb-20">
          {activeTab === 'painel' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">Bem-vindo, {currentUser.fullName}</h3>
                  <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">{currentUser.lotacao}</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl">
                  <Shield className="text-emerald-500" size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Acesso Liberado</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div onClick={goToEscoltas} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all active:scale-[0.98]">
                  <LayoutDashboard className="text-blue-600 mb-2" size={24} />
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Escoltas Unidade</p>
                  <p className="text-4xl font-black mt-1">{registrosFiltradosPorUnidade.filter(r => r.tipo === 'Escolta Operacional').length}</p>
                </div>
                <div onClick={goToInternamentos} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all active:scale-[0.98]">
                  <Ambulance className="text-emerald-600 mb-2" size={24} />
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Internamentos</p>
                  <p className="text-4xl font-black mt-1">{registrosFiltradosPorUnidade.filter(r => r.tipo === 'Internamento').length}</p>
                </div>
                <div onClick={goToAltoRisco} className="bg-white p-6 rounded-3xl shadow-sm border border-rose-200 flex flex-col items-center cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all active:scale-[0.98]">
                  <ShieldAlert className="text-rose-600 mb-2" size={24} />
                  <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Alto Risco</p>
                  <p className="text-4xl font-black mt-1 text-rose-600">{registrosFiltradosPorUnidade.filter(r => r.risco === 'Alto').length}</p>
                </div>
                <div onClick={goToPendentesHoje} className="bg-blue-600 p-6 rounded-3xl shadow-xl text-white flex flex-col items-center cursor-pointer hover:scale-[1.02] hover:shadow-blue-500/20 transition-all active:scale-[0.98]">
                  <ClipboardCheck className="text-blue-200 mb-2" size={24} />
                  <p className="text-[10px] font-black uppercase text-blue-200 tracking-widest">Pendentes Hoje</p>
                  <p className="text-4xl font-black mt-1">{registrosFiltradosPorUnidade.filter(r => r.status === 'Pendente' && r.dataHora.startsWith(new Date().toISOString().split('T')[0])).length}</p>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'escoltas' || activeTab === 'internamentos') && (
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
              <div className="bg-slate-50/50 px-6 md:px-8 py-3 border-b text-[10px] font-black uppercase text-slate-400 tracking-widest flex justify-between items-center">
                <span>VISTA: <span className="text-blue-600">{showAllDates ? 'HISTÓRICO DA UNIDADE' : 'OPERACIONAL DO DIA'}</span></span>
                {searchTerm && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px]">Filtro Ativo</span>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                    <tr>
                      <th className="px-6 md:px-8 py-4 text-left">Identificação</th>
                      {activeTab === 'internamentos' && <th className="px-6 md:px-8 py-4 text-left">Localização</th>}
                      <th className="px-6 md:px-8 py-4 text-left">Status</th>
                      <th className="px-6 md:px-8 py-4 text-left">Operador</th>
                      <th className="px-6 md:px-8 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filteredBySearchAndDate.filter(r => (activeTab === 'escoltas' ? r.tipo !== 'Internamento' : r.tipo === 'Internamento')).length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-black uppercase tracking-widest opacity-50 italic">Sem registros disponíveis para esta unidade.</td></tr>
                    ) : filteredBySearchAndDate.filter(r => (activeTab === 'escoltas' ? r.tipo !== 'Internamento' : r.tipo === 'Internamento')).map(reg => (
                      <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 md:px-8 py-5">
                          {reg.tipo === 'Operação Externa' ? (
                            <div>
                              <p className="font-bold text-slate-900 uppercase text-xs italic">Op. Externa / Comboio</p>
                              <p className="text-[10px] text-slate-400 uppercase">PARA: {reg.destino} {showAllDates && `(${new Date(reg.dataHora).toLocaleDateString()})`}</p>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900">{reg.nomePreso}</p>
                                {reg.risco === 'Alto' && <span className="bg-rose-100 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Alto Risco</span>}
                              </div>
                              <p className="text-[10px] text-slate-400 uppercase">PRONT: {reg.prontuario || 'N/A'} • {reg.destino}</p>
                            </>
                          )}
                        </td>
                        {activeTab === 'internamentos' && (
                          <td className="px-6 md:px-8 py-5">
                            <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1"><BedDouble size={12}/> {reg.quarto || '-'}</p>
                          </td>
                        )}
                        <td className="px-6 md:px-8 py-5">
                          <select value={reg.status} onChange={e => updateStatus(reg.id, e.target.value as Status)} className="text-[10px] font-black p-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500/20">
                            <option value="Pendente">Pendente</option>
                            <option value="Em Andamento">Em Andamento</option>
                            <option value="Concluído">Concluído</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td className="px-6 md:px-8 py-5">
                          <p className="text-[10px] font-black text-slate-500 uppercase truncate max-w-[100px]" title={reg.createdBy}>{reg.createdBy.split('@')[0]}</p>
                        </td>
                        <td className="px-6 md:px-8 py-5 text-right">
                          <div className="flex justify-end gap-1 md:gap-3">
                            <button onClick={() => setIsEditing(reg)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Editar"><Edit3 size={18} /></button>
                            <button onClick={() => { setSelectedReg(reg); setDetailModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Ver Ficha"><Eye size={18} /></button>
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
              <h3 className="text-3xl font-black mb-8 italic uppercase text-slate-900 border-b pb-4">Lançamento Unidade</h3>
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
                  
                  {newModality !== 'Operação Externa' ? (
                    <>
                      <input name="nomePreso" placeholder="Nome Completo do Preso" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20" />
                      <input name="prontuario" placeholder="Nº Prontuário" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </>
                  ) : (
                    <div className="col-span-1 md:col-span-2 p-5 bg-blue-50 border border-blue-100 rounded-2xl text-[10px] font-black text-blue-700 uppercase italic leading-relaxed">
                      Lançamento de Apoio Estratégico. Identificação nominal ocultada.
                    </div>
                  )}
                  
                  <div className={newModality === 'Internamento' ? 'col-span-1' : 'col-span-1 md:col-span-2'}>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Destino</label>
                    <input name="destino" placeholder="Local de Destino / Hospital" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>

                  {newModality === 'Internamento' && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-blue-600 block mb-2 tracking-widest flex items-center gap-1"><BedDouble size={12}/> Quarto/Leito</label>
                      <input name="quarto" placeholder="Ex: Q. 302 / L. 04" className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Início Programado</label>
                      <input type="datetime-local" name="dataHora" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Relatório Técnico</label>
                      <button type="button" onClick={(e) => suggestObservations(e.currentTarget.closest('form') as HTMLFormElement)} disabled={isGeneratingObs} className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1">
                        {isGeneratingObs ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />} IA
                      </button>
                    </div>
                    <textarea name="observacoes" placeholder="Descreva intercorrências..." className="w-full p-4 bg-slate-50 border rounded-2xl font-medium outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[120px]" rows={4} />
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-[0.98]">Protocolar Lançamento</button>
              </form>
            </div>
          )}

          {activeTab === 'operacoes' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
              <div className="bg-slate-900 p-8 md:p-12 rounded-[40px] text-white shadow-2xl text-center">
                <FileType className="mx-auto mb-4 text-rose-400" size={48} />
                <h3 className="text-2xl font-black mb-6 italic uppercase">Exportação por Unidade</h3>
                
                <div className="max-w-xl mx-auto">
                  <div className="bg-slate-800 p-6 md:p-10 rounded-3xl border border-slate-700 text-center flex flex-col items-center gap-6">
                    <div className="w-full">
                      <h4 className="text-xl font-black uppercase text-rose-400 mb-2">Relatório PDF Oficial</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mx-auto max-w-[300px]">Somente dados da unidade <strong>{currentUser.lotacao}</strong> serão exportados.</p>
                    </div>
                    <div className="w-full space-y-6 pt-6 border-t border-slate-700">
                      <select value={pdfTypeFilter} onChange={(e) => setPdfTypeFilter(e.target.value as PDFFilter)} className="w-full p-4 bg-slate-900 border border-slate-700 rounded-2xl text-sm font-black uppercase outline-none text-white">
                        <option value="Todos">Todas as Modalidades</option>
                        <option value="Escolta Operacional">Apenas Escoltas</option>
                        <option value="Internamento">Apenas Internamentos</option>
                        <option value="Operação Externa">Apenas Apoios Externos</option>
                      </select>
                      <button onClick={handleExportPDF} className="w-full py-5 bg-rose-600 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-rose-500 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                        <FileDown size={20} /> Gerar PDF da Unidade
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="max-w-xl mx-auto space-y-8 animate-in zoom-in duration-500">
              <div className="bg-white rounded-[40px] p-6 md:p-10 border shadow-sm">
                <h3 className="text-xl font-black uppercase mb-8 border-b pb-4">Meu Perfil de Acesso</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 tracking-widest">Nome Funcional</label>
                    <input value={secFullName} onChange={e => setSecFullName(e.target.value)} placeholder="Seu Nome" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Unidade Vinculada (Inalterável)</p>
                    <p className="text-xs font-black text-blue-600 uppercase">{currentUser.lotacao}</p>
                  </div>
                  <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">Alterar Senha</h4>
                    <div className="space-y-4">
                      <input type="password" value={secNewPassword} onChange={e => setSecNewPassword(e.target.value)} placeholder="Nova Senha" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                      <input type="password" value={secConfirmPassword} onChange={e => setSecConfirmPassword(e.target.value)} placeholder="Confirmar" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                    </div>
                  </div>
                  {secStatus && (
                    <div className={`p-4 rounded-2xl text-xs font-bold ${secStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      {secStatus.msg}
                    </div>
                  )}
                  <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl active:scale-[0.98]">Salvar Perfil</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FICHA DE ATENDIMENTO */}
      {detailModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl p-6 md:p-10 flex flex-col relative">
            <button onClick={() => setDetailModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors no-print"><X size={24} /></button>
            <div className="text-center mb-8 border-b pb-6">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Ficha Operacional #{selectedReg.id}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Unidade: {selectedReg.unidadeOrigem}</p>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Custodiado</p>
                  <p className="text-lg font-black text-slate-900 uppercase">{selectedReg.nomePreso}</p>
                  <p className="text-xs font-bold text-slate-500 mt-1">Prontuário: {selectedReg.prontuario}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Destino & Agenda</p>
                  <p className="text-sm font-bold text-slate-800 uppercase">{selectedReg.destino}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Início: {new Date(selectedReg.dataHora).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-3">Relato Técnico</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedReg.observacoes || 'Nenhuma observação informada.'}</p>
              </div>
            </div>
            <button onClick={() => window.print()} className="mt-8 w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase flex items-center justify-center gap-3 no-print active:scale-95"><Printer size={20} /> Imprimir Ficha</button>
          </div>
        </div>
      )}

      {/* EDIÇÃO */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/90 backdrop-blur-xl animate-in zoom-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl p-6 md:p-10 flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h3 className="text-xl font-black uppercase italic">Editar Registro</h3>
              <button onClick={() => setIsEditing(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleEditRegistro} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <select name="tipo" defaultValue={isEditing.tipo} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs uppercase outline-none">
                  <option value="Escolta Operacional">Escolta Operacional</option>
                  <option value="Internamento">Internamento</option>
                  <option value="Operação Externa">Operação Externa</option>
                </select>
                <select name="risco" defaultValue={isEditing.risco} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs uppercase outline-none">
                  <option value="Baixo">Baixo</option>
                  <option value="Médio">Médio</option>
                  <option value="Alto">Alto</option>
                </select>
                {isEditing.tipo !== 'Operação Externa' && (
                  <>
                    <input name="nomePreso" defaultValue={isEditing.nomePreso} placeholder="Preso" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                    <input name="prontuario" defaultValue={isEditing.prontuario} placeholder="Prontuário" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  </>
                )}
                <input name="destino" defaultValue={isEditing.destino} placeholder="Destino" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                <div className="col-span-1 md:col-span-2">
                  <input type="datetime-local" name="dataHora" defaultValue={isEditing.dataHora.slice(0, 16)} required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                </div>
                <div className="col-span-1 md:col-span-2">
                   <textarea name="observacoes" defaultValue={isEditing.observacoes} placeholder="Observações" className="w-full p-4 bg-slate-50 border rounded-2xl font-medium outline-none" rows={3} />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl active:scale-[0.98]">Atualizar</button>
            </form>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-3 bg-white/60 backdrop-blur-md border-t text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic z-10 no-print">
        SGE PPPG • ISOLAMENTO DE DADOS POR UNIDADE • 2026
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .animate-loading-bar { animation: loading-bar 2s infinite ease-in-out; }
        @media print { 
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          aside, header { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; overflow: visible !important; height: auto !important; }
          .fixed { position: static !important; }
          .bg-slate-900\/95 { background: white !important; backdrop-filter: none !important; }
          .rounded-[40px] { border-radius: 0 !important; box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) { createRoot(rootElement).render(<App />); }
