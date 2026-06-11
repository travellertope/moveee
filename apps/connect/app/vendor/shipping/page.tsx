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
  flat_rate:    "Flat Rate",
  free_shipping: "Free Shipping",
  local_pickup:  "Local Pickup",
};

export default function VendorShippingPage() {
  const [zones,   setZones]   = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [saving,  setSaving]  = useState<string>("");  // "zoneId:instanceId"
  const [editing, setEditing] = useState<Record<string, string>>({});  // "key" -> value

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/vendor/shipping/zones")
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((data) => setZones(Array.isArray(data) ? data : []))
      .catch(() => setError("Could not load shipping zones. Please refresh."))
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
    const k = editKey(zoneId, instanceId, settingId);
    setEditing((prev) => ({ ...prev, [k]: value }));
  }

  async function saveMethod(zoneId: number, method: ShippingMethod) {
    const key = `${zoneId}:${method.instance_id}`;
    setSaving(key);
    const settingsUpdate: Record<string, { value: string }> = {};
    for (const [sid, setting] of Object.entries(method.settings)) {
      const k = editKey(zoneId, method.instance_id, sid);
      if (editing[k] !== undefined) {
        settingsUpdate[sid] = { value: editing[k] };
      }
    }

    try {
      const res = await fetch(
        `/api/vendor/shipping/zones/${zoneId}/methods/${method.instance_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: settingsUpdate }),
        }
      );
      if (res.ok) {
        // Clear edited values for this method, reload zones
        setEditing((prev) => {
          const next = { ...prev };
          for (const sid of Object.keys(method.settings)) {
            delete next[editKey(zoneId, method.instance_id, sid)];
          }
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

  async function addFlatRate(zoneId: number) {
    setSaving(`add:${zoneId}`);
    try {
      const res = await fetch(`/api/vendor/shipping/zones/${zoneId}/methods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method_id: "flat_rate" }),
      });
      if (res.ok) load();
      else {
        const d = await res.json();
        setError(d.error ?? "Could not add method");
      }
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
          <h1 className="vd-page-title">Shipping</h1>
        </div>
      </div>

      <p className="vship-intro">
        Shipping zones control which rates customers see at checkout based on their
        delivery address. Each zone can have one or more methods (flat rate, free
        shipping, or local pickup). Rates are per order unless you configure them
        in the method settings.
      </p>

      {error && <div className="vsp-error">{error}</div>}

      {zones.length === 0 ? (
        <div className="vd-empty-state">
          <div className="vd-empty-title">No shipping zones configured</div>
          <p className="vd-empty-desc">
            Shipping zones are set up globally in WooCommerce. Contact your store
            administrator to create zones for the regions you ship to.
          </p>
        </div>
      ) : (
        <div className="vship-zones">
          {zones.map((zone) => (
            <div key={zone.id} className="vship-zone">
              <div className="vship-zone-header">
                <div>
                  <div className="vship-zone-name">{zone.name || "Rest of World"}</div>
                  <div className="vship-zone-sub">
                    {zone.methods.length} method{zone.methods.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <button
                  className="vd-btn-outline"
                  style={{ fontSize: 12 }}
                  disabled={saving === `add:${zone.id}`}
                  onClick={() => addFlatRate(zone.id)}
                >
                  {saving === `add:${zone.id}` ? "Adding…" : "+ Add flat rate"}
                </button>
              </div>

              {zone.methods.length === 0 ? (
                <div className="vship-empty-methods">
                  No methods yet. Add a flat rate above.
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

                        {/* Editable settings */}
                        <div className="vship-settings">
                          {Object.values(method.settings)
                            .filter((s) => ["text", "price", "select", "checkbox"].includes(s.type))
                            .map((setting) => (
                              <div key={setting.id} className="vship-setting-row">
                                <label className="vship-setting-label">{setting.label}</label>
                                {setting.type === "select" ? (
                                  <select
                                    className="vpf-input"
                                    style={{ maxWidth: 200 }}
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
                                    style={{ maxWidth: 200 }}
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
          ))}
        </div>
      )}

      <div className="vship-advanced-note">
        <strong>Need more control?</strong> Advanced options like per-item rates,
        weight-based pricing, and zone regions can be configured in the{" "}
        <a
          href={`${process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com"}/wp-admin/admin.php?page=wc-settings&tab=shipping`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WooCommerce shipping settings ↗
        </a>
      </div>
    </div>
  );
}
