"use client";

import { useEffect, useState, useCallback } from "react";

interface ShippingMethod {
  instance_id: number;
  title: string;
  order: number;
  enabled: boolean;
  method_id: string;
  method_title: string;
  method_description: string;
  settings: Record<string, { id: string; label: string; value: string; type: string }>;
}

interface ShippingZone {
  id: number;
  name: string;
  order: number;
  methods: ShippingMethod[];
}

const METHOD_LABELS: Record<string, string> = {
  flat_rate:     "Flat Rate",
  free_shipping: "Free Shipping",
  local_pickup:  "Local Pickup",
};

const ADDABLE_METHODS = [
  { id: "flat_rate",     label: "Flat Rate" },
  { id: "free_shipping", label: "Free Shipping" },
  { id: "local_pickup",  label: "Local Pickup" },
];

export default function VendorShippingPage() {
  const [zones,   setZones]   = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [saving,  setSaving]  = useState<string>("");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [newZoneName, setNewZoneName] = useState("");
  const [addingZone, setAddingZone] = useState(false);
  const [showNewZoneForm, setShowNewZoneForm] = useState(false);
  const [renamingZone, setRenamingZone] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/vendor/shipping/zones")
      .then((r) => {
        if (!r.ok) return Promise.reject(r);
        return r.json();
      })
      .then((data) => {
        setZones(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch(() => setError("Could not load shipping zones. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function editKey(zoneId: number, instanceId: number, settingId: string) {
    return `${zoneId}:${instanceId}:${settingId}`;
  }

  function getEditValue(zoneId: number, instanceId: number, settingId: string, fallback: string) {
    const k = editKey(zoneId, instanceId, settingId);
    return editing[k] !== undefined ? editing[k] : fallback;
  }

  function setEditValue(zoneId: number, instanceId: number, settingId: string, value: string) {
    setEditing((prev) => ({ ...prev, [editKey(zoneId, instanceId, settingId)]: value }));
  }

  async function createZone() {
    if (!newZoneName.trim()) return;
    setAddingZone(true);
    try {
      const res = await fetch("/api/vendor/shipping/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newZoneName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setZones((prev) => [...prev, data]);
        setNewZoneName("");
        setShowNewZoneForm(false);
      } else {
        const d = await res.json();
        setError(d.error ?? "Could not create zone");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAddingZone(false);
    }
  }

  async function renameZone(zoneId: number) {
    if (!renameValue.trim()) { setRenamingZone(null); return; }
    setSaving(`rename:${zoneId}`);
    try {
      const res = await fetch(`/api/vendor/shipping/zones/${zoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (res.ok) {
        setZones((prev) => prev.map((z) => z.id === zoneId ? { ...z, name: renameValue.trim() } : z));
        setRenamingZone(null);
      } else {
        const d = await res.json();
        setError(d.error ?? "Rename failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving("");
    }
  }

  async function deleteZone(zoneId: number, zoneName: string) {
    if (!confirm(`Delete zone "${zoneName}"? This will also remove all its shipping methods.`)) return;
    setSaving(`zone:${zoneId}`);
    try {
      const res = await fetch(`/api/vendor/shipping/zones/${zoneId}`, { method: "DELETE" });
      if (res.ok) {
        setZones((prev) => prev.filter((z) => z.id !== zoneId));
      } else {
        const d = await res.json();
        setError(d.error ?? "Could not delete zone");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving("");
    }
  }

  async function addMethod(zoneId: number, methodId: string) {
    setSaving(`add:${zoneId}`);
    try {
      const res = await fetch(`/api/vendor/shipping/zones/${zoneId}/methods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method_id: methodId }),
      });
      if (res.ok) load();
      else {
        const d = await res.json();
        setError(d.error ?? "Could not add method");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving("");
    }
  }

  async function saveMethod(zoneId: number, method: ShippingMethod) {
    const key = `${zoneId}:${method.instance_id}`;
    setSaving(key);
    const settingsUpdate: Record<string, { value: string }> = {};
    for (const sid of Object.keys(method.settings)) {
      const k = editKey(zoneId, method.instance_id, sid);
      if (editing[k] !== undefined) settingsUpdate[sid] = { value: editing[k] };
    }

    try {
      const res = await fetch(`/api/vendor/shipping/zones/${zoneId}/methods/${method.instance_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsUpdate }),
      });
      if (res.ok) {
        setEditing((prev) => {
          const next = { ...prev };
          for (const sid of Object.keys(method.settings)) delete next[editKey(zoneId, method.instance_id, sid)];
          return next;
        });
        load();
      } else {
        const d = await res.json();
        setError(d.error ?? "Save failed");
      }
    } finally {
      setSaving("");
    }
  }

  async function toggleMethod(zoneId: number, method: ShippingMethod) {
    const key = `${zoneId}:${method.instance_id}`;
    setSaving(key);
    try {
      await fetch(`/api/vendor/shipping/zones/${zoneId}/methods/${method.instance_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !method.enabled }),
      });
      load();
    } finally {
      setSaving("");
    }
  }

  async function deleteMethod(zoneId: number, instanceId: number) {
    if (!confirm("Remove this shipping method?")) return;
    const key = `${zoneId}:${instanceId}`;
    setSaving(key);
    try {
      await fetch(`/api/vendor/shipping/zones/${zoneId}/methods/${instanceId}`, { method: "DELETE" });
      load();
    } finally {
      setSaving("");
    }
  }

  if (loading) {
    return (
      <div className="vd-page">
        <div className="vd-loading" style={{ minHeight: 300, position: "static" }}>
          <div className="vd-loading-dot" />
        </div>
      </div>
    );
  }

  return (
    <div className="vd-page">
      <div className="vd-page-header">
        <div>
          <div className="vd-page-eyebrow">Your Store</div>
          <h1 className="vd-page-title">Shipping Zones</h1>
        </div>
        <button
          className="vd-btn-primary"
          style={{ fontSize: 13 }}
          onClick={() => { setShowNewZoneForm(true); setNewZoneName(""); }}
          disabled={showNewZoneForm}
        >
          + Add Zone
        </button>
      </div>

      <p className="vship-intro">
        Shipping zones let you apply different rates based on the customer's
        delivery address. Each zone can have flat rate, free shipping, and
        local pickup methods — customers see whichever methods match their
        address at checkout.
      </p>

      {error && (
        <div className="vship-error-banner">
          {error}
          <button onClick={() => setError("")} className="vship-error-close">✕</button>
        </div>
      )}

      {/* New zone form */}
      {showNewZoneForm && (
        <div className="vship-new-zone-form">
          <input
            className="vpf-input"
            placeholder="Zone name, e.g. United Kingdom"
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createZone(); if (e.key === "Escape") setShowNewZoneForm(false); }}
            autoFocus
          />
          <div className="vship-new-zone-actions">
            <button className="vd-btn-primary" style={{ fontSize: 13 }} onClick={createZone} disabled={addingZone || !newZoneName.trim()}>
              {addingZone ? "Creating…" : "Create Zone"}
            </button>
            <button className="vd-btn-outline" style={{ fontSize: 13 }} onClick={() => setShowNewZoneForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {zones.length === 0 && !showNewZoneForm ? (
        <div className="vd-empty-state">
          <div className="vd-empty-title">No shipping zones yet</div>
          <p className="vd-empty-desc">
            Create a zone for each region you ship to and add shipping methods to it.
          </p>
          <button className="vd-btn-primary" style={{ fontSize: 13, marginTop: 16 }} onClick={() => setShowNewZoneForm(true)}>
            + Add your first zone
          </button>
        </div>
      ) : (
        <div className="vship-zones">
          {zones.map((zone) => {
            const isDeletingZone = saving === `zone:${zone.id}`;
            const isAddingMethod = saving === `add:${zone.id}`;
            const isRenaming = renamingZone === zone.id;

            return (
              <div key={zone.id} className="vship-zone">
                <div className="vship-zone-header">
                  <div className="vship-zone-title-area">
                    {isRenaming ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); renameZone(zone.id); }}
                        className="vship-rename-form"
                      >
                        <input
                          className="vpf-input"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Escape") setRenamingZone(null); }}
                          autoFocus
                        />
                        <button type="submit" className="vd-btn-primary" style={{ fontSize: 12, padding: "6px 14px" }} disabled={saving === `rename:${zone.id}`}>
                          Save
                        </button>
                        <button type="button" className="vd-btn-outline" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => setRenamingZone(null)}>
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="vship-zone-name">{zone.name || "Rest of World"}</div>
                        <div className="vship-zone-sub">
                          {zone.methods.length} method{zone.methods.length !== 1 ? "s" : ""}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="vship-zone-controls">
                    {/* Add method dropdown */}
                    <div className="vship-add-method-wrap">
                      <select
                        className="vship-add-method-select"
                        value=""
                        disabled={isAddingMethod}
                        onChange={(e) => { if (e.target.value) addMethod(zone.id, e.target.value); }}
                      >
                        <option value="">{isAddingMethod ? "Adding…" : "+ Add method"}</option>
                        {ADDABLE_METHODS.map((m) => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    {!isRenaming && (
                      <button
                        className="vship-zone-action-btn"
                        title="Rename zone"
                        onClick={() => { setRenamingZone(zone.id); setRenameValue(zone.name); }}
                      >
                        ✎
                      </button>
                    )}

                    <button
                      className="vship-zone-action-btn vship-zone-action-btn--danger"
                      title="Delete zone"
                      disabled={isDeletingZone}
                      onClick={() => deleteZone(zone.id, zone.name || "this zone")}
                    >
                      {isDeletingZone ? "…" : "✕"}
                    </button>
                  </div>
                </div>

                {zone.methods.length === 0 ? (
                  <div className="vship-empty-methods">
                    No shipping methods yet. Add one above.
                  </div>
                ) : (
                  <div className="vship-methods">
                    {zone.methods.map((method) => {
                      const key = `${zone.id}:${method.instance_id}`;
                      const isSaving = saving === key;
                      const hasEdits = Object.keys(method.settings).some(
                        (sid) => editing[editKey(zone.id, method.instance_id, sid)] !== undefined
                      );

                      return (
                        <div key={method.instance_id} className={`vship-method${method.enabled ? "" : " vship-method--disabled"}`}>
                          <div className="vship-method-header">
                            <div className="vship-method-meta">
                              <span className="vship-method-label">
                                {method.title || METHOD_LABELS[method.method_id] || method.method_title}
                              </span>
                              <span className="vship-method-type">{METHOD_LABELS[method.method_id] ?? method.method_id}</span>
                            </div>
                            <div className="vship-method-actions">
                              <button
                                className={`vship-toggle${method.enabled ? " vship-toggle--on" : ""}`}
                                onClick={() => toggleMethod(zone.id, method)}
                                disabled={isSaving}
                                title={method.enabled ? "Disable" : "Enable"}
                              >
                                {method.enabled ? "Enabled" : "Disabled"}
                              </button>
                              <button
                                className="vship-delete"
                                onClick={() => deleteMethod(zone.id, method.instance_id)}
                                disabled={isSaving}
                                title="Remove method"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <div className="vship-settings">
                            {Object.values(method.settings)
                              .filter((s) => ["text", "price", "select", "checkbox"].includes(s.type))
                              .map((setting) => (
                                <div key={setting.id} className="vship-setting-row">
                                  <label className="vship-setting-label">{setting.label}</label>
                                  {setting.type === "select" ? (
                                    <select
                                      className="vpf-input"
                                      style={{ maxWidth: 220 }}
                                      value={getEditValue(zone.id, method.instance_id, setting.id, setting.value)}
                                      onChange={(e) => setEditValue(zone.id, method.instance_id, setting.id, e.target.value)}
                                    >
                                      <option value="">(default)</option>
                                      <option value="yes">Yes</option>
                                      <option value="no">No</option>
                                    </select>
                                  ) : (
                                    <input
                                      className="vpf-input"
                                      style={{ maxWidth: 220 }}
                                      type={setting.type === "price" ? "number" : "text"}
                                      step={setting.type === "price" ? "0.01" : undefined}
                                      min={setting.type === "price" ? "0" : undefined}
                                      value={getEditValue(zone.id, method.instance_id, setting.id, setting.value)}
                                      onChange={(e) => setEditValue(zone.id, method.instance_id, setting.id, e.target.value)}
                                    />
                                  )}
                                </div>
                              ))}
                          </div>

                          {hasEdits && (
                            <div className="vship-save-row">
                              <button
                                className="vd-btn-primary"
                                style={{ fontSize: 13, padding: "8px 20px" }}
                                disabled={isSaving}
                                onClick={() => saveMethod(zone.id, method)}
                              >
                                {isSaving ? "Saving…" : "Save changes"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
