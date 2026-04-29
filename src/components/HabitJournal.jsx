import React, { useEffect, useState } from "react";

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function LogEntry({ log, onUpdate, onDelete }) {
  const [titleDraft, setTitleDraft] = useState(log.title);
  const [bodyDraft, setBodyDraft] = useState(log.body);
  const [isEditing, setIsEditing] = useState(log._new ?? false);

  useEffect(() => {
    setTitleDraft(log.title);
    setBodyDraft(log.body);
  }, [log.id]);

  function commitEdit() {
    setIsEditing(false);
    onUpdate(log.id, titleDraft, bodyDraft);
  }

  if (isEditing) {
    return (
      <div className="log-entry log-entry-editing">
        <input
          className="log-title-input"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          placeholder="Title (defaults to today's date)"
        />
        <textarea
          className="log-body-input"
          value={bodyDraft}
          onChange={(e) => setBodyDraft(e.target.value)}
          placeholder="Write your log entry..."
          rows={4}
        />
        <div className="log-entry-actions">
          <button type="button" onClick={commitEdit}>
            Save
          </button>
          <button
            type="button"
            className="danger-btn"
            onClick={() => onDelete(log.id)}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="log-entry">
      <div className="log-entry-header">
        <span className="log-title">{log.title}</span>
        <div className="log-entry-actions">
          <button type="button" onClick={() => setIsEditing(true)}>
            Edit
          </button>
          <button
            type="button"
            className="danger-btn"
            onClick={() => onDelete(log.id)}
          >
            Delete
          </button>
        </div>
      </div>
      {log.body ? <p className="log-body">{log.body}</p> : null}
    </div>
  );
}

export default function HabitJournal({
  habit,
  habitNotes,
  onUpdateGeneralNote,
  onAddLog,
  onUpdateLog,
  onDeleteLog
}) {
  const { general = "", logs = [] } = habitNotes;
  const [generalDraft, setGeneralDraft] = useState(general);
  const [pendingNewLog, setPendingNewLog] = useState(null);

  useEffect(() => {
    setGeneralDraft(general);
    setPendingNewLog(null);
  }, [habit.id]);

  function handleAddLog() {
    const tempId = `pending_${Date.now()}`;
    setPendingNewLog({ id: tempId, title: todayLabel(), body: "", _new: true });
  }

  function handleCommitNewLog(id, title, body) {
    setPendingNewLog(null);
    onAddLog(habit.id, title || todayLabel(), body);
  }

  function handleCancelNewLog() {
    setPendingNewLog(null);
  }

  return (
    <div className="journal-panel">
      <section className="journal-section">
        <h3 className="journal-section-title">General Note</h3>
        <textarea
          className="general-note-input"
          value={generalDraft}
          onChange={(e) => setGeneralDraft(e.target.value)}
          onBlur={() => onUpdateGeneralNote(habit.id, generalDraft)}
          placeholder="Goals, intentions, context for this habit..."
          rows={4}
        />
      </section>

      <section className="journal-section">
        <div className="journal-logs-header">
          <h3 className="journal-section-title">Log</h3>
          {!pendingNewLog && (
            <button type="button" className="add-log-btn" onClick={handleAddLog}>
              + Add Log
            </button>
          )}
        </div>

        {pendingNewLog && (
          <NewLogEntry
            defaultTitle={todayLabel()}
            onCommit={handleCommitNewLog}
            onCancel={handleCancelNewLog}
          />
        )}

        {logs.length === 0 && !pendingNewLog ? (
          <p className="muted">No log entries yet.</p>
        ) : (
          <ul className="log-list">
            {logs.map((log) => (
              <li key={log.id}>
                <LogEntry
                  log={log}
                  onUpdate={(logId, title, body) => onUpdateLog(habit.id, logId, title, body)}
                  onDelete={(logId) => onDeleteLog(habit.id, logId)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function NewLogEntry({ defaultTitle, onCommit, onCancel }) {
  const [title, setTitle] = useState(defaultTitle);
  const [body, setBody] = useState("");

  return (
    <div className="log-entry log-entry-editing">
      <input
        className="log-title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (defaults to today's date)"
        autoFocus
      />
      <textarea
        className="log-body-input"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your log entry..."
        rows={4}
      />
      <div className="log-entry-actions">
        <button type="button" onClick={() => onCommit(null, title, body)}>
          Save
        </button>
        <button type="button" className="danger-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
