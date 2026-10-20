import { useState, type KeyboardEvent } from 'react';
import { getRoles } from '../legacy/engine';
import { actions } from '../store';

const DEMO_PASSWORD = '123456';

export default function LoginScreen() {
  const roles = getRoles();
  const [username, setUsername] = useState('lanhdao');
  const [password, setPassword] = useState(DEMO_PASSWORD);

  const login = () => {
    const u = username.trim();
    if (!roles[u] || password !== DEMO_PASSWORD) {
      alert('Sai tài khoản hoặc mật khẩu.');
      return;
    }
    actions.login(u);
  };

  const quick = (k: string) => {
    setUsername(k);
    setPassword(DEMO_PASSWORD);
  };

  const onEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') login();
  };

  return (
    <div className="login">
      <div className="hero branded-login">
        <div className="brand-seal">VLDC</div>
        <div className="hero-kicker">LIÊN ĐOÀN VẬT LÝ ĐỊA CHẤT</div>
        <h1>Digital Management Platform</h1>
        <h2>ERP Demo 10.1 • Integrated Enterprise Digital Platform</h2>
        <p>
          Nền tảng điều hành số tích hợp quản trị nhiệm vụ, kỹ thuật, kế toán, hợp đồng, tài liệu, dữ liệu địa vật
          lý, lịch công tác và tác vụ liên phòng ban.
        </p>
        <div className="hero-grid">
          <div className="hero-item">
            <b>Điều hành hợp nhất</b>
            <br />
            Dashboard • Action Center • Cảnh báo
          </div>
          <div className="hero-item">
            <b>Nghiệp vụ chuyên sâu</b>
            <br />
            Dự án • Kỹ thuật • Kế toán • Thiết bị
          </div>
          <div className="hero-item">
            <b>Hồ sơ số</b>
            <br />
            DMS • Văn bản • CLM • Archive
          </div>
          <div className="hero-item">
            <b>Dữ liệu & AI</b>
            <br />
            Geo Data • BI • Trợ lý soạn thảo
          </div>
        </div>
        <div className="photo-credit">Ảnh nền: hoạt động chính thức của Liên đoàn Vật lý Địa chất</div>
      </div>
      <div className="login-panel">
        <div className="login-card">
          <h2>Đăng nhập hệ thống Demo 10.1</h2>
          <p>
            Mật khẩu chung: <b>{DEMO_PASSWORD}</b>
          </p>
          <label htmlFor="username">Tên đăng nhập</label>
          <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={onEnter} />
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onEnter}
          />
          <button className="btn btn-primary" onClick={login}>
            Đăng nhập
          </button>
          <div className="accounts">
            <div className="mini" style={{ marginBottom: 8 }}>
              Chọn nhanh vai trò
            </div>
            <div className="account-grid">
              {Object.entries(roles).map(([k, v]) => (
                <div key={k} className="account" onClick={() => quick(k)}>
                  <b>{k}</b>
                  <br />
                  {v.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
