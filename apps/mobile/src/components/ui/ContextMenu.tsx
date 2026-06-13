import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, radius, type ColorPalette } from "../../theme";

interface ContextMenuAction {
  label: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ContextMenuProps {
  visible: boolean;
  onClose: () => void;
  actions: ContextMenuAction[];
  anchorPosition?: { top: number; right: number };
}

export default function ContextMenu({
  visible,
  onClose,
  actions,
  anchorPosition,
}: ContextMenuProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.menu,
            anchorPosition
              ? { position: "absolute", top: anchorPosition.top, right: anchorPosition.right }
              : styles.menuCentered,
          ]}
        >
          {actions.map((action, i) => (
            <React.Fragment key={action.label}>
              {i > 0 && action.destructive && !actions[i - 1].destructive ? (
                <View style={styles.divider} />
              ) : null}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
              >
                <Ionicons
                  name={action.icon as any}
                  size={16}
                  color={action.destructive ? "#C62828" : c.ink}
                />
                <Text
                  style={[
                    styles.menuLabel,
                    action.destructive && { color: "#C62828" },
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(20,17,13,0.2)",
    },
    menu: {
      width: 200,
      backgroundColor: c.paper,
      borderRadius: 12,
      paddingVertical: 8,
      elevation: 12,
      shadowColor: "#14110D",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
    },
    menuCentered: {
      position: "absolute",
      top: "50%",
      right: 16,
    },
    menuItem: {
      height: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
    },
    menuLabel: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.ink,
    },
    divider: {
      height: 1,
      backgroundColor: c.ghost,
      marginHorizontal: 16,
      marginVertical: 4,
    },
  });
}
