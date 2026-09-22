import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

const FEATURED_MERCHANTS = [
  { id: "seed-merchant-emc-mart", name: "EMC Mart", category: "Grocery" },
  { id: "m2", name: "City Pharmacy", category: "Pharmacy" },
  { id: "m3", name: "Cairo Electronics", category: "Electronics" },
];

export function ShopScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shop</Text>
      <FlatList
        data={FEATURED_MERCHANTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.category}>{item.category}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: theme.colors.background },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginTop: 24 },
  card: { backgroundColor: "#FFF", padding: 18, borderRadius: theme.radius.md, marginBottom: 12 },
  name: { fontWeight: "700", color: theme.colors.text },
  category: { color: theme.colors.muted, marginTop: 4 },
});
