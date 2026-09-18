export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "#F6F7F9" }}>
      <div style={{ height: 64, background: "#16A67A" }} />
      <div style={{ padding: "16px 16px 40px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ height: 48, width: "45%", background: "#E5E7EB", borderRadius: 8, marginBottom: 24 }} />
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 20, marginBottom: 12, border: "1px solid #E5E7EB" }}>
              <div style={{ height: 18, width: "65%", background: "#E5E7EB", borderRadius: 4, marginBottom: 10 }} />
              <div style={{ height: 14, width: "85%", background: "#F3F4F6", borderRadius: 4, marginBottom: 6 }} />
              <div style={{ height: 14, width: "40%", background: "#F3F4F6", borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}} div[style*="background: #E5E7EB"],div[style*="background: #F3F4F6"]{animation:pulse 1.5s ease-in-out infinite}`}</style>
    </div>
  );
}
