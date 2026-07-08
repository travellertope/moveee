import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, Image,
  TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNav } from "../../hooks/useNav";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import type { Hub, HubStatus, FeedItem } from "../../types";
import { useAuthStore } from "../../auth/authStore";
import FeedItemCard from "../../components/community/FeedItemCard";

const ALL_TEMPLATES: { slug: string; label: string; emoji: string }[] = [
  { slug: "post", label: "Update", emoji: "📝" },
  { slug: "cultural-take", label: "Take", emoji: "💬" },
  { slug: "hidden-gem", label: "Gem", emoji: "💎" },
  { slug: "food-review", label: "Food", emoji: "🍽️" },
  { slug: "book-review", label: "Book", emoji: "📚" },
  { slug: "creative-showcase", label: "Showcase", emoji: "🎨" },
  { slug: "event", label: "Event", emoji: "📅" },
  { slug: "poll", label: "Poll", emoji: "📊" },
  { slug: "itinerary", label: "Route", emoji: "🗺️" },
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
    name: { fontFamily: fonts.serifBold, fontSize: 22, color: c.ink },
    meta: { fontFamily: fonts.mono, fontSize: 12, color: c.mute, marginTop: 4 },
    card: { backgroundColor: c.paperWarm, borderRadius: radius.xl, padding: 16, gap: 8, ...shadows.card },
    cardLabel: { fontFamily: fonts.monoBold, fontSize: 10, color: c.mute, textTransform: "uppercase", letterSpacing: 1 },
    cardBody: { fontFamily: fonts.sans, fontSize: 14, color: c.ink, lineHeight: 20 },
    row: { flexDirection: "row", gap: 10, alignItems: "center" },
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
  });
}

export default function HubDetailScreen() {
  const nav = useNav();
  const route = useRoute<any>();
  const slug: string = route.params?.slug;
  const c = useColors();
  const styles = React.useMemo(() => createStyles(c), [c]);
  const { user } = useAuthStore() as any;

  const [loading, setLoading] = useState(true);
  const [hub, setHub] = useState<Hub | null>(null);
  const [status, setStatus] = useState<HubStatus>({ isMember: false, role: null, isFollowing: false });
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

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{hub?.name || "Hub"}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator color={c.gold} /></View>
      ) : !hub ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.notFoundText}>This Hub doesn't exist or has been removed.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {hub.status === "archived" && (
            <View style={styles.card}>
              <Text style={[styles.cardBody, { fontWeight: "700" }]}>
                This Hub is archived — read-only, no new posts or members.
              </Text>
            </View>
          )}

          {hub.coverImageUrl ? (
            <Image source={{ uri: hub.coverImageUrl }} style={{ width: "100%", height: 160, borderRadius: radius.xl }} />
          ) : null}

          <View>
            <Text style={styles.name}>{hub.name}</Text>
            <Text style={styles.meta}>
              {hub.memberCount} member{hub.memberCount === 1 ? "" : "s"} · {hub.postCount} post{hub.postCount === 1 ? "" : "s"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>About</Text>
            <Text style={styles.cardBody}>{hub.description}</Text>
          </View>

          <View style={styles.card}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.row}>
              {status.isMember ? (
                status.role === "owner" ? (
                  <Text style={styles.ownerText}>You own this Hub</Text>
                ) : (
                  <TouchableOpacity onPress={leave} disabled={busy} style={styles.leaveBtn}>
                    <Text style={styles.leaveBtnText}>{busy ? "Leaving…" : "Leave Hub"}</Text>
                  </TouchableOpacity>
                )
              ) : (
                <TouchableOpacity style={styles.joinBtn} onPress={join} disabled={busy}>
                  <Text style={styles.joinBtnText}>{busy ? "Joining…" : "Join →"}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.followBtn, status.isFollowing && styles.followBtnActive]}
                onPress={toggleFollow}
                disabled={busy}
              >
                <Text style={styles.followBtnText}>{status.isFollowing ? "Following ✓" : "Follow"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {status.role === "owner" && (
            <View style={styles.card}>
              {!manageOpen ? (
                <TouchableOpacity style={styles.manageLink} onPress={() => setManageOpen(true)}>
                  <Text style={styles.manageLinkText}>Manage Hub →</Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <Text style={styles.cardLabel}>Manage Hub</Text>
                  {mError ? <Text style={styles.errorText}>{mError}</Text> : null}

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

                  {hub.status !== "archived" && (
                    <TouchableOpacity style={styles.archiveBtn} onPress={archiveHub} disabled={mArchiving}>
                      <Text style={styles.archiveBtnText}>{mArchiving ? "Archiving…" : "Archive this Hub"}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
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
            feedItems.map((item) => (
              <FeedItemCard
                key={item.id}
                item={item}
                onPress={() => nav.navigate("PostDetail", { item })}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
