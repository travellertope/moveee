"use client";

interface Props {
  options: string[];
  onChange: (opts: string[]) => void;
  duration: string;
  onDurationChange: (d: string) => void;
}

const DURATIONS = [
  { value: "1", label: "1 day" },
  { value: "3", label: "3 days" },
  { value: "7", label: "7 days" },
];

export default function PollBuilder({ options, onChange, duration, onDurationChange }: Props) {
  function updateOption(i: number, text: string) {
    const next = [...options];
    next[i] = text;
    onChange(next);
  }

  function addOption() {
    if (options.length < 4) onChange([...options, ""]);
  }

  function removeOption(i: number) {
    if (options.length > 2) onChange(options.filter((_, j) => j !== i));
  }

  return (
    <div className="composer-poll">
      {options.map((opt, i) => (
        <div key={i} className="composer-poll-row">
          <input
            type="text"
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`Option ${i + 1}`}
            className="composer-poll-input"
            maxLength={100}
          />
          {options.length > 2 && (
            <button type="button" className="composer-poll-remove" onClick={() => removeOption(i)}>×</button>
          )}
        </div>
      ))}
      {options.length < 4 && (
        <button type="button" className="composer-poll-add" onClick={addOption}>+ Add option</button>
      )}
      <div className="composer-poll-duration">
        <span className="composer-poll-duration-label">Duration</span>
        <select value={duration} onChange={(e) => onDurationChange(e.target.value)} className="composer-poll-select">
          {DURATIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
