import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Modal, Alert, Share,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import QRCode from "react-native-qrcode-svg";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import type {
  Cluster, ClusterStatus, ClusterElectionStatus,
  ClusterMember, ClusterHostQr, ClusterAttendance, ClusterCheckinResult,
} from "../../types";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useAuthStore } from "../../auth/authStore";

// Host QR refreshes before its 900s server-side TTL expires.
const QR_REFRESH_MS = 13 * 60 * 1000;

function capitalize(s: string) {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paper },
    header: {
      height: 56, flexDirection: "row", alignItems: "center",
      paddingHorizontal: space[4], borderBottomWidth: 1,
      borderBottomColor: c.rule, backgroundColor: c.paper,
    },
    headerTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: c.ink, flex: 1, textAlign: "center" },
    loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
    scroll: { padding: space[4], paddingBottom: 40, gap: 16 },
    notFoundCard: {
      backgroundColor: c.paperWarm, borderRadius: radius.xl, padding: 20,
      alignItems: "center", gap: 10, ...shadows.card,
    },
    notFoundTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: c.ink, textAlign: "center" },
    notFoundText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, textAlign: "center", lineHeight: 19 },
    backLink: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre, marginTop: 4 },
    nameBlock: { gap: 4 },
    eyebrow: { fontFamily: fonts.mono, fontSize: 11, color: c.mute },
    name: { fontFamily: fonts.serifBold, fontSize: 22, color: c.ink },
    address: { fontFamily: fonts.mono, fontSize: 12, color: c.mute },
    card: {
      backgroundColor: c.paperWarm, borderRadius: radius.xl, padding: 16, gap: 8, ...shadows.card,
    },
    cardLabel: { fontFamily: fonts.monoBold, fontSize: 10, color: c.mute, textTransform: "uppercase", letterSpacing: 1 },
    cardBody: { fontFamily: fonts.sans, fontSize: 14, color: c.ink, lineHeight: 20 },
    locationNote: { fontFamily: fonts.sans, fontSize: 13, color: c.ink, lineHeight: 19, marginTop: 4 },
    memberCount: { fontFamily: fonts.mono, fontSize: 12, color: c.mute, marginTop: 6 },
    joinBtn: {
      backgroundColor: c.ochre, borderRadius: radius.full,
      height: 48, alignItems: "center", justifyContent: "center",
      flexDirection: "row",
    },
    joinBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: c.paper },
    leaveBtn: { alignItems: "center", paddingVertical: 8 },
    leaveBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: "#C62828" },
    memberLabel: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    errorText: { fontFamily: fonts.sans, fontSize: 12, color: "#C62828" },
    hostRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    hostBadge: {
      backgroundColor: c.ochre, borderRadius: radius.full,
      paddingHorizontal: 8, paddingVertical: 2,
    },
    hostBadgeText: { fontFamily: fonts.monoBold, fontSize: 9, color: c.paper, textTransform: "uppercase" },
    candidateRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.rule,
    },
    candidateName: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
    candidateVotes: { fontFamily: fonts.mono, fontSize: 11, color: c.mute },
    voteBtn: {
      borderWidth: 1, borderColor: c.ochre, borderRadius: radius.full,
      paddingHorizontal: 12, paddingVertical: 4,
    },
    voteBtnActive: { backgroundColor: c.ochre },
    voteBtnText: { fontFamily: fonts.sansBold, fontSize: 11, color: c.ochre },
    voteBtnTextActive: { color: c.paper },
    runLink: { alignItems: "center", paddingVertical: 8, marginTop: 4 },
    runLinkText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre },
    startElectionBtn: {
      borderWidth: 1, borderColor: c.ochre, borderRadius: radius.full,
      height: 44, alignItems: "center", justifyContent: "center", marginTop: 4,
    },
    startElectionBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre },
    qrBtn: {
      borderWidth: 1, borderColor: c.ochre, borderRadius: radius.full,
      height: 44, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8,
    },
    qrBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre },
    attendanceRow: { flexDirection: "row", gap: 20 },
    attendanceStat: { gap: 2 },
    attendanceValue: { fontFamily: fonts.serifBold, fontSize: 24, color: c.ink },
    attendanceLabel: { fontFamily: fonts.mono, fontSize: 10, color: c.mute, textTransform: "uppercase" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
    modalCard: {
      backgroundColor: c.paper, borderRadius: radius.xl, padding: 24,
      alignItems: "center", gap: 14, width: "85%",
    },
    modalTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: c.ink, textAlign: "center" },
    modalSub: { fontFamily: fonts.sans, fontSize: 12, color: c.mute, textAlign: "center" },
    modalClose: { marginTop: 4, paddingVertical: 8, paddingHorizontal: 16 },
    modalCloseText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre },
    scanFrame: { width: "100%", aspectRatio: 1, borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#000" },
    memberRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.rule,
    },
    memberName: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
    memberRole: { fontFamily: fonts.mono, fontSize: 10, color: c.mute, textTransform: "uppercase" },
    checkinBtn: {
      borderWidth: 1, borderColor: c.ochre, borderRadius: radius.full,
      paddingHorizontal: 12, paddingVertical: 4,
    },
    checkinBtnDone: { backgroundColor: c.ochre },
    checkinBtnText: { fontFamily: fonts.sansBold, fontSize: 11, color: c.ochre },
    checkinBtnTextDone: { color: c.paper },
  });
}

