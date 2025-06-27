import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#1B4D3E',
  secondary: '#3E5C76',
  accent: '#007aff',
  lightGreen: '#E8F5E9',
  lightBlue: '#E3F2FD',
  lightOrange: '#FFF3E0',
  white: '#fff',
};

const getDistrictData = (totalAgents) => [
  { district: 'District A', percentage: 0.20, color: '#1B4D3E' },
  { district: 'District B', percentage: 0.18, color: '#3E5C76' },
  { district: 'District C', percentage: 0.16, color: '#4A6FA5' },
  { district: 'District D', percentage: 0.15, color: '#166088' },
  { district: 'District E', percentage: 0.16, color: '#28A745' },
  { district: 'District F', percentage: 0.15, color: '#007aff' },
].map(dist => ({
  ...dist,
  agents: Math.round(totalAgents * dist.percentage),
}));

const initialData = {
  agents: 1000,
  customers: 2500,
  properties: 800,
  skilledResources: 150,
  investors: 300,
  expertPanel: 60,
};

const monthlyTrendData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      data: [1200, 1900, 1700, 2000, 2200, 2500],
      color: (opacity = 1) => `rgba(27, 77, 62, ${opacity})`,
      strokeWidth: 2
    }
  ]
};

export default function Dashboard() {
  const [data, setData] = useState(initialData);
  const [districtData, setDistrictData] = useState(getDistrictData(initialData.agents));
  const [showDistricts, setShowDistricts] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customerClickCount, setCustomerClickCount] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editableData, setEditableData] = useState(initialData);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const animatedValues = useRef({});
  useEffect(() => {
    Object.keys(initialData).forEach(key => {
      animatedValues.current[key] = new Animated.Value(initialData[key]);
    });
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, []);

  const animateValues = (newData) => {
    Object.entries(newData).forEach(([key, val]) => {
      Animated.timing(animatedValues.current[key], {
        toValue: val,
        duration: 600,
        useNativeDriver: false,
      }).start();
    });
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      const updated = {};
      for (let key in data) {
        const increment = Math.floor(Math.random() * 10 + 1);
        updated[key] = data[key] + increment;
      }
      
      setData(updated);
      setEditableData(updated);
      setDistrictData(getDistrictData(updated.agents));
      animateValues(updated);
      setRefreshing(false);
      
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1000);
  }, [data]);

  const handleAgentsClick = () => {
    setShowDistricts(!showDistricts);
    setShowAnalytics(false);
    Animated.timing(fadeAnim, {
      toValue: showDistricts ? 0 : 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const handleAnalyticsClick = () => {
    setShowAnalytics(!showAnalytics);
    setShowDistricts(false);
    Animated.timing(fadeAnim, {
      toValue: showAnalytics ? 0 : 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const handleCustomersClick = () => {
    const newCount = customerClickCount + 1;
    setCustomerClickCount(newCount);
    if (newCount === 5) {
      setEditMode(true);
      Alert.alert('Edit Mode Activated', 'You can now edit all fabricated numbers.');
    }
  };

  const handleSave = () => {
    setData(editableData);
    setDistrictData(getDistrictData(editableData.agents));
    setEditMode(false);
    setCustomerClickCount(0);
    animateValues(editableData);
  };

  const renderTile = (label, key, onPress, iconName, IconComponent = Ionicons) => (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.tile,
          { 
            backgroundColor: getTileColor(key),
            shadowColor: COLORS.primary,
          }
        ]}
        activeOpacity={0.8}
      >
        <View style={styles.tileHeader}>
          <IconComponent 
            name={iconName} 
            size={24} 
            color={COLORS.primary} 
            style={styles.tileIcon}
          />
          <Text style={styles.tileLabel}>{label}</Text>
        </View>
        <Animated.Text style={styles.tileValue}>
          {animatedValues.current[key]?.interpolate({
            inputRange: [0, 100000],
            outputRange: [0, 100000],
            extrapolate: 'clamp',
          }).__getValue().toFixed
            ? animatedValues.current[key]?.__getValue().toFixed(0)
            : data[key]}
        </Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const getTileColor = (key) => {
    switch(key) {
      case 'agents': return COLORS.lightBlue;
      case 'customers': return COLORS.lightGreen;
      case 'properties': return '#F3E5F5';
      case 'skilledResources': return COLORS.lightOrange;
      case 'investors': return '#E0F7FA';
      case 'expertPanel': return '#E8EAF6';
      default: return '#f9f9f9';
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={handleRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      {renderTile('Agents', 'agents', handleAgentsClick, 'people')}
      {renderTile('Customers', 'customers', handleCustomersClick, 'people-circle')}
      {renderTile('Properties', 'properties', () => {}, 'home', MaterialCommunityIcons)}
      {renderTile('Skilled Resources', 'skilledResources', handleAnalyticsClick, 'hammer', MaterialCommunityIcons)}
      {renderTile('Investors', 'investors', () => {}, 'trending-up')}
      {renderTile('Expert Panel', 'expertPanel', () => {}, 'school')}

      {showDistricts && (
        <Animated.View style={[styles.sectionContainer, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>
            Agents Distribution ({districtData.reduce((sum, d) => sum + d.agents, 0)}/{data.agents})
          </Text>
          <BarChart
            data={{
              labels: districtData.map(d => d.district),
              datasets: [{ data: districtData.map(d => d.agents) }],
            }}
            width={Dimensions.get('window').width - 40}
            height={280} // Increased height to prevent label overlap
            yAxisLabel=""
            fromZero
            chartConfig={{
              backgroundColor: COLORS.white,
              backgroundGradientFrom: COLORS.white,
              backgroundGradientTo: COLORS.white,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(27, 77, 62, ${opacity})`,
              labelColor: () => '#333',
              style: {
                borderRadius: 10,
              },
              propsForLabels: {
                fontSize: 10,
                fontWeight: 'bold',
              },
              propsForVerticalLabels: {
                rotation: -45,
                yOffset: 20,
                xOffset: -10,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: COLORS.primary,
              },
            }}
            style={styles.chart}
            showBarTops={false}
            withInnerLines={false}
            verticalLabelRotation={-45}
          />

          <View style={styles.districtList}>
            {districtData.map((item, index) => (
              <View key={index} style={[styles.districtBox, { borderLeftColor: item.color }]}>
                <Text style={styles.districtText}>{item.district}:</Text>
                <Text style={styles.districtValue}>
                  {item.agents} ({Math.round(item.percentage * 100)}%)
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {showAnalytics && (
        <Animated.View style={[styles.sectionContainer, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Analytics Overview</Text>
          
          <PieChart
            data={districtData.map(item => ({
              name: item.district,
              population: item.agents,
              color: item.color,
              legendFontColor: '#7F7F7F',
              legendFontSize: 12,
            }))}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundColor: COLORS.white,
              backgroundGradientFrom: COLORS.white,
              backgroundGradientTo: COLORS.white,
              color: (opacity = 1) => `rgba(27, 77, 62, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
            absolute
          />

          <Text style={styles.sectionSubtitle}>Monthly Growth Trend</Text>
          <LineChart
            data={monthlyTrendData}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundColor: COLORS.white,
              backgroundGradientFrom: COLORS.white,
              backgroundGradientTo: COLORS.white,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(27, 77, 62, ${opacity})`,
              labelColor: () => '#333',
              style: {
                borderRadius: 10,
              },
              propsForLabels: {
                fontSize: 10,
              },
            }}
            style={styles.chart}
            bezier
          />
        </Animated.View>
      )}

      {editMode && (
        <Animated.View style={[styles.editContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.sectionTitle}>Edit Numbers</Text>
          {Object.entries(editableData).map(([key, value], index) => (
            <View key={index} style={styles.inputBox}>
              <Text style={styles.inputLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1)}:
              </Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(value)}
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  setEditableData((prev) => ({ ...prev, [key]: num }));
                }}
              />
            </View>
          ))}
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, { backgroundColor: COLORS.primary }]}
          >
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 80,
    backgroundColor: '#f5f5f5',
  },
  tile: {
    marginVertical: 10,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tileIcon: {
    marginRight: 10,
  },
  tileLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tileValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
  sectionContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1B4D3E',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#3E5C76',
  },
  districtList: {
    marginTop: 10,
  },
  districtBox: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginVertical: 5,
    borderLeftWidth: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  districtText: {
    color: '#555',
  },
  districtValue: {
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editContainer: {
    marginTop: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
  },
  inputBox: {
    marginBottom: 15,
  },
  inputLabel: {
    marginBottom: 5,
    color: '#555',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  saveButton: {
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    elevation: 3,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});