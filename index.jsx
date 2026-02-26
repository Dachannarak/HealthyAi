import { useEffect, useState, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BarChart } from "react-native-chart-kit"
import { useRouter } from "expo-router"
import { Colors } from "../../constants/colors"

const BASEURL = "https://healthy-ai.onrender.com"

export default function Dashboard() {
  return (
    <div style={{ padding: 40 }}>
      <h1>HELLO HEALTHYAI</h1>
    </div>
  );
} {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [userId, setUserId] = useState(0)
  const [displayScore, setDisplayScore] = useState(0)

  const screenWidth = Dimensions.get("window").width

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(40)).current
  const animatedScore = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  const theme = darkMode
    ? {
        bg: "#0F172A",
        card: "#1E293B",
        text: "#F1F5F9",
        muted: "#94A3B8"
      }
    : {
        bg: Colors.background,
        card: Colors.card,
        text: Colors.text,
        muted: Colors.textMuted
      }

  useEffect(() => {
    fetchData()
  }, [userId])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        })
      ])
    ).start()
  }, [])

  useEffect(() => {
    if (user?.Overall_Wellness_Score) {
      Animated.timing(animatedScore, {
        toValue: user.Overall_Wellness_Score,
        duration: 800,
        useNativeDriver: false,
      }).start()

      const listener = animatedScore.addListener(({ value }) => {
        setDisplayScore(value)
      })

      return () => {
        animatedScore.removeListener(listener)
      }
    }
  }, [user])

  const fetchData = async () => {
    setError(null)
    try {
      const [u, a] = await Promise.all([
        fetch(`${BASEURL}/user/${userId}`).then(r => r.json()),
        fetch(`${BASEURL}/analytics`).then(r => r.json())
      ])
      setUser(u)
      setAnalytics(a)
    } catch (e) {
      setError("ไม่สามารถโหลดข้อมูลได้")
    }
    setLoading(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <View style={[styles.container, { padding: 20 }]}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.danger }}>{error}</Text>
      </View>
    )
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={{ color: theme.muted }}>
          ไม่มีข้อมูลผู้ใช้
        </Text>
      </View>
    )
  }

  const rawScore = user?.Overall_Wellness_Score ?? 0
  const avgScore = analytics?.avg_wellness ?? 0
  const diff = rawScore - avgScore

  const chartData = {
    labels: ["Sleep", "Activity", "Cardio", "Mental"],
    datasets: [
      {
        data: [
          user?.Sleep_Health_Score ?? 0,
          user?.Activity_Health_Score ?? 0,
          user?.Cardiovascular_Health_Score ?? 0,
          user?.Mental_Health_Score ?? 0,
        ]
      }
    ]
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.bg }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        <LinearGradient
          colors={[Colors.primary, "#15803D"]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>HealthyAI Dashboard</Text>

          <TouchableOpacity
            onPress={() => setDarkMode(!darkMode)}
            style={{ position: "absolute", right: 20, top: 50 }}
          >
            <Text style={{ color: "#fff", fontSize: 18 }}>
              {darkMode ? "🌙" : "☀️"}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.muted }}>
              Overall Wellness Score
            </Text>

            <Text style={[styles.bigScore, { color: Colors.primary }]}>
              {displayScore.toFixed(1)}
            </Text>

            <Text style={{
              color: diff >= 0 ? Colors.success : Colors.danger,
              marginTop: 8
            }}>
              {diff >= 0
                ? `📈 สูงกว่าค่าเฉลี่ย ${diff.toFixed(1)}`
                : `📉 ต่ำกว่าค่าเฉลี่ย ${Math.abs(diff).toFixed(1)}`
              }
            </Text>
          </View>

          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>🤖 AI Insight</Text>
            <Text style={styles.aiText}>
              {rawScore >= 70
                ? "คุณมีสุขภาพดี รักษาพฤติกรรมนี้ต่อไป"
                : "ควรเพิ่มคุณภาพการนอนและกิจกรรมเพื่อเพิ่มคะแนนสุขภาพ"
              }
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.text, fontWeight: "bold" }}>
              📈 Health Overview
            </Text>

            <BarChart
              data={chartData}
              width={screenWidth - 32}
              height={220}
              yAxisSuffix="%"
              fromZero
              showValuesOnTopOfBars
              chartConfig={{
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(22,163,74,${opacity})`,
                labelColor: () => theme.text,
              }}
              style={{
                marginTop: 16,
                borderRadius: 16,
              }}
            />
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/(tabs)/recommendations")}
        >
          <Text style={styles.fabText}>🤖</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 24, paddingTop: 48 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  card: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  bigScore: {
    fontSize: 72,
    fontWeight: "bold",
  },
  aiCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    padding: 20,
    backgroundColor: "rgba(22,163,74,0.1)",
    borderWidth: 1,
    borderColor: "rgba(22,163,74,0.3)",
  },
  aiTitle: { fontWeight: "bold", marginBottom: 6, color: Colors.primary },
  aiText: { color: Colors.text },
  skeletonCard: {
    height: 120,
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    marginBottom: 16,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  fabText: { fontSize: 28, color: "#fff" },
})
