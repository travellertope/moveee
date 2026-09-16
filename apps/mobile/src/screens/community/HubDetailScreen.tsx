import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, Image,
  TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useNav } from "../../hooks/useNav";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { useTabletContentStyle } from "../../hooks/useTabletContentStyle";
import { api, MOBILE_API } from "../../api/client";
import type { Hub, HubStatus, FeedItem } from "../../types";
import { useAuthStore } from "../../auth/authStore";
import FeedItemCard from "../../components/community/FeedItemCard";
import BottomSheet from "../../components/ui/BottomSheet";
import { hubGradient } from "../../utils/hubGradient";

const ALL_TEMPLATES: { slug: string; label: string; emoji: string }[] = [
  { slug: "post", label: "Update", emoji: "📝" },
  { slug: "hidden-gem", label: "Place", emoji: "💎" },
  { slug: "food-review", label: "Food", emoji: "🍽️" },
  { slug: "book-review", label: "Book", emoji: "📚" },
  { slug: "creative-showcase", label: "Showcase", emoji: "🎨" },
  { slug: "event", label: "Event", emoji: "📅" },
  { slug: "poll", label: "Poll", emoji: "📊" },
  { slug: "itinerary", label: "Itinerary", emoji: "🗺️" },
];

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
    notFoundText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, textAlign: "center" },
    card: { backgroundColor: c.paperWarm, borderRadius: radius.xl, padding: 16, gap: 8, ...shadows.card },
    cardLabel: { fontFamily: fonts.monoBold, fontSize: 10, color: c.mute, textTransform: "uppercase", letterSpacing: 1 },
    cardBody: { fontFamily: fonts.sans, fontSize: 14, color: c.ink, lineHeight: 20 },
    row: { flexDirection: "row", gap: 10, alignItems: "center" },

    // Banner — full-bleed (cancels the scroll container's own padding),
    // photo/badge/title/stats/Join-Follow all overlay it directly, the way
    // the web/mobile mockup settled on: everything overlaid stays fully
    // inside the scrimmed zone, never straddling onto the plain page below.
    banner: {
      height: 190, position: "relative", overflow: "hidden",
      marginTop: -space[4], marginHorizontal: -space[4],
    },
    bannerTopbar: {
      position: "absolute", top: 0, left: 0, right: 0, height: 52, zIndex: 3,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 12,
    },
    bannerIconBtn: {
      width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
      backgroundColor: "rgba(20,17,13,0.4)",
    },
    hubIcon: {
      position: "absolute", left: 16, bottom: 14, zIndex: 2,
      width: 68, height: 68, borderRadius: 20, borderWidth: 3, borderColor: c.paper,
      alignItems: "center", justifyContent: "center", ...shadows.modal,
    },
    hubIconText: { fontFamily: fonts.serifBold, fontSize: 26, color: "#fff" },
    hubHead: { position: "absolute", left: 100, right: 16, bottom: 14, zIndex: 2 },
    hubHeadRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
    hubInfo: { flex: 1 },
    officialChip: {
      alignSelf: "flex-start", backgroundColor: c.ochre,
      paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, marginBottom: 4,
    },
    officialChipText: { fontFamily: fonts.monoBold, fontSize: 8.5, color: "#fff", letterSpacing: 0.6, textTransform: "uppercase" },
    hubNameOverlay: {
      fontFamily: fonts.serifBold, fontSize: 18, color: "#fff", marginBottom: 3,
      textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    },
    hubStatsOverlay: { fontFamily: fonts.mono, fontSize: 10.5, color: "rgba(255,255,255,0.85)" },
    hubActionsOverlay: { flexDirection: "row", gap: 8, flexShrink: 0 },
    // Icon-only Join/Follow — always a solid, opaque fill (never a bare
    // outline or translucent tint that reads as "no background"). Ochre =
    // the active/primary state (Join, Following); paper = the secondary
    // confirmed state (Joined, plain Follow) — no new color tokens needed.
    overlayIconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", ...shadows.card },
    overlayIconBtnOchre: { backgroundColor: c.ochre },
    overlayIconBtnPaper: { backgroundColor: c.paper },
    joinBtn: {
      backgroundColor: c.ochre, borderRadius: radius.full,
      height: 44, paddingHorizontal: 20, alignItems: "center", justifyContent: "center",
    },
    joinBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: c.paper },
    followBtn: {
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.full,
      height: 44, paddingHorizontal: 20, alignItems: "center", justifyContent: "center",
    },
    followBtnActive: { borderColor: c.ochre },
    followBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    notifyToggleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    notifyToggleText: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
    leaveBtn: { paddingVertical: 8 },
    leaveBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: "#C62828" },
    ownerText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
    errorText: { fontFamily: fonts.sans, fontSize: 12, color: "#C62828" },
    manageLink: { paddingVertical: 4 },
    manageLinkText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre },
    label: { fontFamily: fonts.monoBold, fontSize: 10, color: c.mute, textTransform: "uppercase", letterSpacing: 1, marginTop: 10 },
    input: {
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.lg,
      paddingHorizontal: 12, height: 40, fontFamily: fonts.sans, fontSize: 14, color: c.ink, marginTop: 4,
    },
    textarea: {
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.lg,
      padding: 12, fontFamily: fonts.sans, fontSize: 14, color: c.ink, minHeight: 70, textAlignVertical: "top", marginTop: 4,
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
    chip: {
      flexDirection: "row", alignItems: "center", gap: 4,
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.full,
      paddingHorizontal: 10, paddingVertical: 6,
    },
    chipActive: { borderColor: c.ochre, backgroundColor: c.paper },
    chipText: { fontFamily: fonts.sans, fontSize: 12, color: c.ink },
    coverPicker: {
      height: 100, borderRadius: radius.lg, borderWidth: 1, borderColor: c.rule,
      borderStyle: "dashed", alignItems: "center", justifyContent: "center", overflow: "hidden", marginTop: 4,
    },
    coverPickerText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute },
    coverImage: { width: "100%", height: "100%" },
    saveBtn: {
      backgroundColor: c.ochre, borderRadius: radius.full, height: 40,
      alignItems: "center", justifyContent: "center", marginTop: 12,
    },
    saveBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.paper },
    archiveBtn: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.rule },
    archiveBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: "#C62828" },
    membersSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.rule, gap: 8 },
    memberRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    memberName: { fontFamily: fonts.sans, fontSize: 13, color: c.ink },
    memberRole: { fontFamily: fonts.mono, fontSize: 10, color: c.mute, textTransform: "uppercase" },
    memberActions: { flexDirection: "row", gap: 12 },
    memberActionText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.ochre },
    memberActionDanger: { fontFamily: fonts.sansBold, fontSize: 12, color: "#C62828" },
    pinnedLabel: { fontFamily: fonts.monoBold, fontSize: 10, color: c.ochre, textTransform: "uppercase", marginBottom: 2, paddingHorizontal: space[4] },
    modRow: { flexDirection: "row", gap: 16, marginTop: 4, marginBottom: 8, paddingHorizontal: space[4] },
    // Feed list — breaks out of the screen's own horizontal padding (negative
    // margin cancels it) so FeedItemCard's own baked-in marginHorizontal:16 is
    // the only inset, matching the main Connect feed exactly instead of
    // stacking two insets on top of each other.
    feedListWrap: { marginHorizontal: -space[4], gap: 12 },
  });
}

