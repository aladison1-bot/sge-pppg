
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Ambulance, 
  Calendar as CalendarIcon, 
  PlusCircle, 
  Search, 
  Trash2, 
  Zap, 
  X, 
  Printer, 
  Loader2, 
  LogIn, 
  LogOut, 
  CheckCircle, 
  Edit3, 
  AlertTriangle, 
  Settings, 
  Activity, 
  Download, 
  Eye, 
  Clock, 
  MapPin, 
  ArrowRightLeft, 
  Users, 
  History, 
  UserCog, 
  Ban, 
  Menu, 
  ChevronDown,
  UserCheck,
  UserX,
  MessageSquareQuote,
  Bell,
  User,
  ShieldCheck,
  FileText,
  Filter,
  Database,
  Wifi,
  Stethoscope,
  Archive,
  Save
} from 'lucide-react';

// --- Types ---
type Status = 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado';
type UserStatus = 'Pending' | 'Authorized' | 'Denied';
type Risco = 'Baixo' | 'Médio' | 'Alto';
type TipoRegistro = 'Escolta Operacional' | 'Internamento' | 'Operação Externa';
type UnidadeEscopo = 'Cadeias Públicas' | 'Setor de Escolta Prisional' | 'Setor de Operações Especiais' | 'Administração Geral';
type UserRole = 'Master' | 'GlobalAdmin' | 'UnitAdmin' | 'Operator';

interface Registro {
  id: string;
  tipo: TipoRegistro;
  nomePreso: string;
  prontuario: string;
  destino: string;
  quarto?: string;
  dataHora: string;
  dataHoraAlta?: string; 
  risco: Risco;
  status: Status;
  observacoes: string;
  unidadeOrigem: UnidadeEscopo;
  createdBy: string;
  createdAt: string;
}

interface UserProfile {
  email: string;
  password?: string;
  isTemporary: boolean;
  isBlocked?: boolean;
  fullName?: string;
  lotacao?: UnidadeEscopo;
  role: UserRole;
  status: UserStatus;
  justification?: string;
  requestedBy?: string;
  requestDate?: string;
  lastSeen?: string; 
}

interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  details: string;
  unidade: string;
  category: 'Segurança' | 'Operacional' | 'Sistema';
}

const INITIAL_DATA: Registro[] = [];

