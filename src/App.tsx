import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  MessageSquare,
  Settings,
  Database,
  Activity,
  Users,
  Bot,
  Terminal,
  QrCode,
  ShieldCheck,
  Cpu,
  Calendar,
  Bell,
  CheckCircle2,
  Clock,
  Search,
  Trash2,
  FileText,
  Video,
  XCircle
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { initPushNotifications } from './lib/pushNotifications';

// Configuración dinámica del servidor: Usa la IP del VPS si está definida, si no, usa localhost
const getBackendUrl = () => {
  // URL DEL VPS CON PUERTO 3001 (Sincronizado con .env)
  return 'http://198.251.79.175:3001';
};

const socket = io(getBackendUrl(), {
  transports: ['polling', 'websocket'], // Polling primero es más seguro para redes móviles
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 2000,
  timeout: 60000,           // 60 segundos de paciencia total
});

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [botStatus, setBotStatus] = useState('offline');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ msg: string, type: string, time: string }[]>([]);
  const [instructions, setInstructions] = useState(() => localStorage.getItem('chatbot_instructions') || '');
  const [businessPlan, setBusinessPlan] = useState(() => localStorage.getItem('chatbot_businessPlan') || '');
  const [leads, setLeads] = useState<any[]>([]);
  const [scheduledMsgs, setScheduledMsgs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupSettings, setGroupSettings] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [apiKeysStatus, setApiKeysStatus] = useState<any[]>([]);

  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Scheduling states
  const [schedNum, setSchedNum] = useState('');
  const [schedMsg, setSchedMsg] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedImage, setSchedImage] = useState<string>('');
  const [schedFileName, setSchedFileName] = useState<string>('');
  const [schedFileType, setSchedFileType] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Save feedback states
  const [savingInstructions, setSavingInstructions] = useState(false);
  const [savingBusinessPlan, setSavingBusinessPlan] = useState(false);
  const [saveSuccessInstructions, setSaveSuccessInstructions] = useState(false);
  const [saveSuccessBusinessPlan, setSaveSuccessBusinessPlan] = useState(false);

  useEffect(() => {
    addLog(`🌐 Iniciando conexión a: ${getBackendUrl()}`, 'blue');

    initPushNotifications((token) => {
      socket.emit('register-push-token', token);
    });

    socket.on('connect', () => {
      addLog('🚀 Socket conectado al servidor', 'emerald');
    });

    socket.on('connect_error', (error) => {
      addLog(`❌ Error de conexión Socket: ${error.message}`, 'red');
      console.error('Socket connection error:', error);
    });

    socket.on('whatsapp-qr', (qr) => setQrCode(qr));
    socket.on('whatsapp-status', (status) => {
      const isOnline = status === 'ready';
      setBotStatus(isOnline ? 'online' : 'offline');
      addLog(isOnline ? '✅ Bot conectado y listo' : '❌ Bot desconectado', isOnline ? 'emerald' : 'red');
    });
    socket.on('groups-list', (data) => setGroups(data));
    socket.on('group-settings-list', (data) => setGroupSettings(data));
    socket.on('api-keys-status', (data) => setApiKeysStatus(data));
    socket.on('new-interaction', (data) => {
      addLog(`📩 Mensaje de ${data.from}: ${data.message}`, 'cyan');
      if (data.isSale) {
        addLog(`🔥 VENTA DETECTADA de ${data.from}`, 'emerald');
        addAlert(`🔥 VENTA: ${data.from}`, 'emerald');
      }
    });
    socket.on('lead-alert', () => {
      addLog('🚀 Nuevo lead registrado en Supabase', 'purple');
      fetchLeads();
    });

    fetchLeads();
    fetchScheduled();

    return () => {
      socket.off('api-keys-status');
      socket.off('whatsapp-qr');
      socket.off('whatsapp-status');
      socket.off('groups-list');
      socket.off('new-interaction');
      socket.off('lead-alert');
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'ai') {
      socket.emit('get-api-keys-status');
    }
  }, [activeTab]);

  const fetchLeads = async () => {
    const { data: leadsData } = await supabase.from('leads').select('*').order('last_interaction', { ascending: false });
    if (leadsData) setLeads(leadsData);
  };

  const fetchScheduled = async () => {
    const { data } = await supabase.from('scheduled_messages').select('*').order('schedule_at', { ascending: true });
    if (data) setScheduledMsgs(data);
  };

  const addLog = (msg: string, type: string) => {
    setLogs(prev => [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
  };

  const addAlert = (msg: string, color: string) => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, msg, color }]);
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 5000);
  };

  const handleToggleBot = () => {
    const newState = botStatus === 'online' ? 'offline' : 'online';
    setBotStatus(newState);
    socket.emit('toggle-bot', newState === 'online');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1. Mostrar preview local inmediatamente
      setSchedFileName(file.name);
      setSchedFileType(file.type);
      setSchedImage(URL.createObjectURL(file)); // Preview instantáneo
      setUploadingImage(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error } = await supabase.storage
        .from('bot-assets')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('bot-assets')
        .getPublicUrl(filePath);

      // 2. Actualizar con la URL real de internet
      setSchedImage(publicUrl);
      const isVideo = file.type.startsWith('video/');
      const isPdf = file.type === 'application/pdf';
      addLog(`📁 ${isPdf ? 'PDF' : isVideo ? 'Video' : 'Imagen'} preparado para envío`, 'emerald');
    } catch (err: any) {
      console.error('Error subiendo archivo:', err.message);
      addLog('❌ Error subiendo archivo: Asegúrate de crear el bucket "bot-assets" como público', 'red');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSchedule = async () => {
    const { error } = await supabase.from('scheduled_messages').insert([
      {
        to_number: schedNum,
        message: schedMsg,
        schedule_at: new Date(schedDate).toISOString(),
        image_url: schedImage || null
      }
    ]);
    if (!error) {
      setSchedNum(''); setSchedMsg(''); setSchedDate(''); setSchedImage(''); setSchedFileName(''); setSchedFileType('');
      fetchScheduled();
      addLog('📅 Mensaje programado guardado', 'emerald');
    } else {
      console.error('Error programando:', error.message);
      addLog('❌ Error al programar mensaje', 'red');
    }
  };

  const handleDeleteScheduled = async (id: string, messagePreview: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar este mensaje programado?\n\n"${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}"`)) {
      const { error } = await supabase.from('scheduled_messages').delete().eq('id', id);
      if (!error) {
        addLog('🗑️ Mensaje programado eliminado', 'amber');
        fetchScheduled();
      }
    }
  };

  const handleClearData = async () => {
    const confirm1 = window.confirm("🚨 ¿ESTÁS SEGURO?\n\nEsta acción eliminará TODOS los clientes y el historial de chat permanentemente de la base de datos.");
    if (confirm1) {
      const confirm2 = window.confirm("⚠️ ÚLTIMA ADVERTENCIA\n\nNo podrás recuperar esta información. ¿Deseas continuar con la limpieza absoluta?");
      if (confirm2) {
        try {
          // Eliminar de Supabase (Usamos un filtro que siempre sea cierto para borrar todo)
          await supabase.from('chat_logs').delete().neq('wa_id', '0');
          await supabase.from('leads').delete().neq('wa_id', '0');

          // Limpiar estado local
          setLeads([]);
          setLogs([]);
          addLog('🔥 Base de datos limpiada correctamente', 'red');
          addAlert('Limpieza Completa', 'red');
        } catch (error) {
          console.error('Error al limpiar:', error);
          alert('Hubo un error al intentar limpiar la base de datos.');
        }
      }
    }
  };

  const saveInstructions = () => {
    setSavingInstructions(true);
    socket.emit('update-instructions', instructions);
    setTimeout(() => {
      setSavingInstructions(false);
      setSaveSuccessInstructions(true);
      setTimeout(() => setSaveSuccessInstructions(false), 2000);
    }, 1000);
  };

  const saveBusinessPlan = () => {
    setSavingBusinessPlan(true);
    socket.emit('update-business-plan', businessPlan);
    setTimeout(() => {
      setSavingBusinessPlan(false);
      setSaveSuccessBusinessPlan(true);
      setTimeout(() => setSaveSuccessBusinessPlan(false), 2000);
    }, 1000);
  };

  const handleToggleGroup = (groupId: string, currentActive: boolean, groupName: string) => {
    const existing = groupSettings.find(s => s.group_id === groupId);
    const newConfig = {
      group_id: groupId,
      group_name: groupName,
      is_active: !currentActive,
      custom_prompt: existing?.custom_prompt || ''
    };
    socket.emit('save-group-config', newConfig);
    setGroupSettings(prev => {
      const filtered = prev.filter(s => s.group_id !== groupId);
      return [...filtered, newConfig];
    });
  };

  const handleSaveGroupPrompt = (groupId: string, prompt: string, groupName: string) => {
    const existing = groupSettings.find(s => s.group_id === groupId);
    const newConfig = {
      group_id: groupId,
      group_name: groupName,
      is_active: existing?.is_active ?? false,
      custom_prompt: prompt
    };
    socket.emit('save-group-config', newConfig);
    setGroupSettings(prev => {
      const filtered = prev.filter(s => s.group_id !== groupId);
      return [...filtered, newConfig];
    });
  };

  const refreshGroups = () => {
    setLoadingGroups(true);
    socket.emit('get-groups');
    socket.emit('get-group-settings');
    setTimeout(() => setLoadingGroups(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden">

      {/* Botón del Robotsito - Siempre Fijo en su lugar */}
      <div className="fixed top-0 left-0 z-[100] h-20 w-20 flex items-center justify-center pointer-events-none">
        <button
          onClick={() => setSidebarVisible(!sidebarVisible)}
          className="w-12 h-12 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 cursor-pointer hover:scale-110 active:scale-95 transition-all pointer-events-auto"
        >
          <Bot className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Backdrop para cerrar al hacer clic fuera (Solo visible cuando el sidebar está abierto) */}
      {sidebarVisible && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px] cursor-pointer"
          onClick={() => setSidebarVisible(false)}
        />
      )}

      {/* Sidebar de Iconos - Se desplaza a la izquierda (oculta) o se muestra */}
      <aside
        className={`fixed left-0 top-0 h-full w-20 bg-[#0B0F1A] border-r border-white/5 flex flex-col z-50 transition-transform duration-300 ${sidebarVisible ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-20 flex-shrink-0" />

        <nav className="flex-1 flex flex-col items-center py-6 gap-6">
          <IconNavItem icon={<Activity className="w-6 h-6" />} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <IconNavItem icon={<MessageSquare className="w-6 h-6" />} active={activeTab === 'groups_ai'} onClick={() => { setActiveTab('groups_ai'); refreshGroups(); }} />
          <IconNavItem icon={<Calendar className="w-6 h-6" />} active={activeTab === 'scheduled'} onClick={() => setActiveTab('scheduled')} />
          <IconNavItem icon={<Users className="w-6 h-6" />} active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
          <IconNavItem icon={<Database className="w-6 h-6" />} active={activeTab === 'kb'} onClick={() => setActiveTab('kb')} />
          <IconNavItem icon={<Cpu className="w-6 h-6" />} active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
        </nav>

        <div className="py-6 border-t border-white/5 mb-2 flex justify-center">
          <IconNavItem icon={<Settings className="w-6 h-6" />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 min-h-screen ${sidebarVisible ? 'md:pl-20' : 'pl-0'}`}>
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-4 sm:px-8 bg-[#030712]/50 backdrop-blur-md sticky top-0 z-40">
          <div className={`${sidebarVisible ? 'pl-16 md:pl-0' : 'pl-16'} transition-all duration-300`}>
            <h1 className="text-[10px] sm:text-sm font-medium text-slate-400 capitalize">{activeTab}</h1>
            <h2 className="text-lg sm:text-xl font-semibold text-white truncate max-w-[150px] sm:max-w-none">BusinessChat Admin</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${botStatus === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              <div className={`w-2 h-2 rounded-full ${botStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs font-bold uppercase tracking-widest">{botStatus === 'online' ? 'Bot Activo' : 'Bot Apagado'}</span>
              <button
                onClick={handleToggleBot}
                className={`ml-2 p-1 rounded-lg transition-colors ${botStatus === 'online' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
              >
                {botStatus === 'online' ? <ShieldCheck className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Mensajes Hoy" value={logs.length.toString()} change="+100%" icon={<MessageSquare className="text-cyan-400" />} />
                <StatCard title="Leads Activos" value={leads.length.toString()} change="+Lead" icon={<Users className="text-purple-400" />} />
                <StatCard title="Intenciones de Venta" value={leads.filter(l => l.status === 'hot_lead').length.toString()} change="+🔥" icon={<Bell className="text-emerald-400" />} />
                <StatCard title="Bot Status" value={botStatus} change="OK" icon={<CheckCircle2 className="text-amber-400" />} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-[#0B0F1A] border border-white/5 rounded-3xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-cyan-400" />
                    Conexión WhatsApp
                  </h3>
                  <div className="aspect-square bg-white rounded-2xl flex items-center justify-center p-4 mb-6 shadow-inner overflow-hidden">
                    {qrCode ? (
                      <div className="bg-white p-2 rounded-lg">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}&size=300x300`}
                          alt="WhatsApp QR"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-400 text-sm text-center px-4">
                        <QrCode className="w-12 h-12 mb-2 opacity-20" />
                        {botStatus === 'online' ? '✅ Conectado' : 'Esperando QR...'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-[#0B0F1A] border border-white/5 rounded-3xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    Consola de Eventos
                  </h3>
                  <div className="bg-black/40 rounded-2xl p-4 font-mono text-[10px] sm:text-xs h-[400px] overflow-y-auto space-y-2 border border-white/5">
                    {logs.length === 0 ? (
                      <div className="text-slate-500 italic">Esperando eventos...</div>
                    ) : (
                      logs.map((log, i) => (
                        <div key={i} className={`text-${log.type}-500/80`}>
                          <span className="opacity-40">[{log.time}]</span> {log.msg}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'clients' && (
            <div className="grid gap-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative group flex-1">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por cliente o ID de WhatsApp..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#0B0F1A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all shadow-xl"
                  />
                </div>
                <button
                  onClick={handleClearData}
                  className="px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                  title="Borrar todo el historial y clientes"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Limpiar Base de Datos</span>
                </button>
              </div>

              <div className="bg-[#0B0F1A] border border-white/5 rounded-3xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[600px] sm:min-w-full">
                  <thead className="bg-[#121826] border-b border-white/5">
                    <tr>
                      <th className="px-4 sm:px-8 py-4 text-xs font-bold text-slate-500 uppercase">Cliente</th>
                      <th className="px-4 sm:px-8 py-4 text-xs font-bold text-slate-500 uppercase">ID WhatsApp</th>
                      <th className="px-4 sm:px-8 py-4 text-xs font-bold text-slate-500 uppercase">Estado</th>
                      <th className="hidden lg:table-cell px-8 py-4 text-xs font-bold text-slate-500 uppercase">Última Vez</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads
                      .filter(lead =>
                        lead.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.wa_id?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((lead, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors text-sm sm:text-base">
                          <td className="px-4 sm:px-8 py-4 font-medium text-white">{lead.customer_name}</td>
                          <td className="px-4 sm:px-8 py-4 text-slate-400 font-mono text-[10px] sm:text-xs">{lead.wa_id}</td>
                          <td className="px-4 sm:px-8 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${lead.status === 'hot_lead' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                              {lead.status === 'hot_lead' ? '🔥 Venta Potencial' : '👤 Prospecto'}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell px-8 py-4 text-slate-500 text-xs">{new Date(lead.last_interaction).toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'scheduled' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-[#0B0F1A] border border-white/5 rounded-3xl p-6">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" /> Nuevo Envío Programado
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Destinatario</label>
                    <input
                      value={schedNum}
                      onChange={e => setSchedNum(e.target.value)}
                      type="text"
                      placeholder="Número o ID de Grupo..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-cyan-500/50 outline-none"
                    />
                  </div>

                  {groups.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold px-1">O selecciona un grupo</label>
                      <select
                        onChange={(e) => setSchedNum(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-cyan-500/50 outline-none text-slate-300"
                        defaultValue=""
                      >
                        <option value="" disabled>Selecciona un grupo...</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Mensaje</label>
                    <textarea
                      value={schedMsg}
                      onChange={e => setSchedMsg(e.target.value)}
                      placeholder="Escribe el mensaje aquí..."
                      className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-cyan-500/50 outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Fecha y Hora</label>
                    <input
                      value={schedDate}
                      onChange={e => setSchedDate(e.target.value)}
                      type="datetime-local"
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-cyan-500/50 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Archivo (Opcional - Imagen, Video o PDF)</label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*,video/*,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="media-upload"
                      />
                      <label
                        htmlFor="media-upload"
                        className={`w-full p-3 bg-black/40 border border-dashed border-white/10 rounded-xl text-xs text-center cursor-pointer hover:border-cyan-500/50 transition-all ${uploadingImage ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {uploadingImage ? 'Subiendo...' : schedImage ? '✅ Archivo Listo' : '📁 Seleccionar Archivo'}
                      </label>
                      {schedImage && (
                        <div className="relative w-full p-4 bg-black/20 rounded-xl overflow-hidden border border-white/5 flex items-center gap-3">
                          {schedFileType === 'application/pdf' ? (
                            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-red-500" />
                            </div>
                          ) : schedFileType.startsWith('video/') ? (
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <Video className="w-6 h-6 text-blue-500" />
                            </div>
                          ) : (
                            <img src={schedImage} className="w-10 h-10 object-cover rounded-lg" alt="Preview" />
                          )}
                          <div className="flex-1 truncate">
                            <div className="text-[10px] text-white font-bold truncate">{schedFileName || 'Archivo seleccionado'}</div>
                            <div className="text-[8px] text-slate-500 truncate">{schedImage}</div>
                          </div>
                          <button
                            onClick={() => {
                              setSchedImage('');
                              setSchedFileName('');
                              setSchedFileType('');
                              const fileInput = document.getElementById('media-upload') as HTMLInputElement;
                              if (fileInput) fileInput.value = '';
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all text-[10px] font-bold"
                            title="Quitar archivo"
                          >
                            <XCircle className="w-3 h-3" />
                            Quitar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSchedule}
                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/10 active:scale-[0.98]"
                  >
                    Programar Mensaje
                  </button>
                </div>
              </div>
              <div className="lg:col-span-2 bg-[#0B0F1A] border border-white/5 rounded-3xl p-6">
                <h3 className="text-white font-bold mb-6">Próximos Envíos</h3>
                <div className="space-y-3">
                  {scheduledMsgs.length === 0 ? (
                    <div className="text-slate-500 text-sm italic text-center py-8">No hay mensajes programados</div>
                  ) : (
                    scheduledMsgs.map((msg, i) => (
                      <div key={i} className="p-4 bg-white/5 rounded-2xl flex justify-between items-center group">
                        <div className="flex-1 mr-4">
                          <div className="text-sm font-bold text-white">{msg.to_number}</div>
                          <div className="text-xs text-slate-500 truncate max-w-xs">{msg.message}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`text-[10px] font-bold uppercase ${msg.status === 'sent' ? 'text-emerald-500' : 'text-amber-500'}`}>{msg.status}</div>
                            <div className="text-[10px] text-slate-500">{new Date(msg.schedule_at).toLocaleString()}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteScheduled(msg.id, msg.message)}
                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                            title="Eliminar programación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'groups_ai' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B0F1A] p-6 rounded-3xl border border-white/5">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-cyan-400" />
                    IA en Grupos de WhatsApp
                  </h3>
                  <p className="text-sm text-slate-500">Activa el bot en grupos específicos y dales una personalidad única.</p>
                </div>
                <button
                  onClick={refreshGroups}
                  disabled={loadingGroups}
                  className={`bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center gap-2 ${loadingGroups ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <Activity className={`w-4 h-4 ${loadingGroups ? 'animate-spin' : ''}`} />
                  {loadingGroups ? 'Escaneando...' : 'Escanear Grupos'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {groups.length === 0 ? (
                  <div className="col-span-full bg-[#0B0F1A] border border-white/5 rounded-3xl p-12 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    Haz clic en "Escanear Grupos" para ver tus conversaciones grupales.
                  </div>
                ) : (
                  groups.map((group) => {
                    const setting = groupSettings.find(s => s.group_id === group.id);
                    const isActive = setting?.is_active ?? false;
                    return (
                      <div key={group.id} className={`bg-[#0B0F1A] border rounded-3xl p-6 transition-all ${isActive ? 'border-cyan-500/30 ring-1 ring-cyan-500/20' : 'border-white/5 opacity-80'}`}>
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center text-cyan-400">
                              <Users className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white leading-tight">{group.name}</h4>
                              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{group.id.split('@')[0]}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleGroup(group.id, isActive, group.name)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                          >
                            {isActive ? '🤖 IA Activa' : 'Ignorar'}
                          </button>
                        </div>

                        {isActive && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 uppercase font-bold px-1 flex items-center gap-1">
                                <Cpu className="w-3 h-3" /> Prompt para este Grupo
                              </label>
                              <textarea
                                defaultValue={setting?.custom_prompt || ''}
                                onBlur={(e) => handleSaveGroupPrompt(group.id, e.target.value, group.name)}
                                placeholder="Escribe las instrucciones únicas para este grupo..."
                                className="w-full h-24 bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-slate-300 focus:border-cyan-500/50 outline-none resize-none transition-all"
                              />
                            </div>
                            <div className="text-[10px] text-cyan-400 italic">
                              * El bot solo responderá en este grupo usando las instrucciones de arriba.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          {activeTab === 'kb' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#0B0F1A] border border-white/5 rounded-3xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Instrucciones de Comportamiento</h3>
                      <p className="text-sm text-slate-500">Define cómo debe actuar y responder la IA</p>
                    </div>
                  </div>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full h-[300px] bg-black/20 border border-white/10 rounded-2xl p-4 text-slate-300 focus:outline-none focus:border-purple-500/50 transition-colors resize-none mb-4"
                    placeholder="Ej: Eres un asistente de ventas experto. Tu tono es profesional pero cercano..."
                  />
                  <button
                    onClick={saveInstructions}
                    disabled={savingInstructions}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${saveSuccessInstructions
                      ? 'bg-green-600 text-white'
                      : savingInstructions
                        ? 'bg-purple-600/50 text-white/70 cursor-wait'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                  >
                    {savingInstructions ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Guardando...
                      </>
                    ) : saveSuccessInstructions ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        ¡Guardado!
                      </>
                    ) : (
                      'Guardar Personalidad'
                    )}
                  </button>
                </div>

                <div className="bg-[#0B0F1A] border border-white/5 rounded-3xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Información del Negocio</h3>
                      <p className="text-sm text-slate-500">Pega aquí tu plan de negocios, precios y FAQs</p>
                    </div>
                  </div>
                  <textarea
                    value={businessPlan}
                    onChange={(e) => setBusinessPlan(e.target.value)}
                    className="w-full h-[300px] bg-black/20 border border-white/10 rounded-2xl p-4 text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none mb-4"
                    placeholder="Pega aquí toda la información que la IA debe conocer..."
                  />
                  <button
                    onClick={saveBusinessPlan}
                    disabled={savingBusinessPlan}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${saveSuccessBusinessPlan
                      ? 'bg-green-600 text-white'
                      : savingBusinessPlan
                        ? 'bg-emerald-600/50 text-white/70 cursor-wait'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                  >
                    {savingBusinessPlan ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Guardando...
                      </>
                    ) : saveSuccessBusinessPlan ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        ¡Guardado!
                      </>
                    ) : (
                      'Actualizar Conocimiento'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#0B0F1A] border border-white/5 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Cpu className="w-6 h-6 text-purple-400" />
                      Rendimiento de APIs
                    </h3>
                    <p className="text-sm text-slate-500">Monitoreo en tiempo real de los límites y rotación de llaves.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {apiKeysStatus && apiKeysStatus.length > 0 ? (
                    apiKeysStatus.map((key) => {
                      const percentage = Math.round((key.used / key.total) * 100);
                      return (
                        <div key={key.id} className="bg-black/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">API Key #{key.id + 1}</div>
                              <div className="text-xs font-mono text-slate-300">{key.keyHash}</div>
                            </div>
                            <div className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase ${key.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' :
                              key.status === 'error' ? 'bg-red-500/20 text-red-500' :
                                'bg-white/5 text-slate-500'
                              }`}>
                              {key.status}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-400">Uso de Sesión</span>
                              <span className={percentage > 80 ? 'text-amber-400' : 'text-cyan-400'}>{percentage}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${key.status === 'error' ? 'bg-red-500' :
                                  percentage > 80 ? 'bg-amber-500' : 'bg-cyan-500'
                                  }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-500 uppercase tracking-tighter">
                              <span>{key.used} reqs</span>
                              <span>{key.total} límite est.</span>
                            </div>
                          </div>

                          {key.lastError && (
                            <div className="mt-4 text-[9px] text-red-400/80 bg-red-400/5 p-2 rounded-lg border border-red-500/10 italic">
                              Error: {key.lastError}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-12 text-center text-slate-500 italic">
                      Conectando con el servidor para obtener el estado de las APIs...
                    </div>
                  )}
                </div>

                <div className="mt-12 pt-8 border-t border-white/5">
                  <h4 className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-6 flex items-center gap-2">
                    <Settings className="w-3 h-3 text-cyan-400" /> DATOS DE SERVICIO
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 group hover:bg-white/[0.04] transition-colors">
                      <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Servidor Localización</div>
                      <div className="text-[9px] text-slate-400 font-mono leading-tight break-all uppercase">c:\Ackerman3\susefull\chatBot\services</div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 group hover:bg-white/[0.04] transition-colors">
                      <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Dirección IP</div>
                      <div className="text-[10px] text-cyan-500/80 font-mono font-bold">198.251.79.175</div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 group hover:bg-white/[0.04] transition-colors">
                      <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Protocolos de Acceso</div>
                      <div className="text-[10px] text-slate-300 font-mono">SSH & SFTP (Encrypted)</div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 group hover:bg-white/[0.04] transition-colors">
                      <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Proxy Gate</div>
                      <div className="text-[10px] text-amber-500/80 font-mono">AES-256-GCM / 10.0.8.1</div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 group hover:bg-white/[0.04] transition-colors">
                      <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Base Analytics</div>
                      <div className="text-[10px] text-slate-300">Supabase: Analytics Active</div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 group hover:bg-white/[0.04] transition-colors">
                      <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Push Engine</div>
                      <div className="text-[10px] text-slate-300">Firebase: Notificaciones FCM</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Alertas */}
      <div className="fixed top-24 right-8 z-[100] space-y-3 pointer-events-none">
        {alerts.map(alert => (
          <div key={alert.id} className={`p-4 rounded-2xl bg-[#0B0F1A] border border-${alert.color}-500/30 flex items-center gap-3 shadow-2xl animate-in fade-in`}>
            <div className={`w-2 h-2 rounded-full bg-${alert.color}-500 animate-ping`} />
            <span className="text-white font-medium">{alert.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconNavItem({ icon, active, onClick }: { icon: any, active: boolean, onClick: any }) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 group ${active
        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5'
        : 'text-slate-500 hover:bg-white/5 hover:text-white border border-transparent'
        }`}
    >
      <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110 group-active:scale-95'}`}>
        {icon}
      </div>
    </button>
  );
}

function StatCard({ title, value, change, icon }: any) {
  return (
    <div className="bg-[#0B0F1A] border border-white/5 rounded-3xl p-6">
      <div className="flex justify-between mb-4">
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">{icon}</div>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{change}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{title}</div>
    </div>
  );
}

export default App;
