import { useState, useEffect } from "react";

// ============================================================
// INSTRUÇÕES PARA USAR ESTE SISTEMA:
//
// Este arquivo usa Firebase real. Para funcionar, você precisa:
// 1. Hospedar este app (ex: Vercel, Netlify - gratuito)
// 2. As chaves já estão configuradas abaixo
//
// PRIMEIRO ACESSO - Criar usuários no Firebase Console:
// Authentication > Users > Add user
// ============================================================

// Firebase SDK via CDN (carregado dinamicamente)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAYzpiUB-GDTVn9206NbT9volLPq7ocyhg",
  authDomain: "sp-traducoes-orcamentos.firebaseapp.com",
  projectId: "sp-traducoes-orcamentos",
  storageBucket: "sp-traducoes-orcamentos.firebasestorage.app",
  messagingSenderId: "216860284289",
  appId: "1:216860284289:web:370c6540d0a504870a8480"
};

// ============================================================
// FIREBASE LOADER
// ============================================================
let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;

async function loadFirebase() {
  if (firebaseApp) return { db: firestoreDb, auth: firebaseAuth };
  
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
  const { getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, collection, query, orderBy, onSnapshot, runTransaction, increment } = 
    await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
  const { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } = 
    await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");

  firebaseApp = initializeApp(FIREBASE_CONFIG);
  firestoreDb = getFirestore(firebaseApp);
  firebaseAuth = getAuth(firebaseApp);

  window._firebase = {
    db: firestoreDb, auth: firebaseAuth,
    doc, getDoc, setDoc, addDoc, updateDoc, collection, query, orderBy, onSnapshot, runTransaction, increment,
    signInWithEmailAndPassword, signOut, onAuthStateChanged
  };

  return { db: firestoreDb, auth: firebaseAuth };
}

// ============================================================
// UTILITIES
// ============================================================
const formatCurrency = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const formatDate = (d) => {
  if (!d) return "-";
  const date = d?.toDate ? d.toDate() : new Date(d);
  return date.toLocaleDateString("pt-BR");
};
const today = new Date();

const getStatusColor = (status) => {
  const map = {
    "Em Aberto": "#3B82F6", "Vendido": "#8B5CF6", "Em Andamento": "#F59E0B",
    "Aguardando Cliente": "#EC4899", "Entregue": "#10B981", "Faturado": "#059669", "Cancelado": "#EF4444",
  };
  return map[status] || "#6B7280";
};

const getDaysUntil = (d) => {
  if (!d) return null;
  const date = d?.toDate ? d.toDate() : new Date(d);
  return Math.ceil((date - today) / (1000 * 60 * 60 * 24));
};

// ============================================================
// COMPONENTS
// ============================================================
const Badge = ({ status }) => (
  <span style={{
    background: getStatusColor(status) + "20", color: getStatusColor(status),
    border: `1px solid ${getStatusColor(status)}40`, padding: "2px 10px",
    borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, whiteSpace: "nowrap",
  }}>{status}</span>
);

const DeadlineAlert = ({ dataEntrega }) => {
  const days = getDaysUntil(dataEntrega);
  if (days === null) return null;
  if (days < 0) return <span style={{ color: "#EF4444", fontSize: 11, fontWeight: 700 }}>⚠ Atrasado {Math.abs(days)}d</span>;
  if (days === 0) return <span style={{ color: "#EF4444", fontSize: 11, fontWeight: 700 }}>🔴 Entrega hoje!</span>;
  if (days === 1) return <span style={{ color: "#F59E0B", fontSize: 11, fontWeight: 700 }}>🟡 Entrega amanhã</span>;
  if (days <= 3) return <span style={{ color: "#F59E0B", fontSize: 11, fontWeight: 700 }}>🟡 {days}d para entrega</span>;
  return null;
};

// ============================================================
// LOGIN
// ============================================================
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const { auth, signInWithEmailAndPassword, db, doc, getDoc } = window._firebase;
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "usuarios", cred.user.uid));
      if (userDoc.exists()) {
        onLogin({ id: cred.user.uid, email: cred.user.email, ...userDoc.data() });
      } else {
        setError("Usuário não configurado. Contate o administrador.");
      }
    } catch (e) {
      setError("Email ou senha incorretos.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif",
      position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #3B82F620 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, left: -100, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #10B98115 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{
        background: "rgba(30,41,59,0.9)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24,
        padding: "48px 40px", width: "100%", maxWidth: 400,
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, background: "linear-gradient(135deg, #3B82F6, #10B981)",
            borderRadius: 16, margin: "0 auto 16px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 24, fontWeight: 900, color: "white"
          }}>SP</div>
          <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0 }}>SP Traduções</h1>
          <p style={{ color: "#64748B", fontSize: 13, margin: "6px 0 0" }}>Sistema de Orçamentos</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
              style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#3B82F6"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
          </div>
          <div>
            <label style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#3B82F6"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
          </div>
          {error && <p style={{ color: "#EF4444", fontSize: 13, margin: 0, textAlign: "center" }}>{error}</p>}
          <button onClick={handleLogin} disabled={loading} style={{
            padding: 13, borderRadius: 10, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "white",
            fontSize: 15, fontWeight: 700, marginTop: 6, boxShadow: "0 4px 15px rgba(59,130,246,0.4)",
            opacity: loading ? 0.7 : 1
          }}>{loading ? "Entrando..." : "Entrar"}</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SIDEBAR