export default function HubDetailScreen() {
  const nav = useNav();
  const route = useRoute<any>();
  const slug: string = route.params?.slug;
  const c = useColors();
  const styles = React.useMemo(() => createStyles(c), [c]);
  const tabletCap = useTabletContentStyle(680);
  const { user } = useAuthStore() as any;

  const [loading, setLoading] = useState(true);
  const [hub, setHub] = useState<Hub | null>(null);
  const [status, setStatus] = useState<HubStatus>({ isMember: false, role: null, isFollowing: false, notifyPosts: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [manageOpen, setManageOpen] = useState(false);
  const [mName, setMName] = useState("");
  const [mDescription, setMDescription] = useState("");
  const [mAllowed, setMAllowed] = useState<string[]>([]);
  const [mCoverImageUrl, setMCoverImageUrl] = useState("");
  const [mUploadingCover, setMUploadingCover] = useState(false);
  const [mSaving, setMSaving] = useState(false);
  const [mArchiving, setMArchiving] = useState(false);
  const [mError, setMError] = useState("");

  const isOwner = status.role === "owner";
  const isModerator = status.role === "owner" || status.role === "mod";

  const [hubMembers, setHubMembers] = useState<{ id: number; name: string; role: string }[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberBusyId, setMemberBusyId] = useState<number | null>(null);
  const [memberError, setMemberError] = useState("");

  const [busyWpId, setBusyWpId] = useState<string | null>(null);

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  const loadFeed = React.useCallback(async (id: number) => {
    setFeedLoading(true);
    try {
      const data = await api.get<{ items: FeedItem[] }>(`${MOBILE_API}/hub/${id}/feed?per_page=20`, false);
      setFeedItems(data?.items ?? []);
    } catch {
      setFeedItems([]);
    }
    setFeedLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const hubData = await api.get<Hub>(`${MOBILE_API}/hub/slug/${slug}`, false);
        setHub(hubData);
        if (hubData) {
          setMName(hubData.name);
          setMDescription(hubData.description);
          setMAllowed(hubData.allowedTemplates ?? []);
          setMCoverImageUrl(hubData.coverImageUrl ?? "");
          loadFeed(hubData.id);
        }
        if (hubData && user) {
          const statusData = await api.get<HubStatus>(`${MOBILE_API}/hub/${hubData.id}/status`);
          setStatus(statusData);
        }
      } catch {
        setHub(null);
      }
      setLoading(false);
    })();
  }, [slug, user, loadFeed]);

  useFocusEffect(
    React.useCallback(() => {
      if (hub) loadFeed(hub.id);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hub?.id])
  );

  const join = async () => {
    if (!hub) return;
    setBusy(true);
    setError("");
    try {
      const s = await api.post<HubStatus>(`${MOBILE_API}/hub/${hub.id}/join`, {});
      setStatus(s);
    } catch (e: any) {
      setError(e?.message || "Could not join right now.");
    }
    setBusy(false);
  };

  const leave = async () => {
    if (!hub || status.role === "owner") return;
    Alert.alert("Leave Hub", "Leave this Hub?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave", style: "destructive", onPress: async () => {
          setBusy(true);
          try {
            const s = await api.post<HubStatus>(`${MOBILE_API}/hub/${hub.id}/leave`, {});
            setStatus(s);
          } catch (e: any) {
            setError(e?.message || "Could not leave right now.");
          }
          setBusy(false);
        },
      },
    ]);
  };

  const toggleFollow = async () => {
    if (!hub) return;
    setBusy(true);
    try {
      const path = status.isFollowing ? "unfollow" : "follow";
      const s = await api.post<HubStatus>(`${MOBILE_API}/hub/${hub.id}/${path}`, {});
      setStatus(s);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    }
    setBusy(false);
  };

  const toggleNotifyPosts = async () => {
    if (!hub) return;
    setBusy(true);
    try {
      const s = await api.post<HubStatus>(`${MOBILE_API}/hub/${hub.id}/follow`, {
        notify_posts: !status.notifyPosts,
      });
      setStatus(s);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    }
    setBusy(false);
  };

  const toggleTemplate = (slug: string) => {
    setMAllowed((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));
  };

  const pickManageCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setMUploadingCover(true);
    setMError("");
    try {
      const fileName = uri.split("/").pop() ?? "cover.jpg";
      const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
      const res = await api.upload<{ url: string }>(`${MOBILE_API}/community/upload-image`, uri, fileName, fileType);
      setMCoverImageUrl(res.url);
    } catch {
      setMError("Could not upload that image.");
    }
    setMUploadingCover(false);
  };

  const saveManage = async () => {
    if (!hub) return;
    setMSaving(true);
    setMError("");
    try {
      const updated = await api.patch<Hub>(`${MOBILE_API}/hub/${hub.id}`, {
        name: mName.trim(),
        description: mDescription.trim(),
        allowed_templates: mAllowed,
        cover_image_url: mCoverImageUrl,
      });
      setHub(updated);
    } catch (e: any) {
      setMError(e?.message || "Could not save changes.");
    }
    setMSaving(false);
  };

  const archiveHub = async () => {
    if (!hub) return;
    Alert.alert(
      "Archive Hub",
      "Archive this Hub? It becomes read-only — no new posts, joins, or edits. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive", style: "destructive", onPress: async () => {
            setMArchiving(true);
            setMError("");
            try {
              const updated = await api.delete<Hub>(`${MOBILE_API}/hub/${hub.id}`);
              setHub(updated);
            } catch (e: any) {
              setMError(e?.message || "Could not archive this Hub.");
            }
            setMArchiving(false);
          },
        },
      ]
    );
  };

  const loadMembers = React.useCallback(async (id: number) => {
    setMembersLoading(true);
    try {
      const data = await api.get<{ members: { id: number; name: string; role: string }[] }>(
        `${MOBILE_API}/hub/${id}/members?per_page=100`, false
      );
      setHubMembers(data?.members ?? []);
    } catch {
      setHubMembers([]);
    }
    setMembersLoading(false);
  }, []);

  useEffect(() => {
    if (manageOpen && hub) loadMembers(hub.id);
  }, [manageOpen, hub?.id, loadMembers]);

  const appointMod = async (userId: number) => {
    if (!hub) return;
    setMemberBusyId(userId);
    setMemberError("");
    try {
      await api.post(`${MOBILE_API}/hub/${hub.id}/mods`, { target_user_id: userId });
      setHubMembers((cur) => cur.map((m) => (m.id === userId ? { ...m, role: "mod" } : m)));
    } catch (e: any) {
      setMemberError(e?.message || "Could not appoint mod.");
    }
    setMemberBusyId(null);
  };

  const removeMod = async (userId: number) => {
    if (!hub) return;
    setMemberBusyId(userId);
    setMemberError("");
    try {
      await api.delete(`${MOBILE_API}/hub/${hub.id}/mods/${userId}`);
      setHubMembers((cur) => cur.map((m) => (m.id === userId ? { ...m, role: "member" } : m)));
    } catch (e: any) {
      setMemberError(e?.message || "Could not remove mod.");
    }
    setMemberBusyId(null);
  };

  const removeHubMember = (userId: number) => {
    if (!hub) return;
    Alert.alert("Remove member", "Remove this member from the Hub?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          setMemberBusyId(userId);
          setMemberError("");
          try {
            await api.delete(`${MOBILE_API}/hub/${hub.id}/members/${userId}`);
            setHubMembers((cur) => cur.filter((m) => m.id !== userId));
          } catch (e: any) {
            setMemberError(e?.message || "Could not remove member.");
          }
          setMemberBusyId(null);
        },
      },
    ]);
  };

  const togglePin = async (item: FeedItem & { isPinned?: boolean; wpId?: string }) => {
    if (!hub || !item.wpId) return;
    setBusyWpId(item.wpId);
    try {
      if (item.isPinned) {
        await api.delete(`${MOBILE_API}/hub/${hub.id}/pin`);
      } else {
        await api.post(`${MOBILE_API}/hub/${hub.id}/pin`, { post_id: Number(item.wpId) });
      }
      loadFeed(hub.id);
    } catch {
      // no-op — leave the list as-is, user can retry
    }
    setBusyWpId(null);
  };

  const removePost = (item: FeedItem & { wpId?: string }) => {
    if (!hub || !item.wpId) return;
    Alert.alert("Remove post", "Remove this post from the Hub? The author will be notified.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          setBusyWpId(item.wpId!);
          try {
            await api.post(`${MOBILE_API}/hub/${hub.id}/remove-post`, { post_id: Number(item.wpId) });
            loadFeed(hub.id);
          } catch {
            // no-op
          }
          setBusyWpId(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      {(loading || !hub) && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={24} color={c.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hub</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator color={c.gold} /></View>
      ) : !hub ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.notFoundText}>This Hub doesn't exist or has been removed.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.scroll, tabletCap]}>
          {hub.status === "archived" && (
            <View style={styles.card}>
              <Text style={[styles.cardBody, { fontWeight: "700" }]}>
                This Hub is archived — read-only, no new posts or members.
              </Text>
            </View>
          )}

          {/* Banner — photo, badge, title, stats, and the icon-only
              Join/Follow pair all overlay the cover directly (white text
              over a scrim), the way the approved mockup settled on. The
              back/manage icons replace the old fixed header bar entirely
              once the Hub has loaded. */}
          <View style={styles.banner}>
            {hub.coverImageUrl ? (
              <Image source={{ uri: hub.coverImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={hubGradient(hub.id)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <LinearGradient
              colors={["transparent", "rgba(20,17,13,0.32)", "rgba(20,17,13,0.8)"]}
              locations={[0, 0.35, 1]}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.bannerTopbar}>
              <TouchableOpacity
                style={styles.bannerIconBtn}
                onPress={() => nav.goBack()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              {isModerator ? (
                <TouchableOpacity
                  style={styles.bannerIconBtn}
                  onPress={() => setManageOpen(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={isOwner ? "Manage Hub" : "Moderate"}
                >
                  <Ionicons name="settings-outline" size={18} color="#fff" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 34 }} />
              )}
            </View>

            <View style={styles.hubIcon}>
              <Text style={styles.hubIconText}>{(hub.name || "?").slice(0, 1).toUpperCase()}</Text>
            </View>

            <View style={styles.hubHead}>
              <View style={styles.hubHeadRow}>
                <View style={styles.hubInfo}>
                  {hub.isOfficial && (
                    <View style={styles.officialChip}>
                      <Text style={styles.officialChipText}>Official</Text>
                    </View>
                  )}
                  <Text style={styles.hubNameOverlay} numberOfLines={2}>{hub.name}</Text>
                  <Text style={styles.hubStatsOverlay}>
                    {hub.memberCount} member{hub.memberCount === 1 ? "" : "s"} · {hub.postCount} post{hub.postCount === 1 ? "" : "s"}
                  </Text>
                </View>
                <View style={styles.hubActionsOverlay}>
                  {status.isMember ? (
                    status.role === "owner" ? (
                      <View style={[styles.overlayIconBtn, styles.overlayIconBtnPaper]} accessibilityLabel="You own this Hub">
                        <Ionicons name="ribbon" size={17} color={c.ochre} />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.overlayIconBtn, styles.overlayIconBtnPaper]}
                        onPress={leave}
                        disabled={busy}
                        accessibilityLabel="Leave Hub"
                      >
                        <Ionicons name="checkmark" size={18} color={c.ochre} />
                      </TouchableOpacity>
                    )
                  ) : (
                    <TouchableOpacity
                      style={[styles.overlayIconBtn, styles.overlayIconBtnOchre]}
                      onPress={join}
                      disabled={busy}
                      accessibilityLabel="Join Hub"
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.overlayIconBtn, status.isFollowing ? styles.overlayIconBtnOchre : styles.overlayIconBtnPaper]}
                    onPress={toggleFollow}
                    disabled={busy}
                    accessibilityLabel={status.isFollowing ? "Unfollow Hub" : "Follow Hub"}
                  >
                    <Ionicons
                      name={status.isFollowing ? "person-remove-outline" : "person-add-outline"}
                      size={17}
                      color={status.isFollowing ? "#fff" : c.inkSoft}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.cardBody}>{hub.description}</Text>

          {(error || status.isFollowing) && (
            <View style={styles.card}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {status.isFollowing && (
                <TouchableOpacity style={styles.notifyToggleRow} onPress={toggleNotifyPosts} disabled={busy}>
                  <Ionicons
                    name={status.notifyPosts ? "checkbox" : "square-outline"}
                    size={16}
                    color={status.notifyPosts ? c.ochre : c.ghost}
                  />
                  <Text style={styles.notifyToggleText}>Notify me when they post</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Moderator tools — tucked behind the banner's ⚙ icon instead of
              an always-expanded inline form pushing the feed down for every
              visitor who happens to be a mod. */}
          {isModerator && (
            <BottomSheet visible={manageOpen} onClose={() => setManageOpen(false)}>
              <View style={{ paddingHorizontal: space[4], paddingTop: 4 }}>
                <Text style={styles.cardLabel}>{isOwner ? "Manage Hub" : "Moderate"}</Text>
                {mError ? <Text style={styles.errorText}>{mError}</Text> : null}

                {isOwner && (
                  <>
                    <Text style={styles.label}>Hub name</Text>
                    <TextInput
                      style={styles.input}
                      value={mName}
                      onChangeText={setMName}
                      editable={!mSaving && hub.status !== "archived"}
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                      style={styles.textarea}
                      value={mDescription}
                      onChangeText={setMDescription}
                      editable={!mSaving && hub.status !== "archived"}
                      multiline
                    />

                    <Text style={styles.label}>Cover image</Text>
                    <TouchableOpacity
                      style={styles.coverPicker}
                      onPress={pickManageCover}
                      disabled={mSaving || mUploadingCover || hub.status === "archived"}
                    >
                      {mUploadingCover ? (
                        <ActivityIndicator color={c.gold} />
                      ) : mCoverImageUrl ? (
                        <Image source={{ uri: mCoverImageUrl }} style={styles.coverImage} />
                      ) : (
                        <Text style={styles.coverPickerText}>Choose an image</Text>
                      )}
                    </TouchableOpacity>

                    <Text style={styles.label}>What can members post?</Text>
                    <View style={styles.grid}>
                      {ALL_TEMPLATES.map((t) => {
                        const active = mAllowed.includes(t.slug);
                        return (
                          <TouchableOpacity
                            key={t.slug}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => toggleTemplate(t.slug)}
                            disabled={hub.status === "archived"}
                          >
                            <Text style={styles.chipText}>{t.emoji} {t.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                      <TouchableOpacity
                        style={[styles.saveBtn, { flex: 1 }, (mSaving || hub.status === "archived") && { opacity: 0.5 }]}
                        onPress={saveManage}
                        disabled={mSaving || hub.status === "archived" || !mName.trim() || !mDescription.trim()}
                      >
                        {mSaving ? <ActivityIndicator color={c.paper} /> : <Text style={styles.saveBtnText}>Save changes</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setManageOpen(false)}>
                        <Text style={styles.manageLinkText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {!isOwner && (
                  <TouchableOpacity onPress={() => setManageOpen(false)} style={{ marginTop: 8 }}>
                    <Text style={styles.manageLinkText}>Close</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.membersSection}>
                  <Text style={styles.label}>Members</Text>
                  {memberError ? <Text style={styles.errorText}>{memberError}</Text> : null}
                  {membersLoading ? (
                    <ActivityIndicator color={c.gold} />
                  ) : (
                    hubMembers.map((m) => (
                      <View key={m.id} style={styles.memberRow}>
                        <Text style={styles.memberName}>{m.name} <Text style={styles.memberRole}>{m.role}</Text></Text>
                        {m.role !== "owner" && (isOwner || m.role !== "mod") && (
                          <View style={styles.memberActions}>
                            {isOwner && m.role === "mod" ? (
                              <TouchableOpacity onPress={() => removeMod(m.id)} disabled={memberBusyId === m.id}>
                                <Text style={styles.memberActionText}>Remove mod</Text>
                              </TouchableOpacity>
                            ) : isOwner ? (
                              <TouchableOpacity onPress={() => appointMod(m.id)} disabled={memberBusyId === m.id}>
                                <Text style={styles.memberActionText}>Make mod</Text>
                              </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity onPress={() => removeHubMember(m.id)} disabled={memberBusyId === m.id}>
                              <Text style={styles.memberActionDanger}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))
                  )}
                </View>

                {isOwner && hub.status !== "archived" && (
                  <TouchableOpacity style={styles.archiveBtn} onPress={archiveHub} disabled={mArchiving}>
                    <Text style={styles.archiveBtnText}>{mArchiving ? "Archiving…" : "Archive this Hub"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </BottomSheet>
          )}

          {status.isMember && hub.status !== "archived" && (
            <TouchableOpacity
              style={styles.joinBtn}
              onPress={() => nav.navigate("NewPost", {
                hubId: hub.id,
                hubSlug: hub.slug,
                hubAllowedTemplates: hub.allowedTemplates,
              })}
            >
              <Text style={styles.joinBtnText}>+ New post</Text>
            </TouchableOpacity>
          )}

          {feedLoading ? (
            <ActivityIndicator color={c.gold} />
          ) : feedItems.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardBody}>
                {status.isMember
                  ? "No posts yet. Be the first to post in this Hub."
                  : "Join this Hub to post and comment. Posts will appear here once posted."}
              </Text>
            </View>
          ) : (
            <View style={styles.feedListWrap}>
              {feedItems.map((item: any) => (
                <View key={item.id}>
                  {item.isPinned && <Text style={styles.pinnedLabel}>📌 Pinned</Text>}
                  <FeedItemCard
                    item={item}
                    onPress={() => nav.navigate("PostDetail", { item })}
                  />
                  {isModerator && (
                    <View style={styles.modRow}>
                      <TouchableOpacity onPress={() => togglePin(item)} disabled={busyWpId === item.wpId}>
                        <Text style={styles.memberActionText}>{item.isPinned ? "Unpin" : "Pin"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removePost(item)} disabled={busyWpId === item.wpId}>
                        <Text style={styles.memberActionDanger}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
