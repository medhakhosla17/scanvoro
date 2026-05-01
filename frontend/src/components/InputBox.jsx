export default function InputBox({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  type = "text",
  accept,
}) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      {type === "file" ? (
        <input className="field-input" type="file" accept={accept} onChange={onChange} />
      ) : multiline ? (
        <textarea
          className="field-textarea"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="field-input"
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