// ============================================================
const Sidebar = ({ currentUser, activePage, setActivePage, onLogout }) => {
  const menuItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    ...(currentUser.role !== "financeiro" ? [
      { id: "novo-orcamento", icon: "➕", label: "Novo Orçamento" },
      { id: "orcamentos", icon: "📋", label: "Orçamentos" },
    ] : []),
    { id: "financeiro", icon: "💰", label: currentUser.role === "financeiro" ? "Painel Financeiro" : "Financeiro" },
    ...(currentUser.role === "admin" ? [{ id: "usuarios", icon: "👥", label: "Usuários" }] : []),
  ];

  return (
    <div style={{ width: 220, minHeight: "100vh", background: "#0F172A", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3B82F6, #10B981)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "white" }}>SP</div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 13 }}>SP Traduções</div>
            <div style={{ color: "#475569", fontSize: 11 }}>Orçamentos</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ color: "#94A3B8", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Logado como</div>
        <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{currentUser.name}</div>
        <div style={{ display: "inline-block", marginTop: 4, padding: "2px 8px", borderRadius: 20, background: currentUser.role === "admin" ? "#3B82F620" : currentUser.role === "financeiro" ? "#10B98120" : "#8B5CF620", color: currentUser.role === "admin" ? "#3B82F6" : currentUser.role === "financeiro" ? "#10B981" : "#8B5CF6", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{currentUser.role}</div>
      </div>
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setActivePage(item.id)} style={{
            width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10,
            background: activePage === item.id ? "rgba(59,130,246,0.15)" : "transparent",
            color: activePage === item.id ? "#3B82F6" : "#64748B",
            fontSize: 13, fontWeight: activePage === item.id ? 700 : 500, marginBottom: 2, textAlign: "left",
            borderLeft: activePage === item.id ? "2px solid #3B82F6" : "2px solid transparent"
          }}>
            <span>{item.icon}</span><span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div style={{ padding: "16px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onLogout} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: "transparent", color: "#475569", fontSize: 13, textAlign: "left", display: "flex", gap: 10 }}>
          <span>🚪</span><span>Sair</span>
        </button>
      </div>
    </div>
  );
};

// ============================================================
// DASHBOARD
// ============================================================
const Dashboard = ({ orcamentos, currentUser, usuarios }) => {
  const myOrcs = currentUser.role === "admin" ? orcamentos : orcamentos.filter(o => o.vendedorId === currentUser.id);
  const totalVendido = myOrcs.filter(o => ["Vendido","Em Andamento","Entregue","Faturado"].includes(o.status)).reduce((s,o) => s+o.valor, 0);
  const emAberto = myOrcs.filter(o => o.status === "Em Aberto").length;
  const emAndamento = myOrcs.filter(o => o.status === "Em Andamento").length;
  const taxaConversao = myOrcs.length > 0 ? Math.round((myOrcs.filter(o => o.status !== "Em Aberto" && o.status !== "Cancelado").length / myOrcs.length) * 100) : 0;

  const alertas = myOrcs.filter(o => {
    if (!o.dataEntrega || ["Entregue","Faturado","Cancelado"].includes(o.status)) return false;
    const days = getDaysUntil(o.dataEntrega);
    return days !== null && days <= 3;
  });

  const vendedores = usuarios.filter(u => u.role === "vendedor");
  const ranking = currentUser.role === "admin" ? vendedores.map(u => ({
    nome: u.name,
    total: orcamentos.filter(o => o.vendedorId === u.id && ["Vendido","Em Andamento","Entregue","Faturado"].includes(o.status)).reduce((s,o) => s+o.valor, 0),
    qtd: orcamentos.filter(o => o.vendedorId === u.id && o.status !== "Em Aberto").length
  })).sort((a,b) => b.total - a.total) : [];

  const statusCounts = ["Em Aberto","Em Andamento","Entregue","Faturado","Cancelado"].map(s => ({ status: s, count: myOrcs.filter(o => o.status === s).length }));

  // Agrupamento por mês
  const mesesLabels = [];
  const mesesValores = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const mes = d.toLocaleString("pt-BR", { month: "short" });
    const m = d.getMonth(), y = d.getFullYear();
    const val = myOrcs.filter(o => {
      if (!["Vendido","Em Andamento","Entregue","Faturado"].includes(o.status)) return false;
      const od = o.criadoEm?.toDate ? o.criadoEm.toDate() : new Date(o.criadoEm);
      return od.getMonth() === m && od.getFullYear() === y;
    }).reduce((s,o) => s+o.valor, 0);
    mesesLabels.push(mes); mesesValores.push(val);
  }
  const maxVal = Math.max(...mesesValores, 1);

  return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif" }}>
      <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 24px" }}>Dashboard {currentUser.role === "admin" ? "— Visão Geral" : `— ${currentUser.name}`}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Vendido", value: formatCurrency(totalVendido), icon: "💰", color: "#10B981" },
          { label: "Em Aberto", value: emAberto, icon: "📋", color: "#3B82F6" },
          { label: "Em Andamento", value: emAndamento, icon: "⚙️", color: "#F59E0B" },
          { label: "Taxa Conversão", value: `${taxaConversao}%`, icon: "📈", color: "#8B5CF6" },
        ].map((card,i) => (
          <div key={i} style={{ background: "#1E293B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "#64748B", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{card.label}</div>
                <div style={{ color: card.color, fontSize: 24, fontWeight: 800, marginTop: 6 }}>{card.value}</div>
              </div>
              <div style={{ width: 40, height: 40, background: card.color+"15", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#1E293B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>Performance Mensal (R$)</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
            {mesesLabels.map((m,i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: "100%", borderRadius: 6, height: `${Math.max(6, (mesesValores[i]/maxVal)*100)}px`, background: i===5 ? "linear-gradient(180deg,#3B82F6,#2563EB)" : "rgba(59,130,246,0.25)" }} />
                <div style={{ fontSize: 11, color: i===5?"#3B82F6":"#475569", fontWeight: i===5?700:400 }}>{m}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#1E293B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Por Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {statusCounts.map((s,i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: getStatusColor(s.status) }} />
                  <span style={{ color: "#94A3B8", fontSize: 13 }}>{s.status}</span>
                </div>
                <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: alertas.length>0?"1fr 1fr":"1fr", gap: 16 }}>
        {alertas.length > 0 && (
          <div style={{ background: "#1E293B", border: "1px solid #F59E0B30", borderRadius: 16, padding: 24 }}>
            <h3 style={{ color: "#F59E0B", fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>⚠ Alertas de Prazo</h3>
            {alertas.map(o => (
              <div key={o.id} style={{ background: "rgba(245,158,11,0.08)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{o.orcNum}</div>
                  <div style={{ color: "#64748B", fontSize: 12 }}>{o.cliente}</div>
                </div>
                <DeadlineAlert dataEntrega={o.dataEntrega} />
              </div>
            ))}
          </div>
        )}
        {currentUser.role === "admin" && ranking.length > 0 && (
          <div style={{ background: "#1E293B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
            <h3 style={{ color: "white", fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>🏆 Ranking de Vendedores</h3>
            {ranking.map((v,i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: i===0?"rgba(251,191,36,0.08)":"rgba(255,255,255,0.03)", borderRadius: 10, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>{i===0?"🥇":i===1?"🥈":"🥉"}</span>
                  <div>
                    <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{v.nome}</div>
                    <div style={{ color: "#64748B", fontSize: 11 }}>{v.qtd} serviços</div>
                  </div>
                </div>
                <div style={{ color: "#10B981", fontWeight: 700, fontSize: 14 }}>{formatCurrency(v.total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// NOVO ORÇAMENTO
// ============================================================
const NovoOrcamento = ({ currentUser, onSave }) => {
  const [form, setForm] = useState({ cliente:"", empresa:"", cpfCnpj:"", tel:"", email:"", servicos:[], idiomasDe:"", idiomasPara:"", qtdDocumentos:"", arquivos:"", valor:"", prazo:"", formato:"", pagamento:"", dataEntrega:"", observacaoInterna:"" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);

  const servicosList = ["Tradução Juramentada","Tradução Técnica","Tradução Certificada","Tradução Consecutiva","Tradução Simultânea"];
  const formatosList = ["PDF com Assinatura Digital","Impresso Assinatura Física","Simples"];
  const pagamentosList = ["PIX","Boleto e NF","Boleto","MENSALISTA"];

  const toggleServico = (s) => setForm(f => ({ ...f, servicos: f.servicos.includes(s) ? f.servicos.filter(x=>x!==s) : [...f.servicos,s] }));

  const validate = () => {
    const e = {};
    if (!form.cliente) e.cliente="Obrigatório"; if (!form.empresa) e.empresa="Obrigatório";
    if (!form.cpfCnpj) e.cpfCnpj="Obrigatório"; if (!form.tel) e.tel="Obrigatório";
    if (!form.email) e.email="Obrigatório"; if (form.servicos.length===0) e.servicos="Selecione ao menos um";
    if (!form.idiomasDe) e.idiomasDe="Obrigatório"; if (!form.idiomasPara) e.idiomasPara="Obrigatório";
    if (!form.qtdDocumentos) e.qtdDocumentos="Obrigatório"; if (!form.valor) e.valor="Obrigatório";
    if (!form.prazo) e.prazo="Obrigatório"; if (!form.formato) e.formato="Obrigatório";
    if (!form.pagamento) e.pagamento="Obrigatório";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length>0) { setErrors(e); return; }
    setSaving(true);
    try {
      const { db, doc, getDoc, setDoc, addDoc, collection, runTransaction, increment } = window._firebase;
      const year = new Date().getFullYear().toString().slice(-2);

      // Transação atômica para pegar número sequencial
      const counterRef = doc(db, "contadores", "orcamentos");
      let newNum;
      await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        if (!counterDoc.exists()) {
          newNum = 1;
          transaction.set(counterRef, { atual: 1 });
        } else {
          newNum = counterDoc.data().atual + 1;
          transaction.update(counterRef, { atual: increment(1) });
        }
      });

      const orcNum = `ORC ${String(newNum).padStart(4,"0")}/${year}`;
      const newOrc = {
        orcNum, refNum: null, status: "Em Aberto",
        ...form, valor: parseFloat(form.valor.replace(",",".")),
        vendedorId: currentUser.id, vendedorNome: currentUser.name,
        criadoEm: new Date(),
        dataEntrega: form.dataEntrega ? new Date(form.dataEntrega) : null,
      };

      await addDoc(collection(db, "orcamentos"), newOrc);
      setSaved(orcNum);
    } catch(err) {
      alert("Erro ao salvar: "+err.message);
    }
    setSaving(false);
  };

  if (saved) return (
    <div style={{ padding:28, display:"flex", alignItems:"center", justifyContent:"center", minHeight:400 }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
        <h2 style={{ color:"white", fontSize:22, fontWeight:700, margin:"0 0 8px" }}>Orçamento Criado!</h2>
        <p style={{ color:"#64748B", fontSize:14 }}>{saved} gerado com sucesso.</p>
        <button onClick={() => { setSaved(null); setForm({cliente:"",empresa:"",cpfCnpj:"",tel:"",email:"",servicos:[],idiomasDe:"",idiomasPara:"",qtdDocumentos:"",arquivos:"",valor:"",prazo:"",formato:"",pagamento:"",dataEntrega:"",observacaoInterna:""}); }} style={{ marginTop:16, padding:"10px 24px", borderRadius:10, border:"none", background:"#3B82F6", color:"white", fontSize:14, fontWeight:700, cursor:"pointer" }}>Novo Orçamento</button>
      </div>
    </div>
  );

  const inputStyle = (err) => ({ width:"100%", padding:"10px 12px", borderRadius:10, boxSizing:"border-box", background:"rgba(255,255,255,0.05)", border:`1px solid ${err?"#EF4444":"rgba(255,255,255,0.1)"}`, color:"white", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif" });
  const labelStyle = { color:"#94A3B8", fontSize:11, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase", display:"block", marginBottom:6 };
  const errStyle = { color:"#EF4444", fontSize:11, marginTop:4 };

  return (
    <div style={{ padding:28, fontFamily:"'DM Sans',sans-serif", maxWidth:900 }}>
      <h2 style={{ color:"white", fontSize:22, fontWeight:700, margin:"0 0 24px" }}>Novo Orçamento</h2>
      <div style={{ background:"#1E293B", border:"1px solid rgba(255,255,255,0.06)", borderRadius:20, padding:28 }}>
        <h3 style={{ color:"#3B82F6", fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:1, margin:"0 0 16px" }}>Dados do Cliente</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
          {[["cliente","Nome do Cliente"],["empresa","Nome da Empresa"],["cpfCnpj","CPF / CNPJ"],["tel","Telefone"]].map(([k,l]) => (
            <div key={k}><label style={labelStyle}>{l} *</label><input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={inputStyle(errors[k])} />{errors[k]&&<div style={errStyle}>{errors[k]}</div>}</div>
          ))}
          <div style={{ gridColumn:"1/-1" }}><label style={labelStyle}>Email *</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={inputStyle(errors.email)} />{errors.email&&<div style={errStyle}>{errors.email}</div>}</div>
        </div>

        <h3 style={{ color:"#3B82F6", fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:1, margin:"0 0 16px" }}>Tipo de Serviço *</h3>
        <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:24 }}>
          {servicosList.map(s => (
            <button key={s} onClick={()=>toggleServico(s)} style={{ padding:"8px 16px", borderRadius:20, border:"none", cursor:"pointer", background:form.servicos.includes(s)?"#3B82F6":"rgba(255,255,255,0.06)", color:form.servicos.includes(s)?"white":"#64748B", fontSize:13, fontWeight:form.servicos.includes(s)?700:400 }}>{s}</button>
          ))}
        </div>
        {errors.servicos&&<div style={{...errStyle,marginTop:-16,marginBottom:16}}>{errors.servicos}</div>}

        <h3 style={{ color:"#3B82F6", fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:1, margin:"0 0 16px" }}>Idiomas</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:24 }}>
          <div><label style={labelStyle}>Idioma De *</label><input placeholder="Ex: Inglês" value={form.idiomasDe} onChange={e=>setForm(f=>({...f,idiomasDe:e.target.value}))} style={inputStyle(errors.idiomasDe)} />{errors.idiomasDe&&<div style={errStyle}>{errors.idiomasDe}</div>}</div>
          <div><label style={labelStyle}>Idioma Para *</label><input placeholder="Ex: Português" value={form.idiomasPara} onChange={e=>setForm(f=>({...f,idiomasPara:e.target.value}))} style={inputStyle(errors.idiomasPara)} />{errors.idiomasPara&&<div style={errStyle}>{errors.idiomasPara}</div>}</div>
          <div><label style={labelStyle}>Qtd. Documentos *</label><input type="number" value={form.qtdDocumentos} onChange={e=>setForm(f=>({...f,qtdDocumentos:e.target.value}))} style={inputStyle(errors.qtdDocumentos)} />{errors.qtdDocumentos&&<div style={errStyle}>{errors.qtdDocumentos}</div>}</div>
        </div>

        <div style={{ marginBottom:24 }}><label style={labelStyle}>Nome dos Arquivos (opcional)</label><textarea value={form.arquivos} onChange={e=>setForm(f=>({...f,arquivos:e.target.value}))} rows={2} style={{...inputStyle(false),resize:"vertical"}} placeholder="Ex: contrato.pdf, manual.docx" /></div>

        <h3 style={{ color:"#3B82F6", fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:1, margin:"0 0 16px" }}>Condições do Serviço</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
          <div><label style={labelStyle}>Valor (R$) *</label><input placeholder="0,00" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))} style={inputStyle(errors.valor)} />{errors.valor&&<div style={errStyle}>{errors.valor}</div>}</div>
          <div><label style={labelStyle}>Prazo * (dias úteis)</label><input placeholder="Ex: 5 dias úteis" value={form.prazo} onChange={e=>setForm(f=>({...f,prazo:e.target.value}))} style={inputStyle(errors.prazo)} />{errors.prazo&&<div style={errStyle}>{errors.prazo}</div>}</div>
          <div><label style={labelStyle}>Data de Entrega</label><input type="date" value={form.dataEntrega} onChange={e=>setForm(f=>({...f,dataEntrega:e.target.value}))} style={inputStyle(false)} /></div>
        </div>

        <div style={{ marginBottom:24 }}>
          <label style={labelStyle}>Formato *</label>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {formatosList.map(f => (<button key={f} onClick={()=>setForm(fm=>({...fm,formato:f}))} style={{ padding:"8px 16px", borderRadius:20, border:"none", cursor:"pointer", background:form.formato===f?"#10B981":"rgba(255,255,255,0.06)", color:form.formato===f?"white":"#64748B", fontSize:13, fontWeight:form.formato===f?700:400 }}>{f}</button>))}
          </div>
          {errors.formato&&<div style={errStyle}>{errors.formato}</div>}
        </div>

        <div style={{ marginBottom:24 }}>
          <label style={labelStyle}>Forma de Pagamento *</label>
          {form.pagamento==="PIX"&&<div style={{ background:"rgba(16,185,129,0.08)", border:"1px solid #10B98130", borderRadius:10, padding:"10px 14px", marginBottom:10 }}><div style={{ color:"#10B981", fontSize:12, fontWeight:700 }}>PIX</div><div style={{ color:"#94A3B8", fontSize:12 }}>Chave: 57940939000153 — AGV Serviços Administrativos</div></div>}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {pagamentosList.map(p => (<button key={p} onClick={()=>setForm(fm=>({...fm,pagamento:p}))} style={{ padding:"8px 16px", borderRadius:20, border:"none", cursor:"pointer", background:form.pagamento===p?"#8B5CF6":"rgba(255,255,255,0.06)", color:form.pagamento===p?"white":"#64748B", fontSize:13, fontWeight:form.pagamento===p?700:400 }}>{p}</button>))}
          </div>
          {errors.pagamento&&<div style={errStyle}>{errors.pagamento}</div>}
        </div>

        <div style={{ marginBottom:28 }}><label style={labelStyle}>Observação Interna (opcional)</label><textarea value={form.observacaoInterna} onChange={e=>setForm(f=>({...f,observacaoInterna:e.target.value}))} rows={2} style={{...inputStyle(false),resize:"vertical"}} placeholder="Visível apenas para a equipe interna..." /></div>

        <button onClick={handleSave} disabled={saving} style={{ padding:"13px 32px", borderRadius:12, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#3B82F6,#2563EB)", color:"white", fontSize:15, fontWeight:700, boxShadow:"0 4px 15px rgba(59,130,246,0.4)", opacity:saving?0.7:1 }}>
          {saving?"Salvando...":"Gerar Orçamento"}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MODAL OS
// ============================================================
const ModalOS = ({ orc, onConfirm, onClose }) => {
  const [obs, setObs] = useState(orc.observacaoInterna||"");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm(obs);
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ background:"#1E293B", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:32, width:"100%", maxWidth:560, maxHeight:"80vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div><h3 style={{ color:"white", fontSize:18, fontWeight:700, margin:0 }}>Gerar Ordem de Serviço</h3><p style={{ color:"#64748B", fontSize:13, margin:"4px 0 0" }}>Confirme os dados para o time interno</p></div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#64748B", fontSize:20, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ background:"linear-gradient(135deg,#3B82F615,#10B98115)", border:"1px solid #3B82F630", borderRadius:12, padding:"14px 18px", marginBottom:20 }}>
          <div style={{ color:"#64748B", fontSize:11, fontWeight:700, textTransform:"uppercase" }}>Número da OS será gerado automaticamente</div>
          <div style={{ color:"white", fontSize:18, fontWeight:800, marginTop:4 }}>REF XXXX (próximo da sequência)</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
          {[["Orçamento",orc.orcNum],["Cliente",orc.cliente],["Empresa",orc.empresa],["Serviços",orc.servicos?.join(", ")],["Idiomas",`${orc.idiomasDe} → ${orc.idiomasPara}`],["Prazo",orc.prazo],["Valor",formatCurrency(orc.valor)],["Formato",orc.formato]].map(([k,v]) => (
            <div key={k} style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"8px 12px" }}><div style={{ color:"#475569", fontSize:11, fontWeight:600 }}>{k}</div><div style={{ color:"white", fontSize:13, fontWeight:600, marginTop:2 }}>{v}</div></div>
          ))}
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ color:"#94A3B8", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, display:"block", marginBottom:6 }}>Observação para o time interno</label>
          <textarea value={obs} onChange={e=>setObs(e.target.value)} rows={3} style={{ width:"100%", padding:"10px 12px", borderRadius:10, boxSizing:"border-box", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"white", fontSize:13, outline:"none", resize:"vertical", fontFamily:"'DM Sans',sans-serif" }} placeholder="Instruções especiais..." />
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={handleConfirm} disabled={saving} style={{ flex:1, padding:13, borderRadius:10, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#10B981,#059669)", color:"white", fontSize:14, fontWeight:700, opacity:saving?0.7:1 }}>
            {saving?"Gerando...":"✅ Confirmar — Gerar OS"}
          </button>
          <button onClick={onClose} style={{ padding:"13px 20px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", background:"transparent", color:"#64748B", fontSize:14 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// LISTA ORÇAMENTOS
// ============================================================
const ListaOrcamentos = ({ orcamentos, currentUser, onUpdate }) => {
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [osModal, setOsModal] = useState(null);
  const [detalhe, setDetalhe] = useState(null);

  const statusList = ["Todos","Em Aberto","Vendido","Em Andamento","Aguardando Cliente","Entregue","Faturado","Cancelado"];
  const myOrcs = currentUser.role === "admin" ? orcamentos : orcamentos.filter(o => o.vendedorId === currentUser.id);
  const filtered = myOrcs.filter(o => {
    if (filtroStatus!=="Todos" && o.status!==filtroStatus) return false;
    if (busca && !o.cliente?.toLowerCase().includes(busca.toLowerCase()) && !o.empresa?.toLowerCase().includes(busca.toLowerCase()) && !o.orcNum?.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const handleConfirmOS = async (orc, obs) => {
    const { db, doc, getDoc, updateDoc, runTransaction, increment } = window._firebase;
    const year = new Date().getFullYear().toString().slice(-2);
    const counterRef = doc(db, "contadores", "referencias");
    let newNum;
    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) { newNum=1; transaction.set(counterRef,{atual:1}); }
      else { newNum=counterDoc.data().atual+1; transaction.update(counterRef,{atual:increment(1)}); }
    });
    const refNum = `REF ${String(newNum).padStart(4,"0")}`;
    await updateDoc(doc(db,"orcamentos",orc.id), { status:"Em Andamento", refNum, observacaoInterna:obs });
    onUpdate();
    setOsModal(null);
  };

  const handleStatusChange = async (id, newStatus) => {
    const { db, doc, updateDoc } = window._firebase;
    await updateDoc(doc(db,"orcamentos",id), { status:newStatus });
    onUpdate();
  };

  return (
    <div style={{ padding:28, fontFamily:"'DM Sans',sans-serif" }}>
      {osModal && <ModalOS orc={osModal} onConfirm={(obs)=>handleConfirmOS(osModal,obs)} onClose={()=>setOsModal(null)} />}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h2 style={{ color:"white", fontSize:22, fontWeight:700, margin:0 }}>Orçamentos</h2>
        <div style={{ color:"#64748B", fontSize:13 }}>{filtered.length} registros</div>
      </div>
      <div style={{ background:"#1E293B", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20, marginBottom:16 }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:12 }}>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="🔍 Buscar cliente, empresa ou nº orçamento..." style={{ padding:"9px 12px", borderRadius:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"white", fontSize:13, outline:"none" }} />
          <select value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)} style={{ padding:"9px 12px", borderRadius:10, background:"#0F172A", border:"1px solid rgba(255,255,255,0.1)", color:"white", fontSize:13, outline:"none" }}>
            {statusList.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {statusList.map(s=><button key={s} onClick={()=>setFiltroStatus(s)} style={{ padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:filtroStatus===s?(s==="Todos"?"#3B82F6":getStatusColor(s)):"rgba(255,255,255,0.06)", color:filtroStatus===s?"white":"#64748B" }}>{s}</button>)}
      </div>
      <div style={{ background:"#1E293B", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"rgba(255,255,255,0.03)" }}>
              {["Nº ORC","REF","Cliente / Empresa","Serviço","Valor","Prazo / Entrega","Pagamento","Status","Ações"].map(h=><th key={h} style={{ padding:"12px 16px", color:"#475569", fontSize:11, fontWeight:700, textAlign:"left", textTransform:"uppercase", letterSpacing:0.5, whiteSpace:"nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map((orc,i)=>(
                <tr key={orc.id} style={{ borderTop:"1px solid rgba(255,255,255,0.04)", background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                  <td style={{ padding:"14px 16px", color:"#3B82F6", fontWeight:700, fontSize:13, whiteSpace:"nowrap" }}>{orc.orcNum}</td>
                  <td style={{ padding:"14px 16px", color:orc.refNum?"#10B981":"#334155", fontWeight:700, fontSize:13 }}>{orc.refNum||"—"}</td>
                  <td style={{ padding:"14px 16px" }}><div style={{ color:"white", fontSize:13, fontWeight:600 }}>{orc.cliente}</div><div style={{ color:"#475569", fontSize:11 }}>{orc.empresa}</div>{currentUser.role==="admin"&&<div style={{ color:"#334155", fontSize:11 }}>👤 {orc.vendedorNome}</div>}</td>
                  <td style={{ padding:"14px 16px" }}><div style={{ color:"#94A3B8", fontSize:12 }}>{orc.servicos?.slice(0,1).join(", ")}{orc.servicos?.length>1&&` +${orc.servicos.length-1}`}</div><div style={{ color:"#475569", fontSize:11 }}>{orc.idiomasDe} → {orc.idiomasPara}</div></td>
                  <td style={{ padding:"14px 16px", color:"#10B981", fontWeight:700, fontSize:13, whiteSpace:"nowrap" }}>{formatCurrency(orc.valor)}</td>
                  <td style={{ padding:"14px 16px" }}><div style={{ color:"#94A3B8", fontSize:12 }}>{orc.prazo}</div>{orc.dataEntrega&&<div style={{ color:"#475569", fontSize:11 }}>{formatDate(orc.dataEntrega)}</div>}<DeadlineAlert dataEntrega={orc.dataEntrega} /></td>
                  <td style={{ padding:"14px 16px", color:"#94A3B8", fontSize:12 }}>{orc.pagamento}</td>
                  <td style={{ padding:"14px 16px" }}>
                    <select value={orc.status} onChange={e=>handleStatusChange(orc.id,e.target.value)} style={{ background:getStatusColor(orc.status)+"20", color:getStatusColor(orc.status), border:`1px solid ${getStatusColor(orc.status)}40`, borderRadius:20, padding:"4px 10px", fontSize:11, fontWeight:700, outline:"none", cursor:"pointer" }}>
                      {["Em Aberto","Vendido","Em Andamento","Aguardando Cliente","Entregue","Faturado","Cancelado"].map(s=><option key={s} style={{ background:"#1E293B", color:"white" }}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      {orc.status==="Em Aberto"&&<button onClick={()=>setOsModal(orc)} style={{ padding:"5px 12px", borderRadius:8, border:"none", cursor:"pointer", background:"#10B981", color:"white", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>✅ Vendido</button>}
                      <button onClick={()=>setDetalhe(detalhe?.id===orc.id?null:orc)} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", background:"transparent", color:"#64748B", fontSize:11 }}>👁</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length===0&&<tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:"#334155", fontSize:14 }}>Nenhum orçamento encontrado</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {detalhe&&(
        <div style={{ background:"#1E293B", border:"1px solid #3B82F630", borderRadius:16, padding:24, marginTop:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            <h3 style={{ color:"white", fontSize:16, fontWeight:700, margin:0 }}>{detalhe.orcNum} — Detalhes</h3>
            <button onClick={()=>setDetalhe(null)} style={{ background:"none", border:"none", color:"#64748B", fontSize:18, cursor:"pointer" }}>✕</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            {[["Email",detalhe.email],["Telefone",detalhe.tel],["CPF/CNPJ",detalhe.cpfCnpj],["Qtd. Documentos",detalhe.qtdDocumentos],["Formato",detalhe.formato],["Vendedor",detalhe.vendedorNome],["Arquivos",detalhe.arquivos||"—"],["Obs. Interna",detalhe.observacaoInterna||"—"],["Criado em",formatDate(detalhe.criadoEm)]].map(([k,v])=>(
              <div key={k} style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"8px 12px" }}><div style={{ color:"#475569", fontSize:11, fontWeight:600 }}>{k}</div><div style={{ color:"white", fontSize:13, marginTop:2 }}>{v}</div></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// PAINEL FINANCEIRO
// ============================================================
const PainelFinanceiro = ({ orcamentos }) => {
  const aprovados = orcamentos.filter(o => ["Em Andamento","Entregue","Faturado"].includes(o.status));
  const totalFaturado = aprovados.filter(o=>o.status==="Faturado").reduce((s,o)=>s+o.valor,0);
  const totalPendente = aprovados.filter(o=>o.status!=="Faturado").reduce((s,o)=>s+o.valor,0);

  const exportCSV = () => {
    const headers = ["Nº ORC","REF","Cliente","Empresa","CNPJ/CPF","Valor","Pagamento","Status","Vendedor","Data Criação","Prazo"];
    const rows = aprovados.map(o=>[o.orcNum,o.refNum||"",o.cliente,o.empresa,o.cpfCnpj,o.valor?.toFixed(2),o.pagamento,o.status,o.vendedorNome,formatDate(o.criadoEm),o.prazo]);
    const csv=[headers,...rows].map(r=>r.join(";")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="financeiro_sp_traducoes.csv";a.click();
  };

  return (
    <div style={{ padding:28, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h2 style={{ color:"white", fontSize:22, fontWeight:700, margin:0 }}>Painel Financeiro</h2>
        <button onClick={exportCSV} style={{ padding:"10px 20px", borderRadius:10, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#10B981,#059669)", color:"white", fontSize:13, fontWeight:700, boxShadow:"0 4px 12px rgba(16,185,129,0.3)" }}>📊 Exportar Planilha</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
        {[{label:"Pendente de Faturamento",value:formatCurrency(totalPendente),color:"#F59E0B",icon:"⏳"},{label:"Total Faturado",value:formatCurrency(totalFaturado),color:"#10B981",icon:"✅"},{label:"Total Geral",value:formatCurrency(totalFaturado+totalPendente),color:"#3B82F6",icon:"💰"}].map((c,i)=>(
          <div key={i} style={{ background:"#1E293B", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div><div style={{ color:"#64748B", fontSize:12, fontWeight:600, textTransform:"uppercase" }}>{c.label}</div><div style={{ color:c.color, fontSize:22, fontWeight:800, marginTop:6 }}>{c.value}</div></div>
              <div style={{ fontSize:28 }}>{c.icon}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:"#1E293B", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"rgba(255,255,255,0.03)" }}>
              {["ORC","REF","Cliente","Empresa","CPF/CNPJ","Valor","Pagamento","Vendedor","Status"].map(h=><th key={h} style={{ padding:"12px 16px", color:"#475569", fontSize:11, fontWeight:700, textAlign:"left", textTransform:"uppercase", letterSpacing:0.5, whiteSpace:"nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {aprovados.map((o,i)=>(
                <tr key={o.id} style={{ borderTop:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"12px 16px", color:"#3B82F6", fontWeight:700, fontSize:12 }}>{o.orcNum}</td>
                  <td style={{ padding:"12px 16px", color:"#10B981", fontWeight:700, fontSize:12 }}>{o.refNum}</td>
                  <td style={{ padding:"12px 16px", color:"white", fontSize:13 }}>{o.cliente}</td>
                  <td style={{ padding:"12px 16px", color:"#94A3B8", fontSize:12 }}>{o.empresa}</td>
                  <td style={{ padding:"12px 16px", color:"#64748B", fontSize:12 }}>{o.cpfCnpj}</td>
                  <td style={{ padding:"12px 16px", color:"#10B981", fontWeight:700, fontSize:13 }}>{formatCurrency(o.valor)}</td>
                  <td style={{ padding:"12px 16px", color:"#94A3B8", fontSize:12 }}>{o.pagamento}</td>
                  <td style={{ padding:"12px 16px", color:"#64748B", fontSize:12 }}>{o.vendedorNome}</td>
                  <td style={{ padding:"12px 16px" }}><Badge status={o.status} /></td>
                </tr>
              ))}
              {aprovados.length===0&&<tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:"#334155", fontSize:14 }}>Nenhum orçamento aprovado ainda</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// USUARIOS (Admin)
// ============================================================
const GerenciarUsuarios = ({ currentUser }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ name:"", email:"", role:"vendedor", password:"" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const { db, collection, onSnapshot } = window._firebase;
    const unsub = onSnapshot(collection(db,"usuarios"), snap => {
      setUsuarios(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return unsub;
  }, []);

  const handleCreate = async () => {
    if (!form.name||!form.email||!form.password) { setMsg("Preencha todos os campos."); return; }
    setSaving(true);
    try {
      // Criar no Authentication via API REST (sem SDK Admin)
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_CONFIG.apiKey}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email:form.email, password:form.password, returnSecureToken:true })
      });
      const data = await res.json();
      if (data.error) { setMsg("Erro: "+data.error.message); setSaving(false); return; }
      const { db, doc, setDoc } = window._firebase;
      await setDoc(doc(db,"usuarios",data.localId), { name:form.name, email:form.email, role:form.role });
      setMsg(`✅ Usuário ${form.name} criado com sucesso!`);
      setForm({ name:"", email:"", role:"vendedor", password:"" });
    } catch(e) { setMsg("Erro: "+e.message); }
    setSaving(false);
  };

  const inputStyle = { width:"100%", padding:"10px 12px", borderRadius:10, boxSizing:"border-box", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"white", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif" };

  return (
    <div style={{ padding:28, fontFamily:"'DM Sans',sans-serif" }}>
      <h2 style={{ color:"white", fontSize:22, fontWeight:700, margin:"0 0 24px" }}>Gerenciar Usuários</h2>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        <div style={{ background:"#1E293B", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:24 }}>
          <h3 style={{ color:"#3B82F6", fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:1, margin:"0 0 16px" }}>Criar Novo Usuário</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div><label style={{ color:"#94A3B8", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, display:"block", marginBottom:6 }}>Nome completo</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inputStyle} /></div>
            <div><label style={{ color:"#94A3B8", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, display:"block", marginBottom:6 }}>Email</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={inputStyle} /></div>
            <div><label style={{ color:"#94A3B8", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, display:"block", marginBottom:6 }}>Senha inicial</label><input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} style={inputStyle} /></div>
            <div><label style={{ color:"#94A3B8", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, display:"block", marginBottom:6 }}>Perfil</label>
              <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={{...inputStyle,background:"#0F172A"}}>
                <option value="vendedor">Vendedor</option>
                <option value="financeiro">Financeiro</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {msg&&<p style={{ color:msg.startsWith("✅")?"#10B981":"#EF4444", fontSize:13, margin:0 }}>{msg}</p>}
            <button onClick={handleCreate} disabled={saving} style={{ padding:"11px", borderRadius:10, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#3B82F6,#2563EB)", color:"white", fontSize:14, fontWeight:700, opacity:saving?0.7:1 }}>{saving?"Criando...":"Criar Usuário"}</button>
          </div>
        </div>
        <div style={{ background:"#1E293B", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:24 }}>
          <h3 style={{ color:"#3B82F6", fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:1, margin:"0 0 16px" }}>Usuários Ativos ({usuarios.length})</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {usuarios.map(u=>(
              <div key={u.id} style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div><div style={{ color:"white", fontWeight:700, fontSize:14 }}>{u.name}</div><div style={{ color:"#64748B", fontSize:12 }}>{u.email}</div></div>
                <div style={{ padding:"3px 10px", borderRadius:20, background:u.role==="admin"?"#3B82F620":u.role==="financeiro"?"#10B98120":"#8B5CF620", color:u.role==="admin"?"#3B82F6":u.role==="financeiro"?"#10B981":"#8B5CF6", fontSize:10, fontWeight:700, textTransform:"uppercase" }}>{u.role}</div>
              </div>
            ))}
            {usuarios.length===0&&<p style={{ color:"#334155", textAlign:"center", fontSize:13 }}>Nenhum usuário cadastrado</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [orcamentos, setOrcamentos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    loadFirebase().then(() => setFirebaseReady(true));
  }, []);

  useEffect(() => {
    if (!firebaseReady || !currentUser) return;
    const { db, collection, onSnapshot, query, orderBy } = window._firebase;
    const q = query(collection(db,"orcamentos"), orderBy("criadoEm","desc"));
    const unsub = onSnapshot(q, snap => {
      setOrcamentos(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    const unsub2 = onSnapshot(collection(db,"usuarios"), snap => {
      setUsuarios(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return () => { unsub(); unsub2(); };
  }, [firebaseReady, currentUser]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setActivePage(user.role==="financeiro"?"financeiro":"dashboard");
  };

  const handleLogout = async () => {
    const { auth, signOut } = window._firebase;
    await signOut(auth);
    setCurrentUser(null);
    setOrcamentos([]);
  };

  if (!firebaseReady) return (
    <div style={{ minHeight:"100vh", background:"#0F172A", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🔥</div>
        <div style={{ fontSize:16 }}>Conectando ao Firebase...</div>
      </div>
    </div>
  );

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#0F172A", fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <Sidebar currentUser={currentUser} activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      <main style={{ flex:1, overflowY:"auto", minHeight:"100vh" }}>
        {activePage==="dashboard" && <Dashboard orcamentos={orcamentos} currentUser={currentUser} usuarios={usuarios} />}
        {activePage==="novo-orcamento" && currentUser.role!=="financeiro" && <NovoOrcamento currentUser={currentUser} onSave={()=>setActivePage("orcamentos")} />}
        {activePage==="orcamentos" && currentUser.role!=="financeiro" && <ListaOrcamentos orcamentos={orcamentos} currentUser={currentUser} onUpdate={()=>{}} />}
        {activePage==="financeiro" && <PainelFinanceiro orcamentos={orcamentos} />}
        {activePage==="usuarios" && currentUser.role==="admin" && <GerenciarUsuarios currentUser={currentUser} />}
      </main>
    </div>
  );
}
