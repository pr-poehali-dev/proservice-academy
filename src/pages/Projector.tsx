import { useState, useEffect } from "react";
import { getProjectorState, onProjectorStateChange, ProjectorState } from "@/lib/projector-sync";

export default function Projector() {
  const [state, setState] = useState<ProjectorState | null>(getProjectorState);

  useEffect(() => {
    // Обновляемся при изменениях из другой вкладки
    const unsub = onProjectorStateChange(setState);
    // Также опрашиваем каждые 300ms на случай если события не пришли
    const iv = setInterval(() => {
      const s = getProjectorState();
      if (s) setState(s);
    }, 300);
    return () => { unsub(); clearInterval(iv); };
  }, []);

  const bg = state?.darkTheme !== false ? "#1a2340" : "#FFFFFF";
  const textColor = state?.darkTheme !== false ? "#FFFFFF" : "#1a2340";
  const subColor = state?.darkTheme !== false ? "rgba(255,255,255,0.55)" : "rgba(26,35,64,0.5)";

  // Парсер инлайн **жирный**
  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : p
    );
  };

  if (!state || !state.active) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ background: "#1a2340" }}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "rgba(255,107,43,0.2)", border: "2px solid rgba(255,107,43,0.3)" }}>
            <span style={{ fontSize: 28 }}>📽️</span>
          </div>
          <h2 className="text-white text-xl font-bold">Ожидание презентации</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            Запустите презентацию в кабинете тренера
          </p>
        </div>
      </div>
    );
  }

  const slide = state.slides[state.slideIdx];
  if (!slide) return null;

  const isTitle = state.slideIdx === 0;

  // Собираем элементы слайда
  type SlideEl = { kind: "bullet"; text: string } | { kind: "para"; text: string } | { kind: "gap" };
  const allLines = [
    ...(slide.content || []),
    ...(slide.bullets || []).map((b: string) => `- ${b}`),
  ];
  const elements: SlideEl[] = [];
  for (const line of allLines) {
    if (!line.trim()) { elements.push({ kind: "gap" }); continue; }
    if (/^[-*•]\s/.test(line)) {
      elements.push({ kind: "bullet", text: line.replace(/^[-*•]\s*/, "") });
    } else {
      elements.push({ kind: "para", text: line });
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: bg, transition: "background 0.3s" }}>
      {/* Шапка */}
      <div className="flex items-center justify-between px-8 py-4 shrink-0"
        style={{ borderBottom: `1px solid ${state.darkTheme !== false ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
        <span className="text-sm font-medium truncate max-w-[60%]" style={{ color: subColor }}>
          {state.lessonTitle}
        </span>
        <span className="text-sm font-medium" style={{ color: subColor }}>
          {state.slideIdx + 1} / {state.slides.length}
        </span>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-hidden" style={{ animation: "fadeIn 0.3s ease" }} key={state.slideIdx}>
        {isTitle ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-12">
            <div className="mb-6 text-sm font-semibold uppercase tracking-widest px-5 py-2 rounded-full"
              style={{ background: "rgba(255,107,43,0.15)", color: "#FF6B2B", border: "1px solid rgba(255,107,43,0.3)" }}>
              {state.courseTitle}
            </div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.2, color: textColor, marginBottom: 24 }}>
              {slide.title}
            </h1>
            <div style={{ width: 80, height: 4, borderRadius: 2, background: "#FF6B2B", marginBottom: 20 }} />
            {elements.filter(e => e.kind !== "gap").length > 0 && (
              <div className="space-y-3 max-w-2xl">
                {elements.map((el, i) => {
                  if (el.kind === "gap") return null;
                  if (el.kind === "bullet") return (
                    <div key={i} className="flex items-start gap-3 text-left">
                      <span style={{ color: "#FF6B2B", fontSize: 22, fontWeight: 700 }}>→</span>
                      <span style={{ fontSize: "clamp(16px, 2vw, 22px)", lineHeight: 1.6, color: state.darkTheme !== false ? "#dde4f0" : "#333" }}>
                        {renderInline(el.text)}
                      </span>
                    </div>
                  );
                  return (
                    <p key={i} style={{ fontSize: "clamp(16px, 2vw, 22px)", lineHeight: 1.6, color: state.darkTheme !== false ? "#c8d4e8" : "#444" }}>
                      {renderInline(el.text)}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full px-12 lg:px-20 py-10">
            <div className="shrink-0 mb-6">
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 700, lineHeight: 1.2, color: textColor, marginBottom: 16 }}>
                {slide.title}
              </h2>
              <div style={{ height: 4, width: 72, borderRadius: 2, background: "#FF6B2B" }} />
            </div>
            <div className="flex-1 flex flex-col justify-center gap-4 overflow-auto">
              {elements.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.2)", fontStyle: "italic", fontSize: 18 }}>Нет содержимого</p>
              ) : elements.map((el, i) => {
                if (el.kind === "gap") return <div key={i} style={{ height: 10 }} />;
                if (el.kind === "bullet") return (
                  <div key={i} className="flex items-start gap-4">
                    <span className="shrink-0 mt-0.5" style={{ color: "#FF6B2B", fontSize: 24, fontWeight: 700, lineHeight: 1.4 }}>→</span>
                    <span style={{ fontSize: "clamp(17px, 2.2vw, 26px)", lineHeight: 1.6, color: state.darkTheme !== false ? "#dde4f0" : "#333" }}>
                      {renderInline(el.text)}
                    </span>
                  </div>
                );
                return (
                  <p key={i} style={{ fontSize: "clamp(17px, 2.2vw, 26px)", lineHeight: 1.65, color: state.darkTheme !== false ? "#c8d4e8" : "#444" }}>
                    {renderInline(el.text)}
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Нижняя полоса прогресса */}
      <div className="shrink-0 h-1" style={{ background: state.darkTheme !== false ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
        <div className="h-full transition-all duration-500" style={{
          width: `${((state.slideIdx + 1) / state.slides.length) * 100}%`,
          background: "#FF6B2B",
        }} />
      </div>
    </div>
  );
}
