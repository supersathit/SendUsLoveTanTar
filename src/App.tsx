import { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { WeddingSettingsProvider } from './hooks/useWeddingSettings';
const WritePage = lazy(() => import('./pages/WritePage').then(module => ({ default: module.WritePage })));
const DisplayPage = lazy(() => import('./pages/DisplayPage').then(module => ({ default: module.DisplayPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })));

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* ไม่พิมพ์ข้อมูลคำอวยพรหรือ session ลง console */ }
  render() {
    if (this.state.failed) return <main className="fatal-error"><h1>เปิดหน้านี้ไม่สำเร็จ</h1><p>กรุณาลองโหลดหน้าใหม่อีกครั้งนะคะ</p><button className="button-primary" onClick={() => window.location.reload()}>โหลดหน้าใหม่</button></main>;
    return this.props.children;
  }
}
export function App() {
  return <ErrorBoundary><MotionConfig reducedMotion="user"><HashRouter><WeddingSettingsProvider><Suspense fallback={<main className="login-page"><p className="loading-message" role="status">กำลังเปิดหน้าเว็บ...</p></main>}><Routes><Route path="/" element={<Navigate to="/write" replace />} /><Route path="/write" element={<WritePage />} /><Route path="/display" element={<DisplayPage />} /><Route path="/admin" element={<AdminPage />} /><Route path="*" element={<Navigate to="/write" replace />} /></Routes></Suspense></WeddingSettingsProvider></HashRouter></MotionConfig></ErrorBoundary>;
}
