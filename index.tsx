
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
  Download, 
  Eye, 
  Clock, 
  Users, 
  History, 
  UserCog, 
  Ban, 
  Menu, 
  ChevronDown,
  UserCheck,
  Bell,
  FileText,
  Filter,
  Database,
  Wifi,
  Stethoscope,
  Archive,
  Save,
  Activity,
  UserPlus,
  KeyRound,
  ShieldCheck
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
const TEMP_PASSWORD_DEFAULT = 'deppen2026';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState<UserProfile | null>(null);

  const getUsers = (): UserProfile[] => {
    const data = localStorage.getItem('sge_users_db_v3');
    return data ? JSON.parse(data) : [];
  };

  useEffect(() => {
    if (getUsers().length === 0) {
      setIsFirstAccess(true);
    }
  }, []);

  const handleSetupMaster = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    setTimeout(() => {
      const inputEmail = email.trim().toLowerCase();
      if (!inputEmail.endsWith('@policiapenal.pr.gov.br')) {
        setError('Use um e-mail institucional @policiapenal.pr.gov.br');
        setLoading(false);
        return;
      }

      const masterUser: UserProfile = {
        email: inputEmail,
        password: TEMP_PASSWORD_DEFAULT,
        fullName: fullName.toUpperCase(),
        isTemporary: true, // Força a troca na primeira entrada
        lotacao: 'Administração Geral',
        role: 'Master',
        status: 'Authorized',
        isBlocked: false,
        requestDate: new Date().toISOString()
      };

      localStorage.setItem('sge_users_db_v3', JSON.stringify([masterUser]));
      registerLog('Configuração Master', `Administrador Geral configurado: ${masterUser.email}. Senha temporária definida.`, 'Sistema');
      
      // Ao configurar o Master, avisamos que a senha temporária é deppen2026
      alert(`Administrador configurado!\nUse a senha temporária: ${TEMP_PASSWORD_DEFAULT}\nVocê deverá alterá-la no próximo passo.`);
      setIsFirstAccess(false);
      setEmail(masterUser.email);
      setPassword('');
      setLoading(false);
    }, 1000);
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
            setMustChangePassword(user);
            setLoading(false);
            return;
          }
          user.lastSeen = new Date().toISOString();
          localStorage.setItem('sge_users_db_v3', JSON.stringify(users));
          registerLog('Login', `Acesso realizado por ${user.email}`, 'Segurança', user.lotacao);
          onLoginSuccess(user);
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
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword === TEMP_PASSWORD_DEFAULT) {
      setError('A nova senha não pode ser igual à senha temporária.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const users = getUsers();
      const idx = users.findIndex(u => u.email === mustChangePassword?.email);
      if (idx !== -1) {
        users[idx].password = newPassword;
        users[idx].isTemporary = false;
        users[idx].lastSeen = new Date().toISOString();
        localStorage.setItem('sge_users_db_v3', JSON.stringify(users));
        registerLog('Alteração de Senha', `Senha obrigatória alterada para ${users[idx].email}`, 'Segurança', users[idx].lotacao);
        onLoginSuccess(users[idx]);
      }
      setLoading(false);
    }, 1000);
  };

  if (mustChangePassword) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 p-6 overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 relative z-10 animate-in zoom-in duration-500 my-auto border-4 border-blue-500">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="p-5 bg-blue-600 rounded-[24px] mb-6 shadow-xl shadow-blue-900/20">
              <KeyRound className="text-white" size={48} />
            </div>
            <h1 className="text-2xl font-black text-slate-950 italic uppercase tracking-tighter leading-none">Redefinição Obrigatória</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2 tracking-widest leading-none">Sua senha é temporária e deve ser alterada</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in shake duration-300">
              <Zap size={16} className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm" placeholder="MÍNIMO 6 CARACTERES" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-2xl shadow-blue-900/20">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              Efetivar Nova Senha
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 p-6 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 relative z-10 animate-in zoom-in duration-500 my-auto">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="p-5 bg-slate-900 rounded-[24px] mb-6 shadow-xl shadow-blue-900/20">
            <ShieldAlert className="text-blue-500" size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-950 italic uppercase tracking-tighter leading-none">SGE <span className="text-blue-600">PPPG</span></h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2 tracking-widest leading-none">
            {isFirstAccess ? 'Configuração Inicial do Sistema' : 'Segurança Institucional'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in shake duration-300">
            <Zap size={16} className="shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={isFirstAccess ? handleSetupMaster : handleLogin} className="space-y-6">
          {isFirstAccess && (
            <div className="space-y-2 animate-in slide-in-from-top duration-300">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo do Administrador Geral</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm uppercase" placeholder="NOME COMPLETO" />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Institucional</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm" placeholder="agente@policiapenal.pr.gov.br" />
          </div>
          
          {!isFirstAccess && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm" placeholder="••••" />
            </div>
          )}
          
          <button type="submit" disabled={loading} className={`w-full py-5 ${isFirstAccess ? 'bg-blue-600' : 'bg-slate-950'} text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-2xl shadow-blue-900/20`}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isFirstAccess ? <UserPlus size={18} /> : <LogIn size={18} />)}
            {isFirstAccess ? 'Configurar Administrador Geral' : 'Entrar no Sistema'}
          </button>
          
          {isFirstAccess && (
            <p className="text-[9px] font-black text-slate-400 text-center uppercase tracking-widest mt-4">
              Nota: A senha temporária padrão será <span className="text-blue-600 font-black">deppen2026</span>
            </p>
          )}
        </form>
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
  const [formTipo, setFormTipo] = useState<TipoRegistro>('Escolta Operacional');

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
        }
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'usuarios' || activeTab === 'solicitacoes' || activeTab === 'auditoria') {
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
    
    const newUser: UserProfile = {
      email: newUserEmail.toLowerCase().trim(),
      fullName: newUserName.trim().toUpperCase(),
      lotacao: unit,
      password: TEMP_PASSWORD_DEFAULT,
      isTemporary: true, // Novos usuários também são marcados para trocar senha
      role: newUserRole,
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
    
    setUsersList(users);
    if (initialStatus === 'Pending') {
      registerLog('Solicitação Usuário', `Novo acesso solicitado para ${newUser.email}`, 'Sistema');
      alert(`Cadastro enviado para a fila de liberação do Administrador Geral.\nSenha temporária: ${TEMP_PASSWORD_DEFAULT}`);
    } else {
      registerLog('Criação Usuário', `Usuário ${newUser.email} cadastrado com perfil ${newUserRole}`, 'Sistema');
      alert(`Usuário cadastrado com sucesso.\nSenha temporária de acesso: ${TEMP_PASSWORD_DEFAULT}`);
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
      registerLog('Edição Usuário', `Dados de ${editingUser.email} atualizados`, 'Sistema');
      setEditingUser(null);
    }
  };

  const toggleBlockUser = (email: string) => {
    if (email === currentUser?.email) return alert("Você não pode bloquear seu próprio acesso.");
    const usersData = localStorage.getItem('sge_users_db_v3');
    const users: UserProfile[] = JSON.parse(usersData || '[]');
    const idx = users.findIndex(u => u.email === email);
    if (idx !== -1) {
      users[idx].isBlocked = !users[idx].isBlocked;
      localStorage.setItem('sge_users_db_v3', JSON.stringify(users));
      setUsersList(users);
      registerLog('Bloqueio Usuário', `Usuário ${email} ${users[idx].isBlocked ? 'Bloqueado' : 'Desbloqueado'}`, 'Segurança');
    }
  };

  const handleDeleteRegistro = (id: string) => {
    if (confirm("Deseja realmente excluir este protocolo de forma definitiva?")) {
      setRegistros(prev => prev.filter(r => r.id !== id));
      registerLog('Exclusão de Registro', `Protocolo ${id} removido`, 'Sistema');
    }
  };

  const handleAddRegistro = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newReg: Registro = {
      id: `PRT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      tipo: formTipo,
      nomePreso: formData.get('nomePreso') as string,
      prontuario: formData.get('prontuario') as string,
      destino: formData.get('destino') as string,
      dataHora: formData.get('dataHora') as string,
      risco: formData.get('risco') as Risco,
      status: 'Pendente',
      observacoes: formData.get('observacoes') as string,
      unidadeOrigem: currentUser?.lotacao === 'Administração Geral' ? adminContext : currentUser!.lotacao!,
      createdBy: currentUser?.email || 'N/A',
      createdAt: new Date().toISOString()
    };
    
    setRegistros([newReg, ...registros]);
    registerLog('Novo Registro', `Protocolo ${newReg.id} gerado`, 'Operacional');
    setActiveTab('painel');
    alert(`Protocolo ${newReg.id} registrado.`);
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
    registerLog('Alta Hospitalar', `Encerramento do protocolo ${selectedReg.id}`, 'Operacional');
    setAltaModalOpen(false);
  };

  const registrosExibiveis = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Master' || currentUser.role === 'GlobalAdmin') {
      if (adminContext === 'Administração Geral') return registros;
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

  const isMaster = currentUser?.role === 'Master';
  const isGlobalAdmin = currentUser?.role === 'GlobalAdmin';
  const isIntermediary = isGlobalAdmin || currentUser?.role === 'UnitAdmin';

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
                <div className="p-1 bg-blue-600/20 text-[7px] font-black uppercase text-blue-400 tracking-widest text-center italic leading-none">Unidade de Visão</div>
                {(isMaster || isGlobalAdmin) ? (
                  <div className="relative group">
                    <select value={adminContext} onChange={(e) => setAdminContext(e.target.value as any)} className="w-full bg-transparent text-[10px] font-black uppercase text-white p-3 pr-8 outline-none cursor-pointer appearance-none text-center">
                      <option value="Administração Geral" className="text-slate-900">Visão Global</option>
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
          <button onClick={() => setActiveTab('painel')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'painel' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><LayoutDashboard size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Painel</span>}</button>
          <button onClick={() => setActiveTab('escoltas')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'escoltas' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><CalendarIcon size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Escoltas</span>}</button>
          <button onClick={() => setActiveTab('internamentos')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'internamentos' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Ambulance size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Internamentos</span>}</button>
          <button onClick={() => setActiveTab('concluidas')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'concluidas' ? 'bg-emerald-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Archive size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Concluídas</span>}</button>
          
          {(isMaster || isIntermediary) && (
            <button onClick={() => setActiveTab('usuarios')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'usuarios' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Users size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Gestão Usuários</span>}</button>
          )}

          {isMaster && (
            <>
              <button onClick={() => setActiveTab('solicitacoes')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all relative ${activeTab === 'solicitacoes' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Bell size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Solicitações</span>}{pendingRequestsCount > 0 && <span className="absolute top-2 right-2 bg-rose-500 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-pulse text-white">{pendingRequestsCount}</span>}</button>
              <button onClick={() => setActiveTab('auditoria')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'auditoria' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><History size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Auditoria</span>}</button>
              <button onClick={() => setActiveTab('backup')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'backup' ? 'bg-amber-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Database size={20} /> {!isSidebarCollapsed && <span className="text-xs font-black uppercase">Manutenção</span>}</button>
            </>
          )}
          <div className="pt-6 border-t border-slate-800/50"><button onClick={() => setActiveTab('novo')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-xl text-white`}><PlusCircle size={20} /> {!isSidebarCollapsed && <span>Novo Registro</span>}</button></div>
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-black uppercase text-[10px]"><LogOut size={18} /> {!isSidebarCollapsed && <span>Encerrar Sessão</span>}</button></div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-xl border-b px-8 py-5 sticky top-0 z-10 flex justify-between items-center no-print">
          <div className="flex items-center gap-4"><h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{activeTab.toUpperCase()}</h2></div>
          <div className="flex items-center gap-4 w-full max-w-xl">
            <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold" /></div>
            <div className="relative"><input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold uppercase" /><Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />{searchDate && <button onClick={() => setSearchDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 hover:bg-rose-50 rounded-full p-0.5"><X size={12} /></button>}</div>
          </div>
        </header>

        <div className="p-6 md:p-12 pb-24">
          {activeTab === 'painel' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <button onClick={() => setActiveTab('escoltas')} className="bg-white p-8 rounded-[32px] border text-left hover:shadow-lg transition-all group border-b-4 border-b-blue-500"><CalendarIcon className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" size={24} /><p className="text-[10px] font-black uppercase text-slate-400">Escoltas Ativas</p><p className="text-4xl font-black tracking-tighter">{registrosExibiveis.filter(r => r.tipo === 'Escolta Operacional' && r.status !== 'Concluído').length}</p></button>
                <button onClick={() => setActiveTab('internamentos')} className="bg-white p-8 rounded-[32px] border text-left hover:shadow-lg transition-all group border-b-4 border-b-emerald-500"><Ambulance className="text-emerald-600 mb-2 group-hover:scale-110 transition-transform" size={24} /><p className="text-[10px] font-black uppercase text-slate-400">Pacientes Internados</p><p className="text-4xl font-black tracking-tighter">{registrosExibiveis.filter(r => r.tipo === 'Internamento' && !r.dataHoraAlta).length}</p></button>
                <div className="bg-rose-600 p-8 rounded-[32px] text-white shadow-xl shadow-rose-600/20 border-b-4 border-b-rose-800"><ShieldAlert className="mb-2" size={24} /><p className="text-[10px] font-black uppercase text-rose-200">Alertas de Risco</p><p className="text-4xl font-black tracking-tighter">{registrosExibiveis.filter(r => r.risco === 'Alto' && r.status !== 'Concluído').length}</p></div>
                <div className="bg-emerald-600 p-8 rounded-[32px] text-white shadow-xl shadow-emerald-600/20 border-b-4 border-b-emerald-800"><Archive className="mb-2" size={24} /><p className="text-[10px] font-black uppercase text-emerald-200">Total Encerradas</p><p className="text-4xl font-black tracking-tighter">{registrosExibiveis.filter(r => r.status === 'Concluído' || !!r.dataHoraAlta).length}</p></div>
              </div>
              <div className="bg-white rounded-[40px] border p-10 shadow-sm"><h3 className="text-xl font-black uppercase italic mb-8 flex items-center gap-3 tracking-tighter"><Zap className="text-amber-500" /> Atividades em Andamento</h3>
                <div className="grid grid-cols-1 gap-4">
                  {registrosExibiveis.filter(r => r.status !== 'Concluído' && !r.dataHoraAlta).sort((a,b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()).slice(0, 5).map(r => (
                    <div key={r.id} onClick={() => navigateToDate(r.dataHora.split('T')[0], r.tipo === 'Internamento' ? 'internamentos' : 'escoltas')} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-transparent hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group shadow-sm">
                      <div className="flex items-center gap-6"><div className={`p-4 rounded-2xl ${r.tipo === 'Internamento' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{r.tipo === 'Internamento' ? <Ambulance size={20} /> : <CalendarIcon size={20} />}</div>
                        <div><p className="font-black uppercase text-slate-900 group-hover:text-blue-700 transition-colors tracking-tight">{r.nomePreso}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.destino} • {r.unidadeOrigem}</p></div></div>
                      <div className="text-right"><p className="text-sm font-black text-slate-900">{new Date(r.dataHora).toLocaleDateString('pt-BR')}</p><p className="text-[10px] font-bold text-blue-600 uppercase italic">{new Date(r.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} HRS</p></div></div>))}
                  {registrosExibiveis.filter(r => r.status !== 'Concluído' && !r.dataHoraAlta).length === 0 && <div className="py-20 text-center text-slate-300 font-black uppercase text-xs italic border-2 border-dashed rounded-[32px]">Sem atividades registradas</div>}
                </div></div></div>
          )}

          {activeTab === 'solicitacoes' && isMaster && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
              <div className="bg-white rounded-[40px] p-12 border shadow-2xl">
                <h3 className="text-2xl font-black uppercase italic mb-8 border-b pb-6 flex items-center gap-3 tracking-tighter text-blue-900"><UserCheck className="text-blue-600" size={32} /> Central de Liberações</h3>
                <div className="space-y-4">
                  {usersList.filter(u => u.status === 'Pending').map(u => (
                    <div key={u.email} className="p-8 bg-slate-50 rounded-[32px] border flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                      <div>
                        <p className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">{u.fullName}</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{u.email} • {u.lotacao}</p>
                        <p className="text-[9px] font-black text-blue-600 uppercase mt-1 italic italic">Solicitado em: {new Date(u.requestDate || '').toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setValidatingUser({user: u, type: 'Approve'})} className="px-8 py-4 bg-emerald-600 text-white rounded-[20px] font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-lg hover:bg-emerald-700 active:scale-95 transition-all"><CheckCircle size={18}/> Autorizar</button>
                        <button onClick={() => setValidatingUser({user: u, type: 'Deny'})} className="px-8 py-4 bg-rose-600 text-white rounded-[20px] font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-lg hover:bg-rose-700 active:scale-95 transition-all"><Ban size={18}/> Negar</button>
                      </div>
                    </div>
                  ))}
                  {usersList.filter(u => u.status === 'Pending').length === 0 && <div className="text-center py-24 text-slate-300 font-black uppercase text-xs italic border-2 border-dashed rounded-[32px]">Sem pendências</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'usuarios' && (isMaster || isIntermediary) && (
            <div className="bg-white rounded-[40px] p-12 border shadow-2xl animate-in fade-in duration-500">
              <h3 className="text-2xl font-black uppercase italic mb-8 border-b pb-6 flex items-center gap-3 tracking-tighter text-blue-900"><Users className="text-blue-600" size={32} /> Gestão de Acessos</h3>
              
              <form onSubmit={handleAddUser} className="space-y-6 mb-12 bg-slate-50 p-10 rounded-[32px] border shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic tracking-widest">Nome do Servidor</label>
                    <input type="text" placeholder="EX: NOME SOBRENOME" value={newUserName} onChange={e => setNewUserName(e.target.value)} required className="w-full p-4 rounded-2xl border-2 border-slate-200 font-black text-xs uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic tracking-widest">E-mail Institucional (@policiapenal.pr.gov.br)</label>
                    <input type="email" placeholder="EX: AGENTE@POLICIAPENAL.PR.GOV.BR" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required className="w-full p-4 rounded-2xl border-2 border-slate-200 font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-white" />
                  </div>
                  {isMaster && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic tracking-widest">Unidade</label>
                        <select value={newUserUnit} onChange={e => setNewUserUnit(e.target.value as any)} className="w-full p-4 rounded-2xl border-2 border-slate-200 font-black text-[10px] uppercase outline-none bg-white">
                          <option value="Administração Geral">Administração Geral (Global)</option>
                          <option value="Cadeias Públicas">Cadeias Públicas</option>
                          <option value="Setor de Escolta Prisional">Setor de Escolta Prisional</option>
                          <option value="Setor de Operações Especiais">Setor de Operações Especiais (SOE)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic tracking-widest">Perfil de Acesso</label>
                        <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as any)} className="w-full p-4 rounded-2xl border-2 border-slate-200 font-black text-[10px] uppercase outline-none bg-white">
                          <option value="Operator">Operador</option>
                          <option value="UnitAdmin">Administrador de Unidade</option>
                          <option value="GlobalAdmin">Administrador Intermediário</option>
                          <option value="Master">Administrador Geral (Master)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
                <button type="submit" className="w-full py-5 bg-slate-950 text-white rounded-[24px] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 active:scale-95 transition-all shadow-xl">
                  <PlusCircle size={20} /> Cadastrar Servidor
                </button>
                <p className="text-[9px] font-black text-slate-400 text-center uppercase">A senha inicial padrão de todo novo acesso é: <span className="text-blue-600">deppen2026</span></p>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4">Servidor</th>
                      <th className="px-6 py-4">Lotação</th>
                      <th className="px-6 py-4">Perfil</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {usersList.map(u => (
                      <tr key={u.email} className={`${u.isBlocked ? 'opacity-40 grayscale' : ''} hover:bg-slate-50 transition-colors`}>
                        <td className="px-6 py-5">
                          <p className="font-black uppercase text-slate-900 leading-none">{u.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic tracking-tight">{u.email}</p>
                        </td>
                        <td className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 italic">{u.lotacao}</td>
                        <td className="px-6 py-5">
                          <span className={`text-[10px] font-black uppercase italic tracking-tighter ${u.role === 'Master' ? 'text-amber-600' : 'text-blue-600'}`}>{getRoleLabel(u.role)}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full w-fit ${u.status === 'Authorized' ? 'bg-emerald-100 text-emerald-600' : u.status === 'Denied' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                              {u.status === 'Authorized' ? 'Autorizado' : u.status === 'Denied' ? 'Negado' : 'Pendente'}
                            </span>
                            {u.isTemporary && <span className="text-[7px] font-black text-blue-500 uppercase italic">Senha Provisória</span>}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right flex justify-end gap-2">
                          {isMaster && (
                            <>
                              <button onClick={() => setEditingUser(u)} className="p-3 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all" title="Editar"><UserCog size={18}/></button>
                              <button onClick={() => toggleBlockUser(u.email)} className={`p-3 rounded-2xl transition-all ${u.isBlocked ? 'text-emerald-600 hover:bg-emerald-100' : 'text-amber-500 hover:bg-amber-100'}`} title={u.isBlocked ? "Ativar" : "Bloquear"}>
                                {u.isBlocked ? <CheckCircle size={18}/> : <Ban size={18} />}
                              </button>
                              <button onClick={() => confirm('Remover acesso permanentemente?') && setUsersList(prev => prev.filter(x => x.email !== u.email))} className="p-3 text-rose-500 hover:bg-rose-100 rounded-2xl transition-all" title="Excluir"><Trash2 size={18}/></button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(activeTab === 'escoltas' || activeTab === 'internamentos' || activeTab === 'concluidas') && (
            <div className="bg-white rounded-[32px] border overflow-hidden shadow-sm animate-in fade-in duration-500">
              <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
                <h3 className="text-lg font-black uppercase tracking-tighter italic flex items-center gap-3">
                  {activeTab === 'escoltas' ? <><CalendarIcon className="text-blue-600"/> Monitoramento de Escoltas</> : activeTab === 'internamentos' ? <><Ambulance className="text-emerald-600"/> Monitoramento de Internamentos</> : <><Archive className="text-slate-600"/> Histórico de Movimentações</>}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr><th className="px-8 py-5 text-left">Custodiado</th><th className="px-8 py-5 text-left">Destino</th><th className="px-8 py-5 text-left">Horários</th><th className="px-8 py-5 text-left">Origem</th><th className="px-8 py-5 text-right no-print">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredRegistros.filter(r => {
                      if (activeTab === 'escoltas') return r.tipo !== 'Internamento' && r.status !== 'Concluído';
                      if (activeTab === 'internamentos') return r.tipo === 'Internamento' && !r.dataHoraAlta;
                      return r.status === 'Concluído' || !!r.dataHoraAlta;
                    }).map(reg => (
                      <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5"><p className="font-black uppercase text-slate-900 leading-tight">{reg.nomePreso}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic leading-none mt-1">{reg.id}</p></td>
                        <td className="px-8 py-5"><p className="uppercase font-bold text-slate-700 leading-tight">{reg.destino}</p><p className="text-[9px] font-black text-blue-600 uppercase italic leading-none mt-1">{reg.tipo}</p></td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase italic leading-none">Início: {new Date(reg.dataHora).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</p>
                            {reg.dataHoraAlta && <p className="text-[9px] font-black text-emerald-600 uppercase leading-none">Alta: {new Date(reg.dataHoraAlta).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</p>}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 italic">{reg.unidadeOrigem}</td>
                        <td className="px-8 py-5 text-right flex justify-end gap-1 no-print">
                          <button onClick={() => { setSelectedReg(reg); setDetailModalOpen(true); }} className="p-3 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all" title="Detalhes"><Eye size={18} /></button>
                          {activeTab === 'internamentos' && !reg.dataHoraAlta && (
                            <button onClick={() => { setSelectedReg(reg); setAltaModalOpen(true); }} className="p-3 text-emerald-600 hover:bg-emerald-100 rounded-2xl transition-all" title="Dar Alta"><Stethoscope size={18} /></button>
                          )}
                          {isMaster && (
                            <button onClick={() => handleDeleteRegistro(reg.id)} className="p-3 text-rose-500 hover:bg-rose-100 rounded-2xl transition-all" title="Excluir"><Trash2 size={18} /></button>
                          )}
                        </td></tr>))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'novo' && (
            <div className="max-w-4xl mx-auto bg-white rounded-[40px] p-12 border shadow-2xl animate-in zoom-in duration-500">
              <h3 className="text-2xl font-black uppercase italic mb-8 border-b pb-6 flex items-center gap-3 tracking-tighter text-blue-900"><PlusCircle className="text-blue-600" size={32} /> Lançar Protocolo</h3>
              <form onSubmit={handleAddRegistro} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic tracking-widest leading-none">Tipo</label><select name="tipo" value={formTipo} onChange={e => setFormTipo(e.target.value as TipoRegistro)} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black uppercase text-xs outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"><option value="Escolta Operacional">Escolta de Presos</option><option value="Internamento">Internamento Hospitalar</option><option value="Operação Externa">Operação Externa</option></select></div>
                  <div className="col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic tracking-widest leading-none">Nome do Custodiado</label><input name="nomePreso" required className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="IDENTIFICAÇÃO COMPLETA" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic tracking-widest leading-none">Prontuário (ID)</label><input name="prontuario" required className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black uppercase outline-none" placeholder="ID INTERNO" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic tracking-widest leading-none">Classificação de Risco</label><select name="risco" className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black uppercase text-xs outline-none"><option value="Baixo">Risco Baixo</option><option value="Médio">Risco Médio</option><option value="Alto">Risco Alto</option></select></div>
                  <div className="col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic tracking-widest leading-none">Destino / Localização</label><input name="destino" required className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black uppercase outline-none" placeholder="HOSPITAL, FÓRUM OU UNIDADE" /></div>
                  <div className="col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic tracking-widest leading-none">Início do Evento</label><input type="datetime-local" name="dataHora" required className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold outline-none" defaultValue={new Date().toISOString().slice(0, 16)} /></div>
                  <div className="col-span-2 space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic tracking-widest leading-none">Observações Técnicas</label><textarea name="observacoes" className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-3xl min-h-[140px] focus:ring-4 focus:ring-blue-500/10 outline-none font-medium text-sm" placeholder="Equipe, viatura, prontuário médico..." /></div>
                </div>
                <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-700 active:scale-95 transition-all">Efetivar Registro Operacional</button>
              </form>
            </div>
          )}

          {activeTab === 'auditoria' && isMaster && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="bg-white rounded-[32px] border p-10 shadow-sm border-b-4 border-b-emerald-500">
                  <div className="flex items-center justify-between mb-8"><h3 className="text-xl font-black uppercase italic flex items-center gap-3 tracking-tighter"><Wifi className="text-emerald-500 animate-pulse" /> Operadores Online</h3><span className="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm leading-none">{activeUsers.length} ONLINE</span></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {activeUsers.map(u => (
                      <div key={u.email} className="p-5 bg-slate-50 border-2 border-transparent hover:border-emerald-200 rounded-[24px] flex items-center gap-5 transition-all hover:bg-white shadow-sm">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg">{u.fullName?.charAt(0)}</div>
                        <div>
                          <p className="font-black text-xs uppercase text-slate-900 leading-none mb-1 tracking-tight">{u.fullName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none italic">{u.lotacao}</p>
                        </div>
                      </div>
                    ))}
                    {activeUsers.length === 0 && <p className="col-span-3 text-center py-6 text-slate-300 font-black uppercase text-[10px] italic">Sem atividade remota no momento</p>}
                  </div>
               </div>
               <div className="bg-white rounded-[40px] border overflow-hidden shadow-2xl">
                 <div className="p-10 border-b bg-slate-50/50 flex items-center justify-between"><h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3"><History className="text-blue-600" size={28} /> Logs de Segurança</h3></div>
                 <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                   <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b">
                      <tr><th className="px-10 py-5 text-left">Horário</th><th className="px-10 py-5 text-left">Usuário</th><th className="px-10 py-5 text-left">Ação</th><th className="px-10 py-5 text-left">Detalhes</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-10 py-5 text-[10px] font-black text-slate-500 italic">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                          <td className="px-10 py-5 font-bold text-slate-700 uppercase text-xs leading-none">{log.userEmail}</td>
                          <td className="px-10 py-5"><span className="uppercase font-black text-blue-900 text-[10px] tracking-widest italic leading-none">{log.action}</span></td>
                          <td className="px-10 py-5 text-xs font-bold text-slate-500 uppercase italic tracking-tight">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                   </table>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL VALIDAÇÃO DE ACESSO */}
      {validatingUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in zoom-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl p-12 border-2 border-slate-100">
              <div className="flex items-center gap-4 mb-8 border-b pb-6">
                <div className={`p-4 rounded-3xl ${validatingUser.type === 'Approve' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {validatingUser.type === 'Approve' ? <CheckCircle size={32}/> : <Ban size={32}/>}
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {validatingUser.type === 'Approve' ? 'Validar Cadastro' : 'Bloquear Cadastro'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Decisão do Administrador Geral</p>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 mb-8 italic">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">Solicitante</p>
                <p className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{validatingUser.user.fullName}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase mt-2 leading-none">{validatingUser.user.email} • {validatingUser.user.lotacao}</p>
              </div>

              <form onSubmit={handleValidateRequest} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic tracking-widest leading-none">Justificativa Técnica</label>
                  <textarea name="justification" required minLength={5} className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-[20px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-sm uppercase placeholder:normal-case" placeholder="Insira o motivo da decisão..." />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className={`flex-1 py-5 ${validatingUser.type === 'Approve' ? 'bg-emerald-600' : 'bg-rose-600'} text-white rounded-[20px] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all`}>
                    Efetivar {validatingUser.type === 'Approve' ? 'Liberação' : 'Bloqueio'}
                  </button>
                  <button type="button" onClick={() => setValidatingUser(null)} className="px-10 py-5 bg-slate-100 text-slate-500 rounded-[20px] font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL EDIÇÃO DE USUÁRIO (MASTER) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-in zoom-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-12 relative border-2 border-slate-100">
            <h3 className="text-2xl font-black uppercase italic mb-10 border-b pb-6 flex items-center gap-3 tracking-tighter text-blue-950 leading-none">
              <UserCog className="text-blue-600" size={28} /> Editar Perfil do Servidor
            </h3>
            <form onSubmit={handleMasterEditUser} className="space-y-6">
              <div className="p-6 bg-blue-50 rounded-[24px] border border-blue-100 mb-6 italic text-center leading-none">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 leading-none">Identificação</p>
                <p className="font-black text-blue-900 text-sm tracking-tight leading-none">{editingUser.email}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic leading-none">Nome Atualizado</label>
                <input type="text" name="editFullName" defaultValue={editingUser.fullName} required className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black outline-none uppercase text-xs focus:ring-4 focus:ring-blue-500/10 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic leading-none">Unidade</label>
                <select name="editLotacao" defaultValue={editingUser.lotacao} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black outline-none uppercase text-[10px] focus:ring-4 focus:ring-blue-500/10 transition-all">
                  <option value="Administração Geral">Administração Geral</option>
                  <option value="Cadeias Públicas">Cadeias Públicas</option>
                  <option value="Setor de Escolta Prisional">Setor de Escolta Prisional</option>
                  <option value="Setor de Operações Especiais">SOE</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic leading-none">Permissões de Acesso</label>
                <select name="editRole" defaultValue={editingUser.role} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black outline-none uppercase text-[10px] focus:ring-4 focus:ring-blue-500/10 transition-all">
                  <option value="Operator">Operador</option>
                  <option value="UnitAdmin">Administrador de Unidade</option>
                  <option value="GlobalAdmin">Administrador Intermediário</option>
                  <option value="Master">Administrador Geral (Master)</option>
                </select>
              </div>
              <div className="flex gap-4 pt-8">
                <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-[20px] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all">Salvar</button>
                <button type="button" onClick={() => setEditingUser(null)} className="px-10 py-5 bg-slate-100 text-slate-500 rounded-[20px] font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Descartar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ALTA HOSPITALAR */}
      {altaModalOpen && selectedReg && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-in zoom-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-10 border border-emerald-100">
              <div className="flex items-center gap-3 mb-8 border-b pb-4"><Stethoscope className="text-emerald-500" size={32} /><h3 className="text-2xl font-black uppercase italic tracking-tighter">Finalizar Internamento</h3></div>
              <p className="text-[11px] font-bold text-slate-400 uppercase mb-6 bg-emerald-50 p-6 rounded-3xl border border-emerald-100 italic text-center leading-none">Registrando alta de:<br/><span className="text-emerald-900 block font-black not-italic text-lg mt-2 uppercase tracking-tighter leading-none">{selectedReg.nomePreso}</span></p>
              <form onSubmit={handleDarAlta} className="space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic leading-none">Data e Hora da Alta</label><input type="datetime-local" name="dataHoraAlta" required defaultValue={new Date().toISOString().slice(0, 16)} className="w-full p-5 border-2 border-emerald-50 rounded-[20px] font-black outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" /></div>
                <div className="flex gap-4 pt-4"><button type="submit" className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Confirmar Alta</button><button type="button" onClick={() => setAltaModalOpen(false)} className="px-8 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-200">Cancelar</button></div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL DETALHE DO REGISTRO */}
      {detailModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-3xl shadow-2xl p-12 flex flex-col relative border-2 border-slate-100">
            <button onClick={() => setDetailModalOpen(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full no-print transition-all"><X size={28} /></button>
            <div className="text-center mb-10 border-b-2 pb-8 border-dashed border-slate-200"><h3 className="text-3xl font-black uppercase italic tracking-tighter text-blue-950 leading-none">Ficha Operacional SGE</h3><p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mt-2 italic leading-none">DOCUMENTO INSTITUCIONAL • PROTOCOLO {selectedReg.id}</p></div>
            <div className="space-y-10 flex-1 overflow-y-auto custom-scrollbar pr-4">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 italic leading-none">Custodiado</p><p className="text-2xl font-black uppercase tracking-tighter text-slate-950 leading-none">{selectedReg.nomePreso}</p><p className="text-[11px] font-black text-slate-500 mt-2 uppercase bg-slate-100 w-fit px-3 py-1 rounded-lg leading-none">ID: {selectedReg.prontuario}</p></div>
                  <div><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 italic leading-none">Movimentação</p><p className="text-lg font-black uppercase text-slate-800 tracking-tight leading-tight">{selectedReg.destino}</p></div>
                </div>
                <div className="text-right space-y-6">
                  <div className={`inline-block px-4 py-2 rounded-xl text-white font-black text-xs uppercase tracking-widest ${selectedReg.risco === 'Alto' ? 'bg-rose-600 animate-pulse' : 'bg-blue-600'}`}>RISCO: {selectedReg.risco}</div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic leading-none">Controle de Tempo</p><div className="space-y-2"><p className="text-xs text-slate-950 font-black uppercase bg-blue-50 p-2 rounded-lg leading-none">ENTRADA: {new Date(selectedReg.dataHora).toLocaleString('pt-BR')}</p>{selectedReg.dataHoraAlta && <p className="text-xs text-emerald-700 font-black uppercase bg-emerald-50 p-2 rounded-lg leading-none">ALTA: {new Date(selectedReg.dataHoraAlta).toLocaleString('pt-BR')}</p>}</div></div>
                </div>
              </div>
              <div className="bg-slate-50 p-10 rounded-[32px] border-2 border-slate-200 shadow-inner">
                <p className="text-[10px] font-black text-blue-600 uppercase mb-4 italic tracking-widest leading-none">Anotações do Plantão Operacional</p>
                <p className="text-sm font-bold leading-relaxed text-slate-700 uppercase tracking-tight whitespace-pre-wrap">{selectedReg.observacoes || 'SEM ANOTAÇÕES ADICIONAIS NESTE PROTOCOLO.'}</p>
              </div>
            </div>
            <div className="mt-12 flex gap-4 no-print border-t pt-8">
              <button onClick={() => window.print()} className="flex-1 py-6 bg-slate-950 text-white rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"><Printer size={22} /> Imprimir Ficha</button>
              <button onClick={() => setDetailModalOpen(false)} className="px-12 py-6 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase hover:bg-slate-200 transition-all">Fechar</button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed bottom-0 left-0 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-64'} right-0 p-3 bg-white/70 backdrop-blur-md border-t text-center text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] italic z-10 no-print transition-all duration-300 leading-none`}>
        SGE PPPG • SISTEMA DE SEGURANÇA INSTITUCIONAL • 2026
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @media print { 
          .no-print { display: none !important; }
          body { background: white !important; }
          aside, header { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; overflow: visible !important; height: auto !important; position: static !important; }
          .rounded-[40px], .rounded-[32px] { border-radius: 8px !important; }
          .bg-slate-50 { background-color: white !important; }
          .border { border-color: #eee !important; }
          .border-2 { border-width: 1px !important; }
        }
      `}</style>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) { createRoot(rootElement).render(<App />); }
