"use client";
import { useEffect, useRef } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
};

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  const addImage = () => {
    const url = prompt("请输入图片 URL:");
    if (url) {
      exec("insertImage", url);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", background: "white" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: "6px", padding: "8px", borderBottom: "1px solid var(--border)", background: "#f8fafc", flexWrap: "wrap" }}>
        <button type="button" onClick={() => exec("bold")} style={btnStyle} title="加粗"><b>B</b></button>
        <button type="button" onClick={() => exec("italic")} style={btnStyle} title="斜体"><i>I</i></button>
        <button type="button" onClick={() => exec("underline")} style={btnStyle} title="下划线"><u>U</u></button>
        <div style={{ width: "1px", background: "#cbd5e1", margin: "0 4px" }} />
        <button type="button" onClick={() => exec("formatBlock", "<h2>")} style={btnStyle}>H2</button>
        <button type="button" onClick={() => exec("formatBlock", "<h3>")} style={btnStyle}>H3</button>
        <button type="button" onClick={() => exec("formatBlock", "<p>")} style={btnStyle}>段落</button>
        <div style={{ width: "1px", background: "#cbd5e1", margin: "0 4px" }} />
        <button type="button" onClick={() => exec("justifyLeft")} style={btnStyle}>左对齐</button>
        <button type="button" onClick={() => exec("justifyCenter")} style={btnStyle}>居中</button>
        <button type="button" onClick={() => exec("justifyRight")} style={btnStyle}>右对齐</button>
        <div style={{ width: "1px", background: "#cbd5e1", margin: "0 4px" }} />
        <button type="button" onClick={addImage} style={btnStyle}>🖼️ 插入图片</button>
        <button type="button" onClick={() => exec("removeFormat")} style={btnStyle}>清除格式</button>
      </div>

      {/* Editor Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        style={{
          minHeight: "350px",
          maxHeight: "600px",
          overflowY: "auto",
          padding: "16px",
          outline: "none",
          fontSize: "15px",
          lineHeight: "1.7",
          color: "#1e293b",
        }}
      />
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "4px 10px",
  border: "1px solid #cbd5e1",
  borderRadius: "4px",
  background: "white",
  cursor: "pointer",
  fontSize: "13px",
  color: "#334155",
};
