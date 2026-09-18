export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "#F6F7F9" }}>
      <div style={{ height: 64, background: "#16A67A" }} />
      <div style={{ padding: "16px 16px 40px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ height: 120, borderRadius: 16, background: "linear-gradient(135deg, #065F46, #10B981)", marginBottom: 24 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #E5E7EB" }}>
                <div style={{ height: 180, background: "#E5E7EB" }} />
                <div style={{ padding: 16 }}>
                  <div style={{ height: 18, width: "70%", background: "#E5E7EB", borderRadius: 4, marginBottom: 10 }} />
                  <div style={{ height: 14, width: "50%", background: "#F3F4F6", borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 24, width: "40%", background: "#FEF3C7", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}} div[style*="background: #E5E7EB"],div[style*="background: #F3F4F6"],div[style*="background: #FEF3C7"]{animation:pulse 1.5s ease-in-out infinite}`}</style>
    </div>
  );
}