// --- Components ---
const LoadingOverlay = ({ message }: { message: string }) => (
  <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
    <div className="bg-white p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-8 max-w-sm text-center border border-white/20">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
        <ShieldAlert className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={32} />
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

const AuthSystem = ({ onLoginSuccess, registerLog }: { onLoginSuccess: (user: UserProfile) => void, registerLog: (action: string, details: string, cat: AuditLog['category'], unit?: string) => void }) => {
  const [view, setView] = useState<'login' | 'change-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUsers = (): UserProfile[] => {
    const data = localStorage.getItem('sge_users_db_v3');
    if (!data) {
      const defaultUsers: UserProfile[] = [{ 
        email: 'aladison@policiapenal.pr.gov.br', 
        password: 'admin123', 
        isTemporary: false, 
        fullName: 'ALADISON',
        lotacao: 'Administração Geral',
        role: 'Master',
        isBlocked: false,
        status: 'Authorized'
      }];
      localStorage.setItem('sge_users_db_v3', JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(data);
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

      if (user) {
        if (user.isBlocked) {
          setError('Acesso bloqueado pela administração.');
        } else if (user.status === 'Pending') {
          setError('Seu acesso aguarda autorização do Administrador Geral.');
        } else if (user.status === 'Denied') {
          setError(`Acesso negado. Motivo: ${user.justification || 'Não informado'}`);
        } else if (inputPassword === user.password) {
          if (user.isTemporary) {
            setNewFullName(user.fullName || '');
            setView('change-password');
          } else {
            user.lastSeen = new Date().toISOString();
            localStorage.setItem('sge_users_db_v3', JSON.stringify(users));
            registerLog('Login', `Acesso realizado por ${user.email}`, 'Segurança', user.lotacao);
            onLoginSuccess(user);
          }
        } else {
          setError('Senha incorreta.');
        }
      } else {
        setError('E-mail institucional não localizado.');
      }
      setLoading(false);
    }, 800);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.trim() !== confirmPassword.trim()) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.trim().length < 3) {
      setError('Senha muito curta.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const users = getUsers();
      const userIdx = users.findIndex(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (userIdx !== -1) {
        users[userIdx].password = newPassword.trim();
        users[userIdx].isTemporary = false;
        users[userIdx].fullName = newFullName.trim().toUpperCase();
        users[userIdx].lastSeen = new Date().toISOString();
        localStorage.setItem('sge_users_db_v3', JSON.stringify(users));
        onLoginSuccess(users[userIdx]);
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 p-6 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 relative z-10 animate-in zoom-in duration-500 my-auto">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="p-5 bg-slate-900 rounded-[24px] mb-6 shadow-xl shadow-blue-900/20">
            <ShieldAlert className="text-blue-500" size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-950 italic uppercase tracking-tighter leading-none">SGE <span className="text-blue-600">PPPG</span></h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Segurança Pública</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in shake duration-300">
            <Zap size={16} className="shrink-0" /> {error}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Institucional</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm" placeholder="agente@policiapenal.pr.gov.br" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm" placeholder="••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
              Entrar no Sistema
            </button>
          </form>
        )}

        {view === 'change-password' && (
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div className="p-4 bg-blue-50 rounded-2xl mb-4">
              <p className="text-[10px] text-blue-700 font-black uppercase text-center">Alteração Obrigatória de Primeiro Acesso</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Nome Completo</label>
              <input type="text" required value={newFullName} onChange={(e) => setNewFullName(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none text-sm" placeholder="Nome Completo do Servidor" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova Senha" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none text-sm" />
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirme" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none text-sm" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Concluir e Acessar</button>
          </form>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'painel' | 'escoltas' | 'internamentos' | 'concluidas' | 'operacoes' | 'novo' | 'usuarios' | 'solicitacoes' | 'auditoria' | 'backup'>('painel');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [registros, setRegistros] = useState<Registro[]>(() => {
    const saved = localStorage.getItem('sge_data_v1.0_2026');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('sge_audit_logs_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [adminContext, setAdminContext] = useState<UnidadeEscopo>('Administração Geral');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editRecordModalOpen, setEditRecordModalOpen] = useState(false);
  const [altaModalOpen, setAltaModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registro | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUnit, setNewUserUnit] = useState<UnidadeEscopo>('Administração Geral');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Operator');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [validatingUser, setValidatingUser] = useState<{user: UserProfile, type: 'Approve' | 'Deny'} | null>(null);
  const [reportConfig, setReportConfig] = useState<{type: 'Daily' | 'Monthly', date: string}>({type: 'Daily', date: new Date().toISOString().split('T')[0]});

  const registerLog = (action: string, details: string, category: AuditLog['category'], unit?: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      timestamp: new Date().toISOString(),
      userEmail: currentUser?.email || 'Sistema',
      action, details, unidade: unit || currentUser?.lotacao || 'N/A', category
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 500);
      localStorage.setItem('sge_audit_logs_v1', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const heartbeat = () => {
        const data = localStorage.getItem('sge_users_db_v3');
        if (data) {
          const users: UserProfile[] = JSON.parse(data);
          const idx = users.findIndex(u => u.email === currentUser.email);
          if (idx !== -1) {
            users[idx].lastSeen = new Date().toISOString();
            localStorage.setItem('sge_users_db_v3', JSON.stringify(users));
          }
        }
      };
      heartbeat();
      const interval = setInterval(heartbeat, 30000); 
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    const savedAuth = localStorage.getItem('sge_auth_v1');
    if (savedAuth) {
      const usersData = localStorage.getItem('sge_users_db_v3');
      if (usersData) {
        const users: UserProfile[] = JSON.parse(usersData);
        const user = users.find(u => u.email === savedAuth);
        if (user && !user.isBlocked && user.status === 'Authorized') {
          setIsAuthenticated(true);
          setCurrentUser(user);
          setAdminContext(user.lotacao!);
        } else {
          localStorage.removeItem('sge_auth_v1');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'usuarios' || activeTab === 'solicitacoes' || activeTab === 'auditoria' || activeTab === 'backup') {
      const data = localStorage.getItem('sge_users_db_v3');
      if (data) {
        let list: UserProfile[] = JSON.parse(data);
        if (currentUser?.role === 'UnitAdmin') {
          list = list.filter(u => u.lotacao === currentUser.lotacao);
        }
        setUsersList(list);
      }
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    localStorage.setItem('sge_data_v1.0_2026', JSON.stringify(registros));
  }, [registros]);

  const handleLoginSuccess = (user: UserProfile) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    localStorage.setItem('sge_auth_v1', user.email);
    setAdminContext(user.lotacao!);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('sge_auth_v1');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.includes('@policiapenal.pr.gov.br')) return alert("Use o e-mail institucional.");
    const unit = (currentUser?.role === 'Master' || currentUser?.role === 'GlobalAdmin') ? newUserUnit : currentUser!.lotacao!;
    const initialStatus: UserStatus = (currentUser?.role === 'Master') ? 'Authorized' : 'Pending';
    const roleToCreate = (currentUser?.role === 'UnitAdmin' || currentUser?.role === 'GlobalAdmin') ? 'Operator' : newUserRole;
    const newUser: UserProfile = {
      email: newUserEmail.toLowerCase().trim(),
      fullName: newUserName.trim().toUpperCase(),
      lotacao: unit,
      password: 'deppen2026',
      isTemporary: true,
      role: roleToCreate as UserRole,
      isBlocked: false,
      status: initialStatus,
      requestedBy: currentUser?.email,
      requestDate: new Date().toISOString()
    };
    const usersData = localStorage.getItem('sge_users_db_v3');
    const users: UserProfile[] = usersData ? JSON.parse(usersData) : [];
    if (users.find(u => u.email === newUser.email)) return alert("E-mail já cadastrado.");
    users.push(newUser);
    localStorage.setItem('sge_users_db_v3', JSON.stringify(users));
    let list = users;
    if (currentUser?.role === 'UnitAdmin') list = list.filter(u => u.lotacao === currentUser.lotacao);
    setUsersList(list);
    if (initialStatus === 'Pending') {
      registerLog('Solicitação Usuário', `Acesso solicitado para ${newUser.email}`, 'Sistema');
      alert(`Solicitação de acesso enviada para validação do Administrador Geral.`);
    } else {
      registerLog('Criação Usuário', `Usuário ${newUser.email} criado`, 'Sistema');
      alert(`Usuário cadastrado com sucesso.`);
    }
    setNewUserEmail(''); setNewUserName('');
  };

  const handleValidateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatingUser) return;
    const form = e.currentTarget as HTMLFormElement;
    const justification = (form.elements.namedItem('justification') as HTMLTextAreaElement).value;
    if (!justification || justification.length < 5) return alert("Justificativa obrigatória.");
    const usersData = localStorage.getItem('sge_users_db_v3');
    const users: UserProfile[] = JSON.parse(usersData || '[]');
    const idx = users.findIndex(u => u.email === validatingUser.user.email);
    if (idx !== -1) {
      users[idx].status = validatingUser.type === 'Approve' ? 'Authorized' : 'Denied';
      users[idx].justification = justification;
      localStorage.setItem('sge_users_db_v3', JSON.stringify(users));
      setUsersList(users);
      registerLog('Validação Acesso', `Usuário ${users[idx].email} ${users[idx].status}`, 'Segurança');
      setValidatingUser(null);
    }
  };

  const handleMasterEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (editingUser.email === 'aladison@policiapenal.pr.gov.br') return alert("O Administrador Geral não pode ser editado.");
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const usersData = localStorage.getItem('sge_users_db_v3');
    const users: UserProfile[] = JSON.parse(usersData || '[]');
    const idx = users.findIndex(u => u.email === editingUser.email);
    if (idx !== -1) {
      users[idx].lotacao = formData.get('editLotacao') as UnidadeEscopo;
      users[idx].fullName = (formData.get('editFullName') as string).toUpperCase();
      users[idx].role = formData.get('editRole') as UserRole;
      localStorage.setItem('sge_users_db_v3', JSON.stringify(users));
      setUsersList(users);
      registerLog('Edição Usuário', `Usuário ${editingUser.email} atualizado`, 'Sistema');
      setEditingUser(null);
    }
  };

  const toggleBlockUser = (email: string) => {
    if (email === 'aladison@policiapenal.pr.gov.br') return alert("O Administrador Geral não pode ser bloqueado.");
    const usersData = localStorage.getItem('sge_users_db_v3');
    const users: UserProfile[] = JSON.parse(usersData || '[]');
    const idx = users.findIndex(u => u.email === email);
    if (idx !== -1) {
      if (users[idx].role === 'Master') return alert("Administradores Gerais não podem ser bloqueados.");
      users[idx].isBlocked = !users[idx].isBlocked;
      localStorage.setItem('sge_users_db_v3', JSON.stringify(users));
      setUsersList(users);
    }
  };

  const handlePurgeData = (scope: UnidadeEscopo | 'Global') => {
    if (confirm("Deseja APAGAR os dados permanentemente? Verifique se realizou o BACKUP antes.")) {
      setIsActionLoading(true);
      setTimeout(() => {
        if (scope === 'Global') setRegistros([]);
        else setRegistros(prev => prev.filter(r => r.unidadeOrigem !== scope));
        registerLog('Purga de Dados', `Expurgo ${scope} realizado`, 'Sistema');
        setIsActionLoading(false);
        alert("Manutenção concluída.");
      }, 1000);
    }
  };

  const handleDownloadBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(registros));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const fileName = `sge_pppg_backup_${new Date().toISOString().split('T')[0]}.json`;
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    registerLog('Backup', 'Backup manual de dados realizado', 'Sistema');
    alert("Arquivo de backup gerado com sucesso.");
  };

  const [formTipo, setFormTipo] = useState<TipoRegistro>('Escolta Operacional');

  const handleAddRegistro = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tipo = formData.get('tipo') as TipoRegistro;
    const unidadeDestino = (currentUser?.role === 'Master' || currentUser?.role === 'GlobalAdmin') 
      ? adminContext 
      : currentUser!.lotacao!;
    const novo: Registro = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      tipo,
      nomePreso: tipo === 'Operação Externa' ? 'OPERACIONAL EXTERNO' : (formData.get('nomePreso') as string),
      prontuario: tipo === 'Operação Externa' ? '-' : (formData.get('prontuario') as string || ''),
      destino: formData.get('destino') as string,
      quarto: tipo === 'Internamento' ? (formData.get('quarto') as string) : undefined,
      dataHora: formData.get('dataHora') as string,
      risco: formData.get('risco') as Risco,
      status: 'Pendente',
      observacoes: formData.get('observacoes') as string || '',
      unidadeOrigem: unidadeDestino,
      createdBy: currentUser!.email,
      createdAt: new Date().toISOString()
    };
    setIsActionLoading(true);
    setTimeout(() => {
        setRegistros(prev => [novo, ...prev]);
        registerLog('Novo Registro', `Protocolo ${novo.id} criado`, 'Operacional', novo.unidadeOrigem);
        setIsActionLoading(false);
        setActiveTab(tipo === 'Internamento' ? 'internamentos' : 'escoltas');
        e.currentTarget.reset();
        setFormTipo('Escolta Operacional');
    }, 500);
  };

  const handleEditRegistro = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedReg) return;
    const formData = new FormData(e.currentTarget);
    const updated = registros.map(r => {
      if (r.id === selectedReg.id) {
        return {
          ...r,
          nomePreso: r.tipo === 'Operação Externa' ? 'OPERACIONAL EXTERNO' : (formData.get('nomePreso') as string),
          prontuario: r.tipo === 'Operação Externa' ? '-' : (formData.get('prontuario') as string),
          destino: formData.get('destino') as string,
          quarto: r.tipo === 'Internamento' ? (formData.get('quarto') as string) : undefined,
          dataHora: formData.get('dataHora') as string,
          risco: formData.get('risco') as Risco,
          status: formData.get('status') as Status,
          observacoes: formData.get('observacoes') as string
        };
      }
      return r;
    });
    setRegistros(updated);
    registerLog('Edição Registro', `Protocolo ${selectedReg.id} editado`, 'Operacional');
    setEditRecordModalOpen(false);
  };

  const handleDarAlta = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedReg) return;
    const formData = new FormData(e.currentTarget);
    const dataHoraAlta = formData.get('dataHoraAlta') as string;
    
    const updated = registros.map(r => {
      if (r.id === selectedReg.id) {
        return {
          ...r,
          status: 'Concluído' as Status,
          dataHoraAlta
        };
      }
      return r;
    });
    setRegistros(updated);
    registerLog('Alta Hospitalar', `Alta concedida para protocolo ${selectedReg.id}`, 'Operacional');
    setAltaModalOpen(false);
    alert("Alta hospitalar registrada. O registro foi movido para o painel de concluídas.");
  };

  const handleDeleteRegistro = (id: string) => {
    if (confirm("Excluir permanentemente?")) {
      setRegistros(prev => prev.filter(r => r.id !== id));
      registerLog('Exclusão Registro', `Protocolo ${id} removido`, 'Operacional');
    }
  };

  const registrosExibiveis = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Master' || currentUser.role === 'GlobalAdmin') {
      return registros.filter(r => r.unidadeOrigem === adminContext);
    }
    return registros.filter(r => r.unidadeOrigem === currentUser.lotacao);
  }, [registros, currentUser, adminContext]);

  const filteredRegistros = useMemo(() => {
    return registrosExibiveis.filter(r => {
      const lowerSearch = searchTerm.toLowerCase();
      const matchSearch = r.nomePreso.toLowerCase().includes(lowerSearch) || 
                          r.prontuario.toLowerCase().includes(lowerSearch) ||
                          r.destino.toLowerCase().includes(lowerSearch);
      const matchDate = searchDate === '' || r.dataHora.startsWith(searchDate);
      return matchSearch && matchDate;
    });
  }, [registrosExibiveis, searchTerm, searchDate]);

  const activeUsers = useMemo(() => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
    return usersList.filter(u => u.lastSeen && new Date(u.lastSeen) > fiveMinutesAgo);
  }, [usersList]);

  const pendingRequestsCount = useMemo(() => usersList.filter(u => u.status === 'Pending').length, [usersList]);

  const sectorAdmin = useMemo(() => {
    return usersList.find(u => u.lotacao === adminContext && (u.role === 'UnitAdmin' || u.role === 'GlobalAdmin' || u.role === 'Master'))?.fullName || 'NÃO DESIGNADO';
  }, [usersList, adminContext]);

  const isMaster = currentUser?.role === 'Master';
  const isGlobalAdmin = currentUser?.role === 'GlobalAdmin';
  const isUnitAdmin = currentUser?.role === 'UnitAdmin';
  const isIntermediary = isGlobalAdmin || isUnitAdmin;

  const navigateToDate = (date: string, tab: any) => {
    setSearchDate(date);
    setActiveTab(tab);
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'Master': return 'Administrador Geral';
      case 'GlobalAdmin': return 'Administrador Intermediário';
      case 'UnitAdmin': return 'Administrador de Unidade';
      case 'Operator': return 'Operador';
      default: return role;
    }
  };

  const generatePDFReport = () => window.print();

  if (!isAuthenticated || !currentUser) return <AuthSystem onLoginSuccess={handleLoginSuccess} registerLog={registerLog} />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {isActionLoading && <LoadingOverlay message="Processando..." />}
      
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex flex-col shadow-2xl z-20 transition-all duration-300 no-print`}>
        <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex flex-col items-center relative min-h-[220px] justify-center">
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-all"><Menu size={20} /></button>
          <div className="mb-2"><ShieldAlert className="text-blue-500" size={isSidebarCollapsed ? 32 : 44} /></div>
          {!isSidebarCollapsed && (
            <div className="text-center animate-in fade-in zoom-in duration-300 w-full px-4">
              <h1 className="text-2xl font-black italic uppercase leading-none mb-4 tracking-tighter">SGE <span className="text-blue-500">PPPG</span></h1>
              <div className="mt-3 bg-blue-600/10 border border-blue-500/20 rounded-xl overflow-hidden">
                <div className="p-1 bg-blue-600/20 text-[7px] font-black uppercase text-blue-400 tracking-widest text-center">Unidade Ativa</div>
                {(isMaster || isGlobalAdmin) ? (
                  <div className="relative group">
                    <select value={adminContext} onChange={(e) => setAdminContext(e.target.value as any)} className="w-full bg-transparent text-[10px] font-black uppercase text-white p-3 pr-8 outline-none cursor-pointer appearance-none text-center">
                      <option value="Administração Geral" className="text-slate-900">Adm. Geral</option>
                      <option value="Cadeias Públicas" className="text-slate-900">Cadeias Públicas</option>
                      <option value="Setor de Escolta Prisional" className="text-slate-900">Escolta Prisional</option>
                      <option value="Setor de Operações Especiais" className="text-slate-900">SOE</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                  </div>
                ) : <div className="p-3 text-[10px] font-black uppercase text-white text-center leading-tight">{currentUser?.lotacao}</div>}
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <button onClick={() => setActiveTab('painel')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'painel' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Painel</span>}</button>
          
          <button onClick={() => setActiveTab('escoltas')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'escoltas' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><CalendarIcon size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Escoltas Ativas</span>}</button>
          
          <button onClick={() => setActiveTab('internamentos')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'internamentos' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><Ambulance size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Internamentos</span>}</button>
          
          <button onClick={() => setActiveTab('concluidas')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'concluidas' ? 'bg-emerald-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><Archive size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Concluídas</span>}</button>

          <button onClick={() => setActiveTab('operacoes')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'operacoes' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><FileText size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Relatórios</span>}</button>
          
          {(isMaster || isIntermediary) && <button onClick={() => setActiveTab('usuarios')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'usuarios' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><Users size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Usuários</span>}</button>}
          
          {isMaster && (
            <><button onClick={() => setActiveTab('solicitacoes')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all relative ${activeTab === 'solicitacoes' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><Bell size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Solicitações</span>}{pendingRequestsCount > 0 && <span className="absolute top-2 right-2 bg-rose-500 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-pulse">{pendingRequestsCount}</span>}</button>
              <button onClick={() => setActiveTab('auditoria')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'auditoria' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><History size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Auditoria</span>}</button>
              <button onClick={() => setActiveTab('backup')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'backup' ? 'bg-amber-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}><Database size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Backup</span>}</button></>
          )}
          <div className="pt-6 border-t border-slate-800/50"><button onClick={() => setActiveTab('novo')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-xl`}><PlusCircle size={20} /> {!isSidebarCollapsed && <span>Novo Registro</span>}</button></div>
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"><LogOut size={18} /> {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase">Sair</span>}</button></div>
      </aside>

      <main className="flex-1 overflow-y-auto print-container">
        <header className="bg-white/80 backdrop-blur-xl border-b px-8 py-5 sticky top-0 z-10 flex justify-between items-center no-print">
          <div className="flex items-center gap-4"><h2 className="text-xl font-black text-slate-900 uppercase italic">{activeTab.toUpperCase()}</h2></div>
          <div className="flex items-center gap-4 w-full max-w-xl">
            <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" /></div>
            <div className="relative"><input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" /><Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />{searchDate && <button onClick={() => setSearchDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 hover:bg-rose-50 rounded-full p-0.5"><X size={12} /></button>}</div>
          </div>
        </header>

        <div className="p-6 md:p-12">
          {activeTab === 'painel' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <button onClick={() => setActiveTab('escoltas')} className="bg-white p-8 rounded-[32px] border text-left hover:shadow-lg transition-all group"><CalendarIcon className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" size={24} /><p className="text-[10px] font-black uppercase text-slate-400">Escoltas Hoje</p><p className="text-4xl font-black">{registrosExibiveis.filter(r => r.tipo === 'Escolta Operacional' && r.status !== 'Concluído' && r.dataHora.startsWith(new Date().toISOString().split('T')[0])).length}</p></button>
                <button onClick={() => setActiveTab('internamentos')} className="bg-white p-8 rounded-[32px] border text-left hover:shadow-lg transition-all group"><Ambulance className="text-emerald-600 mb-2 group-hover:scale-110 transition-transform" size={24} /><p className="text-[10px] font-black uppercase text-slate-400">Internamentos Ativos</p><p className="text-4xl font-black">{registrosExibiveis.filter(r => r.tipo === 'Internamento' && !r.dataHoraAlta).length}</p></button>
                <div className="bg-rose-600 p-8 rounded-[32px] text-white shadow-xl shadow-rose-600/20"><ShieldAlert className="mb-2" size={24} /><p className="text-[10px] font-black uppercase text-rose-200">Risco Alto Monitorado</p><p className="text-4xl font-black">{registrosExibiveis.filter(r => r.risco === 'Alto' && r.status !== 'Concluído').length}</p></div>
                <div className="bg-emerald-600 p-8 rounded-[32px] text-white shadow-xl shadow-emerald-600/20"><Archive className="mb-2" size={24} /><p className="text-[10px] font-black uppercase text-emerald-200">Total Concluídas</p><p className="text-4xl font-black">{registrosExibiveis.filter(r => r.status === 'Concluído' || !!r.dataHoraAlta).length}</p></div>
              </div>
              <div className="bg-white rounded-[40px] border p-10 shadow-sm"><h3 className="text-xl font-black uppercase italic mb-8 flex items-center gap-3"><Zap className="text-amber-500" /> Atividades Pendentes/Hoje</h3>
                <div className="grid grid-cols-1 gap-4">
                  {registrosExibiveis.filter(r => r.status !== 'Concluído' && !r.dataHoraAlta).sort((a,b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()).slice(0, 5).map(r => (
                    <div key={r.id} onClick={() => navigateToDate(r.dataHora.split('T')[0], r.tipo === 'Internamento' ? 'internamentos' : 'escoltas')} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-transparent hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group">
                      <div className="flex items-center gap-6"><div className={`p-4 rounded-2xl ${r.tipo === 'Internamento' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{r.tipo === 'Internamento' ? <Ambulance size={20} /> : <CalendarIcon size={20} />}</div>
                        <div><p className="font-black uppercase text-slate-900 group-hover:text-blue-700 transition-colors">{r.nomePreso}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{r.destino} • {r.unidadeOrigem}</p></div></div>
                      <div className="text-right"><p className="text-sm font-black text-slate-900">{new Date(r.dataHora).toLocaleDateString('pt-BR')}</p><p className="text-[10px] font-bold text-blue-600 uppercase">{new Date(r.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} HRS</p></div></div>))}
                  {registrosExibiveis.filter(r => r.status !== 'Concluído' && !r.dataHoraAlta).length === 0 && <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs italic">Nenhuma atividade ativa no momento</div>}
                </div></div></div>
          )}

          {(activeTab === 'escoltas' || activeTab === 'internamentos' || activeTab === 'concluidas') && (
            <div className="bg-white rounded-[32px] border overflow-hidden shadow-sm animate-in fade-in duration-500">
              <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-tighter italic">
                  {activeTab === 'escoltas' ? 'Escoltas Ativas de Hoje' : activeTab === 'internamentos' ? 'Internamentos Ativos' : 'Arquivo de Concluídas'}
                </h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr><th className="px-8 py-5 text-left">Custodiado / Protocolo</th><th className="px-8 py-5 text-left">Tipo / Destino</th><th className="px-8 py-5 text-left">Status / Datas</th><th className="px-8 py-5 text-left">Unidade</th><th className="px-8 py-5 text-right no-print">Ações</th></tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRegistros.filter(r => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    if (activeTab === 'escoltas') {
                      return r.tipo !== 'Internamento' && r.status !== 'Concluído' && r.dataHora.startsWith(todayStr);
                    } else if (activeTab === 'internamentos') {
                      return r.tipo === 'Internamento' && !r.dataHoraAlta;
                    } else { // concluidas
                      return r.status === 'Concluído' || !!r.dataHoraAlta;
                    }
                  }).map(reg => (
                    <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5"><p className="font-bold uppercase text-slate-900">{reg.nomePreso}</p><p className="text-[10px] text-slate-400 font-bold">{reg.prontuario}</p></td>
                      <td className="px-8 py-5"><p className="uppercase font-medium text-slate-700">{reg.destino}</p><p className="text-[9px] font-black text-blue-600 uppercase">{reg.tipo}</p></td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[9px] w-fit font-black px-2 py-0.5 rounded-full ${reg.status === 'Concluído' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{reg.status.toUpperCase()}</span>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">IN: {new Date(reg.dataHora).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</p>
                          {reg.dataHoraAlta && <p className="text-[9px] font-black text-emerald-600 uppercase">ALTA: {new Date(reg.dataHoraAlta).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</p>}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-[10px] font-bold uppercase text-slate-400">{reg.unidadeOrigem}</td>
                      <td className="px-8 py-5 text-right flex justify-end gap-1 no-print">
                        <button onClick={() => { setSelectedReg(reg); setDetailModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl" title="Visualizar"><Eye size={18} /></button>
                        {activeTab === 'internamentos' && !reg.dataHoraAlta && (
                          <button onClick={() => { setSelectedReg(reg); setAltaModalOpen(true); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl" title="Dar Alta"><Stethoscope size={18} /></button>
                        )}
                        {isMaster && (
                          <><button onClick={() => { setSelectedReg(reg); setEditRecordModalOpen(true); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl" title="Editar"><Edit3 size={18} /></button>
                            <button onClick={() => handleDeleteRegistro(reg.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl" title="Excluir"><Trash2 size={18} /></button></>
                        )}
                      </td></tr>))}
                </tbody>
              </table>
              {filteredRegistros.filter(r => {
                const todayStr = new Date().toISOString().split('T')[0];
                if (activeTab === 'escoltas') return r.tipo !== 'Internamento' && r.status !== 'Concluído' && r.dataHora.startsWith(todayStr);
                if (activeTab === 'internamentos') return r.tipo === 'Internamento' && !r.dataHoraAlta;
                return r.status === 'Concluído' || !!r.dataHoraAlta;
              }).length === 0 && <div className="py-12 text-center text-slate-300 font-black uppercase text-xs">Nenhum registro nesta categoria</div>}
            </div>
          )}

          {activeTab === 'backup' && isMaster && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="bg-white rounded-[40px] p-12 border shadow-2xl space-y-10">
                <div className="flex items-center gap-4 text-amber-600 border-b pb-6">
                  <Database size={40} />
                  <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Gerenciamento de Backup e Manutenção</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase">Rotina de conservação do banco de dados institucional</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-200 space-y-6">
                    <div className="flex items-center gap-3">
                      <Save className="text-blue-600" />
                      <h4 className="font-black uppercase italic">Backup de Segurança</h4>
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed uppercase tracking-wider">Gere um arquivo .JSON contendo todos os registros atuais para armazenamento offline e segurança institucional.</p>
                    <button onClick={handleDownloadBackup} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl">
                      <Download size={18} /> Exportar Banco de Dados
                    </button>
                  </div>

                  <div className="p-8 bg-rose-50 rounded-[32px] border border-rose-100 space-y-6">
                    <div className="flex items-center gap-3 text-rose-600">
                      <Trash2 />
                      <h4 className="font-black uppercase italic">Limpeza Periódica</h4>
                    </div>
                    <p className="text-[11px] font-bold text-rose-400 leading-relaxed uppercase tracking-wider">RECOMENDAÇÃO: Realizar trimestralmente após o backup para manter a performance do sistema.</p>
                    <div className="grid grid-cols-1 gap-2">
                      <button onClick={() => handlePurgeData('Global')} className="py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-rose-700">Expurgo Total</button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-8 rounded-[32px] border border-blue-100 flex items-start gap-4">
                  <AlertTriangle className="text-blue-600 shrink-0" size={24} />
                  <div>
                    <p className="text-sm font-black text-blue-900 uppercase italic mb-1">Atenção Administrador</p>
                    <p className="text-[11px] font-bold text-blue-700 uppercase leading-relaxed tracking-wider">
                      O expurgo de dados é IRREVERSÍVEL. Certifique-se de que o arquivo de backup foi baixado e verificado antes de proceder com a limpeza trimestral.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'operacoes' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
               <div className="bg-white rounded-[40px] p-12 border shadow-2xl"><h3 className="text-2xl font-black uppercase italic mb-8 border-b pb-4 flex items-center gap-3"><FileText className="text-blue-600" size={28} /> Central de Relatórios</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="p-8 bg-slate-50 rounded-3xl border space-y-6">
                        <div className="flex items-center gap-4 mb-2"><div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><CalendarIcon size={24}/></div><h4 className="font-black uppercase italic">Relatório Diário</h4></div>
                        <input type="date" value={reportConfig.date} onChange={e => setReportConfig({...reportConfig, date: e.target.value})} className="w-full p-4 border rounded-2xl font-bold outline-none" />
                        <button onClick={() => { setReportConfig({...reportConfig, type: 'Daily'}); setTimeout(generatePDFReport, 100); }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3"><Download size={18} /> Gerar PDF Diário</button>
                     </div>
                     <div className="p-8 bg-slate-50 rounded-3xl border space-y-6">
                        <div className="flex items-center gap-4 mb-2"><div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Activity size={24}/></div><h4 className="font-black uppercase italic">Relatório Mensal</h4></div>
                        <input type="month" value={reportConfig.date.substring(0,7)} onChange={e => setReportConfig({...reportConfig, date: e.target.value + "-01"})} className="w-full p-4 border rounded-2xl font-bold outline-none" />
                        <button onClick={() => { setReportConfig({...reportConfig, type: 'Monthly'}); setTimeout(generatePDFReport, 100); }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3"><Download size={18} /> Gerar PDF Mensal</button>
                     </div>
                  </div></div>
               <div className="hidden print:block fixed inset-0 bg-white z-[100] p-10 overflow-y-auto">
                  <div className="flex justify-between items-start mb-10 border-b-4 border-slate-900 pb-8"><div><h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">SGE PPPG <span className="text-blue-600">RELATÓRIO</span></h1><p className="text-lg font-bold text-slate-500 uppercase">{reportConfig.type === 'Daily' ? 'Consolidado Diário' : 'Consolidado Mensal'}</p></div><div className="text-right"><p className="text-sm font-black uppercase">Referência</p><p className="text-2xl font-black text-blue-600 uppercase">{reportConfig.type === 'Daily' ? new Date(reportConfig.date).toLocaleDateString('pt-BR') : new Date(reportConfig.date).toLocaleDateString('pt-BR', {month:'long', year:'numeric'})}</p></div></div>
                  <div className="space-y-8"><div className="grid grid-cols-3 gap-6 text-center"><div className="p-6 bg-slate-50 border rounded-3xl"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Escoltas</p><p className="text-4xl font-black">{registrosExibiveis.filter(r => (reportConfig.type === 'Daily' ? r.dataHora.startsWith(reportConfig.date) : r.dataHora.startsWith(reportConfig.date.substring(0,7))) && r.tipo === 'Escolta Operacional').length}</p></div><div className="p-6 bg-slate-50 border rounded-3xl"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Internamentos</p><p className="text-4xl font-black">{registrosExibiveis.filter(r => (reportConfig.type === 'Daily' ? r.dataHora.startsWith(reportConfig.date) : r.dataHora.startsWith(reportConfig.date.substring(0,7))) && r.tipo === 'Internamento').length}</p></div><div className="p-6 bg-slate-50 border rounded-3xl"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Operações</p><p className="text-4xl font-black">{registrosExibiveis.filter(r => (reportConfig.type === 'Daily' ? r.dataHora.startsWith(reportConfig.date) : r.dataHora.startsWith(reportConfig.date.substring(0,7))) && r.tipo === 'Operação Externa').length}</p></div></div>
                     <table className="w-full text-xs"><thead className="bg-slate-900 text-white uppercase"><tr><th className="p-4 text-left">Protocolo</th><th className="p-4 text-left">Tipo</th><th className="p-4 text-left">Horário</th><th className="p-4 text-left">Destino</th><th className="p-4 text-left">Status</th></tr></thead>
                        <tbody className="divide-y border">{registrosExibiveis.filter(r => reportConfig.type === 'Daily' ? r.dataHora.startsWith(reportConfig.date) : r.dataHora.startsWith(reportConfig.date.substring(0,7))).map(r => (<tr key={r.id}><td className="p-4 font-bold uppercase">{r.nomePreso}</td><td className="p-4 uppercase">{r.tipo}</td><td className="p-4 font-black text-blue-600">{new Date(r.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</td><td className="p-4 uppercase">{r.destino}</td><td className="p-4 font-black uppercase">{r.status}</td></tr>))}</tbody></table>
                     <div className="mt-20 grid grid-cols-2 gap-20"><div className="text-center border-t-2 border-slate-900 pt-4 px-10"><p className="text-xs font-black uppercase">{currentUser?.fullName}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Emissor</p></div><div className="text-center border-t-2 border-slate-900 pt-4 px-10"><p className="text-xs font-black uppercase">{sectorAdmin}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Administrador</p></div></div></div>
               </div></div>
          )}

          {activeTab === 'novo' && (
            <div className="max-w-4xl mx-auto bg-white rounded-[40px] p-12 border shadow-2xl animate-in zoom-in duration-500">
              <h3 className="text-2xl font-black uppercase italic mb-8 border-b pb-4 flex items-center gap-3"><PlusCircle className="text-blue-600" size={28} /> Novo Protocolo Institucional</h3>
              <form onSubmit={handleAddRegistro} className="space-y-6"><div className="grid grid-cols-2 gap-6"><div className="col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Tipo de Evento</label><select name="tipo" value={formTipo} onChange={e => setFormTipo(e.target.value as TipoRegistro)} className="w-full p-4 bg-slate-50 border rounded-2xl font-black uppercase text-xs outline-none"><option value="Escolta Operacional">Escolta Operacional</option><option value="Internamento">Internamento Hospitalar</option><option value="Operação Externa">Operação Externa</option></select></div>
                  {formTipo !== 'Operação Externa' && (<><div className="col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Nome do Custodiado</label><input name="nomePreso" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold uppercase outline-none" /></div><div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Prontuário</label><input name="prontuario" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold uppercase outline-none" /></div></>)}
                  <div className={`${formTipo === 'Operação Externa' ? 'col-span-2' : ''} space-y-1`}><label className="text-[10px] font-black uppercase text-slate-400">Risco</label><select name="risco" className="w-full p-4 bg-slate-50 border rounded-2xl font-black uppercase text-xs outline-none"><option value="Baixo">Baixo</option><option value="Médio">Médio</option><option value="Alto">Alto</option></select></div>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Destino</label><input name="destino" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold uppercase outline-none" /></div>
                  {formTipo === 'Internamento' && (<div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Quarto</label><input name="quarto" required className="w-full p-4 bg-slate-50 border rounded-2xl font-black uppercase outline-none" /></div>)}
                  <div className="col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Data e Hora</label><input type="datetime-local" name="dataHora" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" /></div>
                  <div className="col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Observações</label><textarea name="observacoes" className="w-full p-5 bg-slate-50 border rounded-3xl min-h-[140px] focus:ring-4 focus:ring-blue-500/10 outline-none font-medium" /></div></div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all">Protocolar Registro</button></form></div>
          )}

          {activeTab === 'auditoria' && isMaster && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="bg-white rounded-[32px] border p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8"><h3 className="text-lg font-black uppercase italic flex items-center gap-2"><Wifi className="text-emerald-500 animate-pulse" /> Operadores Online</h3><span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{activeUsers.length} Ativo(s)</span></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{activeUsers.map(u => (<div key={u.email} className="p-4 bg-slate-50 border rounded-2xl flex items-center gap-4"><div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-xs uppercase">{u.fullName?.charAt(0)}</div><div><p className="font-black text-xs uppercase text-slate-900 leading-none mb-1">{u.fullName}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{u.lotacao}</p></div></div>))}</div></div>
               <div className="bg-white rounded-[32px] border overflow-hidden shadow-sm">
                 <div className="p-8 border-b bg-slate-50/50"><h3 className="text-lg font-black uppercase italic flex items-center gap-2"><History className="text-blue-600" /> Registro de Auditoria</h3></div>
                 <div className="overflow-x-auto max-h-[400px] custom-scrollbar"><table className="w-full text-sm"><thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase sticky top-0 z-10"><tr><th className="px-8 py-4 text-left">Horário</th><th className="px-8 py-4 text-left">Usuário</th><th className="px-8 py-4 text-left">Ação</th><th className="px-8 py-4 text-left">Detalhes</th></tr></thead>
                    <tbody className="divide-y">{auditLogs.map(log => (<tr key={log.id} className="hover:bg-slate-50/30 transition-colors"><td className="px-8 py-4 text-[10px] font-bold text-slate-500">{new Date(log.timestamp).toLocaleString('pt-BR')}</td><td className="px-8 py-4 font-bold text-slate-700">{log.userEmail}</td><td className="px-8 py-4 uppercase font-black text-slate-900 text-[10px]">{log.action}</td><td className="px-8 py-4 text-xs italic text-slate-500">{log.details}</td></tr>))}</tbody></table></div></div>
            </div>
          )}

          {activeTab === 'solicitacoes' && isMaster && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-500"><div className="bg-white rounded-[40px] p-12 border shadow-2xl"><h3 className="text-2xl font-black uppercase italic mb-8 border-b pb-4 flex items-center gap-3"><UserCheck className="text-blue-600" size={28} /> Validação de Acessos</h3>
                <div className="space-y-4">{usersList.filter(u => u.status === 'Pending').map(u => (<div key={u.email} className="p-6 bg-slate-50 rounded-3xl border flex items-center justify-between"><div><p className="font-black text-slate-900 uppercase">{u.fullName}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{u.email} • {u.lotacao}</p></div>
                        <div className="flex gap-2"><button onClick={() => setValidatingUser({user: u, type: 'Approve'})} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[9px] flex items-center gap-2"><CheckCircle size={14}/> Autorizar</button><button onClick={() => setValidatingUser({user: u, type: 'Deny'})} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-black uppercase text-[9px] flex items-center gap-2"><Ban size={14}/> Negar</button></div></div>))}
                  {usersList.filter(u => u.status === 'Pending').length === 0 && <div className="text-center py-20 text-slate-300 font-black uppercase text-xs italic">Sem solicitações</div>}</div></div></div>
          )}

          {activeTab === 'usuarios' && (
            <div className="bg-white rounded-[40px] p-12 border shadow-2xl animate-in fade-in duration-500"><h3 className="text-2xl font-black uppercase italic mb-8 border-b pb-4 flex items-center gap-3"><Users className="text-blue-600" size={28} /> Gestão de Usuários</h3>
                <form onSubmit={handleAddUser} className="space-y-6 mb-12 bg-slate-50 p-8 rounded-3xl border"><div className="grid grid-cols-2 gap-6"><input type="text" placeholder="NOME COMPLETO" value={newUserName} onChange={e => setNewUserName(e.target.value)} required className="p-4 rounded-2xl border font-bold text-sm uppercase outline-none focus:ring-4 focus:ring-blue-500/10" /><input type="email" placeholder="E-MAIL INSTITUCIONAL" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required className="p-4 rounded-2xl border font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10" />
                    {isMaster ? (<><select value={newUserUnit} onChange={e => setNewUserUnit(e.target.value as any)} className="p-4 rounded-2xl border font-black text-[10px] uppercase outline-none"><option value="Administração Geral">Administração Geral</option><option value="Cadeias Públicas">Cadeias Públicas</option><option value="Setor de Escolta Prisional">Escolta Prisional</option><option value="Setor de Operações Especiais">SOE</option></select><select value={newUserRole} onChange={e => setNewUserRole(e.target.value as any)} className="p-4 rounded-2xl border font-black text-[10px] uppercase outline-none"><option value="Operator">Operador</option><option value="UnitAdmin">Administrador de Unidade</option><option value="GlobalAdmin">Administrador Intermediário</option></select></>) : <div className="col-span-2 text-[10px] font-black uppercase text-blue-600 bg-blue-50 p-3 rounded-xl border text-center">Requer autorização Master.</div>}</div><button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"><PlusCircle size={18} /> Cadastrar Servidor</button></form>
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-[10px] font-black text-slate-400 uppercase text-left border-b"><tr><th className="px-4 py-3">Servidor</th><th className="px-4 py-3">Lotação</th><th className="px-4 py-3">Perfil</th><th className="px-4 py-3">Atividade</th><th className="px-4 py-3 text-right">Ações</th></tr></thead>
                <tbody className="divide-y">{usersList.map(u => (<tr key={u.email} className={`${u.isBlocked ? 'opacity-50 grayscale' : ''} hover:bg-slate-50 transition-colors`}><td className="px-4 py-4"><p className="font-bold uppercase text-slate-900">{u.fullName}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{u.email}</p></td><td className="px-4 py-4 text-[10px] font-black uppercase text-slate-500">{u.lotacao}</td><td className="px-4 py-4 text-[10px] font-bold text-slate-600">{getRoleLabel(u.role)}</td><td className="px-4 py-4"><span className={`text-[10px] font-black uppercase italic ${u.lastSeen && new Date(u.lastSeen) > new Date(Date.now() - 5 * 60000) ? 'text-emerald-500' : 'text-slate-300'}`}>{u.lastSeen && new Date(u.lastSeen) > new Date(Date.now() - 5 * 60000) ? '● Online' : 'Offline'}</span></td>
                    <td className="px-4 py-4 text-right flex justify-end gap-1">
                      {(isMaster && u.email !== 'aladison@policiapenal.pr.gov.br') && <button onClick={() => setEditingUser(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl" title="Configurar"><UserCog size={18}/></button>}
                      {(u.email !== 'aladison@policiapenal.pr.gov.br') && <button onClick={() => toggleBlockUser(u.email)} className={`p-2 rounded-xl transition-all ${u.isBlocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-500 hover:bg-amber-50'}`} title={u.isBlocked ? "Ativar" : "Bloquear"}>{u.isBlocked ? <CheckCircle size={18}/> : <Ban size={18} />}</button>}
                      {(isMaster && u.email !== 'aladison@policiapenal.pr.gov.br') && <button onClick={() => { confirm('Remover acesso?') && setUsersList(prev => prev.filter(x => x.email !== u.email)) }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl" title="Excluir"><Trash2 size={18}/></button>}
                    </td></tr>))}</tbody></table></div></div>
          )}
        </div>
      </main>

      {/* MODAL ALTA HOSPITALAR */}
      {altaModalOpen && selectedReg && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-in zoom-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-10">
              <div className="flex items-center gap-3 mb-8 border-b pb-4"><Stethoscope className="text-emerald-500" size={28} /><h3 className="text-xl font-black uppercase italic">Alta Hospitalar</h3></div>
              <p className="text-[11px] font-bold text-slate-400 uppercase mb-6 bg-slate-50 p-4 rounded-xl border italic text-center">Registrando o encerramento do internamento de: <span className="text-slate-900 block font-black not-italic text-sm mt-1">{selectedReg.nomePreso}</span></p>
              <form onSubmit={handleDarAlta} className="space-y-6">
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data e Hora da Saída (Alta)</label><input type="datetime-local" name="dataHoraAlta" required defaultValue={new Date().toISOString().slice(0, 16)} className="w-full p-4 border rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/10" /></div>
                <div className="flex gap-3 pt-4"><button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Efetuar Alta</button><button type="button" onClick={() => setAltaModalOpen(false)} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200">Cancelar</button></div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL DETALHE DO REGISTRO */}
      {detailModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl p-12 flex flex-col relative">
            <button onClick={() => setDetailModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full no-print transition-all"><X size={28} /></button>
            <div className="text-center mb-10 border-b pb-8"><h3 className="text-2xl font-black uppercase italic tracking-tighter">Protocolo SGE PPPG</h3><p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-1">ID: {selectedReg.id} • ORIGEM: {selectedReg.unidadeOrigem}</p></div>
            <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-2"><div className="grid grid-cols-2 gap-8"><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">CUSTODIADO / OPERAÇÃO</p><p className="text-xl font-black uppercase tracking-tighter text-slate-900">{selectedReg.nomePreso}</p><p className="text-[11px] font-bold text-slate-500 mt-1 uppercase">PRONTUÁRIO: {selectedReg.prontuario}</p>{selectedReg.quarto && <p className="text-[11px] font-black text-blue-600 mt-1 uppercase">QUARTO: {selectedReg.quarto}</p>}</div><div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase mb-1 italic">MOVIMENTAÇÃO</p><p className="text-sm font-black uppercase text-slate-700">{selectedReg.destino}</p><div className="mt-2 space-y-1"><p className="text-[10px] text-blue-600 font-black uppercase">Entrada: {new Date(selectedReg.dataHora).toLocaleString('pt-BR')}</p>{selectedReg.dataHoraAlta && <p className="text-[10px] text-emerald-600 font-black uppercase">Alta/Saída: {new Date(selectedReg.dataHoraAlta).toLocaleString('pt-BR')}</p>}</div></div></div><div className="bg-slate-50 p-8 rounded-[32px] border shadow-inner"><p className="text-[9px] font-black text-slate-400 uppercase mb-4 italic">Observações Técnicas</p><p className="text-sm font-medium leading-relaxed text-slate-700 whitespace-pre-wrap">{selectedReg.observacoes || 'Nenhum detalhe adicional.'}</p></div><div className="flex justify-between items-center px-4"><p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Registrado por: {selectedReg.createdBy}</p><p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Data: {new Date(selectedReg.createdAt).toLocaleDateString('pt-BR')}</p></div></div>
            <div className="mt-10 flex gap-4 no-print"><button onClick={() => window.print()} className="flex-1 py-5 bg-slate-950 text-white rounded-3xl font-black uppercase flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"><Printer size={22} /> Imprimir</button><button onClick={() => setDetailModalOpen(false)} className="px-8 py-5 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase hover:bg-slate-200">Fechar</button></div>
          </div>
        </div>
      )}

      {/* MODAL EDIÇÃO (MASTER) */}
      {editRecordModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in zoom-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl p-10 relative flex flex-col max-h-[90vh]"><h3 className="text-xl font-black uppercase italic mb-6 border-b pb-4 flex items-center gap-2"><Edit3 className="text-amber-600" /> Editar Protocolo</h3>
              <form onSubmit={handleEditRegistro} className="space-y-4 overflow-y-auto custom-scrollbar pr-2"><div className="grid grid-cols-2 gap-4">
                   {selectedReg.tipo !== 'Operação Externa' && (<><div className="col-span-2 space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Custodiado</label><input name="nomePreso" defaultValue={selectedReg.nomePreso} required className="w-full p-3 bg-slate-50 border rounded-xl font-bold uppercase text-sm" /></div><div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Prontuário</label><input name="prontuario" defaultValue={selectedReg.prontuario} required className="w-full p-3 bg-slate-50 border rounded-xl font-bold uppercase text-sm" /></div></>)}
                   <div className={`${selectedReg.tipo === 'Operação Externa' ? 'col-span-2' : ''} space-y-1`}><label className="text-[9px] font-black uppercase text-slate-400">Local</label><input name="destino" defaultValue={selectedReg.destino} required className="w-full p-3 bg-slate-50 border rounded-xl font-bold uppercase text-sm" /></div>
                   {selectedReg.tipo === 'Internamento' && (<div className="col-span-2 space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Quarto</label><input name="quarto" defaultValue={selectedReg.quarto} required className="w-full p-3 bg-slate-50 border rounded-xl font-black uppercase text-sm" /></div>)}
                   <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Data/Hora Entrada</label><input type="datetime-local" name="dataHora" defaultValue={selectedReg.dataHora} required className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-sm" /></div><div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Risco</label><select name="risco" defaultValue={selectedReg.risco} className="w-full p-3 bg-slate-50 border rounded-xl font-bold uppercase text-[10px]"><option value="Baixo">Baixo</option><option value="Médio">Médio</option><option value="Alto">Alto</option></select></div><div className="col-span-2 space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Status</label><select name="status" defaultValue={selectedReg.status} className="w-full p-3 bg-slate-50 border rounded-xl font-bold uppercase text-[10px]"><option value="Pendente">Pendente</option><option value="Em Andamento">Em Andamento</option><option value="Concluído">Concluído</option><option value="Cancelado">Cancelado</option></select></div><div className="col-span-2 space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Observações</label><textarea name="observacoes" defaultValue={selectedReg.observacoes} className="w-full p-4 bg-slate-50 border rounded-2xl min-h-[120px] font-medium text-sm" /></div></div>
                <div className="flex gap-3 pt-6"><button type="submit" className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Salvar</button><button type="button" onClick={() => setEditRecordModalOpen(false)} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Sair</button></div></form></div></div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in zoom-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-md shadow-2xl p-10 relative"><h3 className="text-xl font-black uppercase italic mb-8 border-b pb-4 flex items-center gap-2"><UserCog className="text-blue-600" size={24} /> Ajustes de Acesso</h3>
            <form onSubmit={handleMasterEditUser} className="space-y-6"><div className="p-4 bg-slate-50 rounded-2xl border mb-4 italic text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Servidor em edição</p><p className="font-black text-slate-900 text-xs">{editingUser.email}</p></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Nome Completo</label><input type="text" name="editFullName" defaultValue={editingUser.fullName} required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none uppercase text-sm" /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Lotação</label><select name="editLotacao" defaultValue={editingUser.lotacao} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none uppercase text-[10px]"><option value="Administração Geral">Administração Geral</option><option value="Cadeias Públicas">Cadeias Públicas</option><option value="Setor de Escolta Prisional">Escolta Prisional</option><option value="Setor de Operações Especiais">SOE</option></select></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Perfil de Acesso</label><select name="editRole" defaultValue={editingUser.role} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none uppercase text-[10px]"><option value="Operator">Operador</option><option value="UnitAdmin">Administrador de Unidade</option><option value="GlobalAdmin">Administrador Intermediário</option></select></div><div className="flex gap-3 pt-6"><button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Salvar</button><button type="button" onClick={() => setEditingUser(null)} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Sair</button></div></form></div></div>
      )}

      <div className={`fixed bottom-0 left-0 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-64'} right-0 p-3 bg-white/70 backdrop-blur-md border-t text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic z-10 no-print transition-all duration-300`}>
        SGE PPPG • MANUTENÇÃO INSTITUCIONAL • V-1.9 2026
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @media print { 
          .no-print { display: none !important; }
          body { background: white !important; }
          aside, header { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; overflow: visible !important; height: auto !important; position: static !important; }
          .bg-slate-50 { background-color: white !important; }
          .border { border-color: #cbd5e1 !important; }
          .rounded-[32px], .rounded-[40px] { border-radius: 8px !important; }
        }
      `}</style>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) { createRoot(rootElement).render(<App />); }
