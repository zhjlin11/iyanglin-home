export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "#F6F7F9" }}>
      {/* 模拟导航栏 */}
      <div style={{ height: 64, background: "#16A67A" }} />
      <div style={{ padding: "16px 16px 40px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        {/* Hero skeleton */}
        <div style={{ height: 180, borderRadius: 16, background: "linear-gradient(135deg, #0B2240 0%, #1967D2 100%)", marginBottom: 24 }} />
        {/* Filter skeleton */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, marginBottom: 24, border: "1px solid #E5E7EB" }}>
          <div style={{ height: 46, background: "#F3F4F6", borderRadius: 8, marginBottom: 16 }} />
          <div style={{ display: "flex", gap: 8 }}>
            {[1,2,3,4,5].map(i => <div key={i} style={{ width: 80, height: 32, background: "#F3F4F6", borderRadius: 6 }} />)}
          </div>
        </div>
        {/* Job cards skeleton */}
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 16, border: "1px solid #E5E7EB", display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: 10, background: "#E5E7EB", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 20, width: "60%", background: "#E5E7EB", borderRadius: 4, marginBottom: 10 }} />
              <div style={{ height: 14, width: "40%", background: "#F3F4F6", borderRadius: 4, marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 8 }}>{[1,2,3].map(j => <div key={j} style={{ width: 60, height: 20, background: "#F0F6FE", borderRadius: 4 }} />)}</div>
            </div>
            <div style={{ width: 100, height: 36, background: "#E5E7EB", borderRadius: 8 }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}} div[style*="background: #E5E7EB"],div[style*="background: #F3F4F6"],div[style*="background: #F0F6FE"]{animation:pulse 1.5s ease-in-out infinite}`}</style>
      </div>
    </div>
  );
}