export default function ClusterScreen() {
  const route = useRoute<any>();
  const nav = useNav();
  const c = useColors();
  const myUserId = Number(useAuthStore((s) => s.user?.id) ?? 0);
  const styles = useMemo(() => createStyles(c), [c]);
  const clusterId: number = route.params?.id;

  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [status, setStatus] = useState<ClusterStatus | null>(null);
  const [election, setElection] = useState<ClusterElectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [electionBusy, setElectionBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);

  const [attendance, setAttendance] = useState<ClusterAttendance | null>(null);

  const [hostQr, setHostQr] = useState<ClusterHostQr | null>(null);
  const [showHostQr, setShowHostQr] = useState(false);
  const qrTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showScan, setShowScan] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [members, setMembers] = useState<ClusterMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [checkedInIds, setCheckedInIds] = useState<Set<number>>(new Set());

  const isHost = !!cluster && cluster.hostId === myUserId;
  const isFounder = !!status?.role && status.role === "founder";

  const handleShare = async () => {
    if (!cluster) return;
    const url = `https://web.themoveee.com/cluster/${clusterId}/invite`;
    await Share.share({
      message: `Join my House Fellowship "${cluster.name}" on Moveee! ${url}`,
      url,
    });
  };

  const loadElection = async () => {
    try {
      const res = await api.get<ClusterElectionStatus>(`${MOBILE_API}/cluster/${clusterId}/election`);
      setElection(res ?? null);
    } catch {
      // non-fatal — election section just won't render
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [clusterRes, statusRes] = await Promise.all([
          api.get<Cluster>(`${MOBILE_API}/cluster/${clusterId}`),
          api.get<ClusterStatus>(`${MOBILE_API}/cluster/${clusterId}/status`),
        ]);
        setCluster(clusterRes ?? null);
        setStatus(statusRes ?? { isMember: false, role: null, joinedAt: null });
        if (clusterRes?.status === "active") {
          await loadElection();
        }
        if (statusRes?.isMember) {
          try {
            const attendanceRes = await api.get<ClusterAttendance>(`${MOBILE_API}/cluster/${clusterId}/attendance`);
            setAttendance(attendanceRes ?? null);
          } catch {
            // non-fatal — attendance section just won't render
          }
        }
      } catch {
        setCluster(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [clusterId]);

  const startElection = async () => {
    setElectionBusy(true);
    setError("");
    try {
      await api.post(`${MOBILE_API}/cluster/${clusterId}/election/start`, {});
      await loadElection();
    } catch {
      setError("Could not start an election right now.");
    } finally {
      setElectionBusy(false);
    }
  };

  const castVote = async (candidateId: number) => {
    setElectionBusy(true);
    setError("");
    try {
      await api.post(`${MOBILE_API}/cluster/${clusterId}/election/vote`, { candidate_id: candidateId });
      await loadElection();
    } catch {
      setError("Could not cast your vote right now.");
    } finally {
      setElectionBusy(false);
    }
  };

  const join = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post(`${MOBILE_API}/cluster/${clusterId}/join`, {});
      setStatus((s) => ({ isMember: true, role: s?.role ?? null, joinedAt: s?.joinedAt ?? null }));
    } catch {
      setError("Could not join right now.");
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post(`${MOBILE_API}/cluster/${clusterId}/leave`, {});
      setStatus((s) => ({ isMember: false, role: s?.role ?? null, joinedAt: s?.joinedAt ?? null }));
    } catch {
      setError("Could not leave right now.");
    } finally {
      setBusy(false);
    }
  };

  const fetchHostQr = async () => {
    try {
      const res = await api.get<ClusterHostQr>(`${MOBILE_API}/cluster/${clusterId}/host-qr`);
      setHostQr(res ?? null);
    } catch {
      setHostQr(null);
    }
  };

  const openHostQr = async () => {
    await fetchHostQr();
    setShowHostQr(true);
  };

  useEffect(() => {
    if (showHostQr) {
      qrTimerRef.current = setInterval(fetchHostQr, QR_REFRESH_MS);
    } else if (qrTimerRef.current) {
      clearInterval(qrTimerRef.current);
      qrTimerRef.current = null;
    }
    return () => {
      if (qrTimerRef.current) {
        clearInterval(qrTimerRef.current);
        qrTimerRef.current = null;
      }
    };
  }, [showHostQr]);

  const openScan = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert("Camera access needed", "Allow camera access to scan the host's check-in code.");
        return;
      }
    }
    setShowScan(true);
  };

  const handleScanned = async (data: string) => {
    if (scanBusy) return;
    setScanBusy(true);
    try {
      const parsed = JSON.parse(data) as { clusterId?: number; meetingDate?: string; expiresAt?: number; token?: string };
      if (!parsed.token || !parsed.meetingDate || !parsed.expiresAt) {
        throw new Error("invalid");
      }
      const res = await api.post<ClusterCheckinResult>(`${MOBILE_API}/cluster/${clusterId}/checkin`, {
        meeting_date: parsed.meetingDate,
        expires_at: parsed.expiresAt,
        token: parsed.token,
      });
      setShowScan(false);
      if (res?.alreadyCheckedIn) {
        Alert.alert("Already checked in", "You're already marked present for this meeting.");
      } else {
        Alert.alert("Checked in ✓", "See you there!");
      }
      try {
        const attendanceRes = await api.get<ClusterAttendance>(`${MOBILE_API}/cluster/${clusterId}/attendance`);
        setAttendance(attendanceRes ?? null);
      } catch {
        // non-fatal
      }
    } catch {
      setShowScan(false);
      Alert.alert("Couldn't check you in", "That code may have expired — ask your host to refresh it and try again.");
    } finally {
      setScanBusy(false);
    }
  };

  const openMembers = async () => {
    try {
      const res = await api.get<{ members: ClusterMember[] }>(`${MOBILE_API}/cluster/${clusterId}/members`);
      setMembers(res?.members ?? []);
      setShowMembers(true);
    } catch {
      setError("Could not load members right now.");
    }
  };

  const manualCheckin = async (memberUserId: number) => {
    try {
      const res = await api.post<ClusterCheckinResult>(`${MOBILE_API}/cluster/${clusterId}/checkin-manual`, {
        member_user_id: memberUserId,
      });
      if (res?.success) {
        setCheckedInIds((prev) => new Set(prev).add(memberUserId));
      }
    } catch {
      Alert.alert("Couldn't check in this member", "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>House Fellowship</Text>
        {cluster ? (
          <TouchableOpacity onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="share-outline" size={22} color={c.ink} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={c.ochre} />
        </View>
      ) : !cluster ? (
        <View style={[styles.scroll, { flex: 1, justifyContent: "center" }]}>
          <View style={styles.notFoundCard}>
            <Ionicons name="alert-circle-outline" size={28} color={c.ochre} />
            <Text style={styles.notFoundTitle}>Not found</Text>
            <Text style={styles.notFoundText}>This House Fellowship doesn't exist or has been removed.</Text>
            <TouchableOpacity onPress={() => nav.goBack()}>
              <Text style={styles.backLink}>← Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.nameBlock}>
            <Text style={styles.eyebrow}>People Near Me › House Fellowship</Text>
            <Text style={styles.name}>{cluster.name}</Text>
            <Text style={styles.address}>
              {[cluster.street, cluster.city, cluster.country].filter(Boolean).join(", ")}
            </Text>
          </View>

          {cluster.hostName ? (
            <View style={styles.hostRow}>
              <Text style={styles.memberLabel}>Host: {cluster.hostName}</Text>
              <View style={styles.hostBadge}>
                <Text style={styles.hostBadgeText}>{cluster.hostMechanism?.replace("_", " ") || "host"}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Meeting</Text>
            <Text style={styles.cardBody}>
              {cluster.meetingDay && cluster.meetingTime
                ? `${capitalize(cluster.meetingDay)}s, ${cluster.meetingTime}`
                : "Meeting time not set yet."}
            </Text>
            {status?.isMember && cluster.locationNote ? (
              <Text style={styles.locationNote}>
                <Text style={{ fontFamily: fonts.sansBold }}>Location note: </Text>
                {cluster.locationNote}
              </Text>
            ) : null}
            <Text style={styles.memberCount}>
              {cluster.memberCount}{cluster.capacity > 0 ? ` / ${cluster.capacity}` : ""} members
            </Text>
          </View>

          {cluster.status === "forming" && status?.isMember && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Getting started</Text>
              <Text style={styles.cardBody}>
                This fellowship needs at least 4 members to activate. Share the invite link with neighbours and friends to get started.
              </Text>
              <Text style={styles.memberCount}>
                {cluster.memberCount} of 4 members needed
              </Text>
              <TouchableOpacity style={styles.joinBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.joinBtnText}>Share invite link</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.card}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {status?.isMember ? (
              <>
                <Text style={styles.memberLabel}>You're a member</Text>
                <TouchableOpacity style={styles.leaveBtn} onPress={() => setConfirmLeave(true)} disabled={busy}>
                  <Text style={styles.leaveBtnText}>{busy ? "Leaving…" : "Leave House Fellowship"}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.memberLabel}>Join this House Fellowship</Text>
                <TouchableOpacity style={styles.joinBtn} onPress={join} disabled={busy}>
                  <Text style={styles.joinBtnText}>{busy ? "Joining…" : "Join →"}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {cluster.status === "active" && status?.isMember ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Host Election</Text>
              {election?.open ? (
                <>
                  {election.candidates.length === 0 ? (
                    <Text style={styles.cardBody}>No votes yet — be the first to put yourself forward.</Text>
                  ) : (
                    election.candidates.map((cand) => (
                      <View key={cand.id} style={styles.candidateRow}>
                        <View>
                          <Text style={styles.candidateName}>{cand.name}</Text>
                          <Text style={styles.candidateVotes}>{cand.voteCount} vote{cand.voteCount === 1 ? "" : "s"}</Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.voteBtn, election.myVote === cand.id && styles.voteBtnActive]}
                          onPress={() => castVote(cand.id)}
                          disabled={electionBusy}
                        >
                          <Text style={[styles.voteBtnText, election.myVote === cand.id && styles.voteBtnTextActive]}>
                            {election.myVote === cand.id ? "Voted" : "Vote"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                  {election.myVote !== myUserId ? (
                    <TouchableOpacity style={styles.runLink} onPress={() => castVote(myUserId)} disabled={electionBusy}>
                      <Text style={styles.runLinkText}>I'll run →</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.cardBody}>No election in progress.</Text>
                  <TouchableOpacity style={styles.startElectionBtn} onPress={startElection} disabled={electionBusy}>
                    <Text style={styles.startElectionBtnText}>{electionBusy ? "Starting…" : "Start a host election"}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : null}

          {cluster.status === "active" && status?.isMember ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Check-in</Text>
              {isHost ? (
                <>
                  <TouchableOpacity style={styles.qrBtn} onPress={openHostQr}>
                    <Ionicons name="qr-code-outline" size={16} color={c.ochre} />
                    <Text style={styles.qrBtnText}>Show check-in QR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.qrBtn} onPress={openMembers}>
                    <Ionicons name="people-outline" size={16} color={c.ochre} />
                    <Text style={styles.qrBtnText}>Manual check-in</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.qrBtn} onPress={openScan}>
                  <Ionicons name="scan-outline" size={16} color={c.ochre} />
                  <Text style={styles.qrBtnText}>Scan to check in</Text>
                </TouchableOpacity>
              )}
              {attendance ? (
                <View style={styles.attendanceRow}>
                  <View style={styles.attendanceStat}>
                    <Text style={styles.attendanceValue}>{attendance.totalCheckins}</Text>
                    <Text style={styles.attendanceLabel}>Check-ins</Text>
                  </View>
                  <View style={styles.attendanceStat}>
                    <Text style={styles.attendanceValue}>{attendance.streak}</Text>
                    <Text style={styles.attendanceLabel}>Week streak</Text>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      )}

      <Modal visible={showHostQr} transparent animationType="fade" onRequestClose={() => setShowHostQr(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Check-in code</Text>
            <Text style={styles.modalSub}>Members scan this to mark themselves present. Refreshes automatically.</Text>
            {hostQr ? (
              <QRCode value={JSON.stringify({ clusterId, ...hostQr })} size={200} />
            ) : (
              <ActivityIndicator color={c.ochre} />
            )}
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowHostQr(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showScan} transparent animationType="slide" onRequestClose={() => setShowScan(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Scan check-in code</Text>
            <View style={styles.scanFrame}>
              {showScan ? (
                <CameraView
                  style={{ flex: 1 }}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  onBarcodeScanned={({ data }) => handleScanned(data)}
                />
              ) : null}
            </View>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowScan(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showMembers} transparent animationType="slide" onRequestClose={() => setShowMembers(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { alignItems: "stretch" }]}>
            <Text style={styles.modalTitle}>Manual check-in</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {members.map((m) => {
                const done = checkedInIds.has(m.id);
                return (
                  <View key={m.id} style={styles.memberRow}>
                    <View>
                      <Text style={styles.memberName}>{m.name}</Text>
                      <Text style={styles.memberRole}>{m.role}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.checkinBtn, done && styles.checkinBtnDone]}
                      onPress={() => manualCheckin(m.id)}
                      disabled={done}
                    >
                      <Text style={[styles.checkinBtnText, done && styles.checkinBtnTextDone]}>
                        {done ? "Checked in" : "Check in"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowMembers(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={leave}
        title="Leave this House Fellowship?"
        confirmLabel="Leave"
        destructive
      />
    </SafeAreaView>
  );
}
