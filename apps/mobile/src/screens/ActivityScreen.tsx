import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { formatEGP, money, type Transaction } from "@rti/shared";
import { api } from "../api/client";
import { theme } from "../theme";

export function ActivityScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .transactions()
      .then((data) => setTransactions(data as Transaction[]))
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.reference}>{item.reference}</Text>
            <Text style={styles.amount}>{formatEGP(money(item.amount.minor))}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: theme.colors.background },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginTop: 24 },
  error: { color: theme.colors.danger, marginTop: 12 },
  empty: { color: theme.colors.muted, marginTop: 24 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: theme.radius.md,
    marginBottom: 10,
  },
  reference: { color: theme.colors.text, fontWeight: "600" },
  amount: { color: theme.colors.text, fontWeight: "700" },
});
