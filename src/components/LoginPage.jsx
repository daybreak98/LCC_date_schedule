import React, { useState } from "react";
import { CalendarDays, LogIn, AlertCircle, UserPlus } from "lucide-react";

export default function LoginPage({ onSignIn, onSignUp, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [formError, setFormError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    try {
      if (mode === "login") {
        await onSignIn(email, password);
      } else {
        await onSignUp(email, password);
        setMode("login");
        setFormError("注册成功！请检查邮箱确认链接，然后返回登录。");
      }
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon"><CalendarDays size={28} /></div>
          <div>
            <h1>日程管理系统</h1>
            <p>登录以访问你的日程数据</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label>邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>

          <div className="login-field">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              required
              minLength={6}
            />
          </div>

          {(formError || error) && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{formError || error}</span>
            </div>
          )}

          <button className="login-submit" type="submit">
            {mode === "login" ? (
              <><LogIn size={18} /> 登录</>
            ) : (
              <><UserPlus size={18} /> 注册</>
            )}
          </button>
        </form>

        <p className="login-switch">
          {mode === "login" ? "还没有账号？" : "已有账号？"}
          <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setFormError(""); }}>
            {mode === "login" ? "注册新账号" : "去登录"}
          </button>
        </p>

        <p className="login-hint">
          单人使用：注册一个账号后登录，所有数据仅你自己可见。
        </p>
      </div>
    </div>
  );
}
