import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import HeaderCard from './components/HeaderCard';
import { HOST } from './constants';
import BottomPillNav from './components/BottomPillNav';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import DoctorsBySpecialty from './specialties/DoctorsBySpecialty';
import Specialties from './specialties/Specialties';


type Specialty = { _id: string; name: string; iconUrl?: string };
const BRAND = '#13809D';

// Types (لو JS احذفها)
export type RootStackParamList = {
  Home: undefined;
  Specialties: undefined;
  DoctorsBySpecialty: { name: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar
          barStyle="light-content"
          backgroundColor={'#13809D'}
          translucent={false}
        />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Specialties" component={Specialties} />
          <Stack.Screen
            name="DoctorsBySpecialty"
            component={DoctorsBySpecialty}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export function HomeScreen() {
  const navigation = useNavigation();

  const [specialtiesLoading, setSpecialtiesLoading] = useState(true);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${HOST}/specialties`);
        const json = await res.json();
        setSpecialties(Array.isArray(json) ? json : json.items ?? []);
      } catch (e) {
        console.log('Failed to load specialties:', e);
        setSpecialties([]);
      } finally {
        setSpecialtiesLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top']} style={{ backgroundColor: BRAND }}>
        <View style={{ backgroundColor: '#ffffffff' }}>
          <HeaderCard
            name="Zaid Salah"
            avatar="https://i.pravatar.cc/120"
            onPressLang={() => {}}
            onPressBell={() => {}}
            hasNotification
          />
        </View>
      </SafeAreaView>

      <ScrollView>
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 6 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 15,
              paddingTop: 25,
            }}
          >
            <Text style={{ color: '#128FAF', fontWeight: '600', fontSize: 16 }}>
              Upcoming Appointments
            </Text>
            <Text style={{ color: '#1D90AF' }}>View All</Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 15,
              paddingTop: 25,
              paddingBottom: 15,
            }}
          >
            <Text style={{ color: '#128FAF', fontWeight: '600', fontSize: 16 }}>
              Top Specialists
            </Text>
            <Text
              onPress={() => navigation.navigate('Specialties')}
              style={{ color: '#1D90AF' }}
            >
              View All
            </Text>
          </View>

          <View>
            {specialtiesLoading ? (
              <View style={{ marginTop: 10, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#13809D" />
              </View>
            ) : specialties.length === 0 ? (
              <Text style={{ padding: 16, color: '#666' }}>
                لا يوجد تخصصات.
              </Text>
            ) : (
              <FlatList
                data={specialties}
                keyExtractor={item => item._id}
                numColumns={3}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: '#fff',
                      margin: 6,
                      borderRadius: 12,
                      alignItems: 'center',
                      padding: 12,
                      paddingTop: 15,
                      paddingBottom: 15,

                      // ظل iOS
                      shadowColor: '#00000073',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.15,
                      shadowRadius: 5.5,

                      // ظل Android
                      elevation: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 35,
                        backgroundColor: '#fff',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,

                        // ظل خفيف
                        shadowColor: '#00000077',
                        shadowOpacity: 0.08,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 3,
                      }}
                    >
                      <Image
                        source={{ uri: `${HOST}${item.iconUrl}` }}
                        style={{ width: 38, height: 38 }}
                        resizeMode="contain"
                      />
                    </View>

                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        fontSize: 13,
                        fontWeight: '500', // لاحظ أنه سترينغ
                        color: '#128FAF',
                        textAlign: 'center',
                      }}
                    >
                      {item.name}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>

          <View style={{ marginBottom: 50 }}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingLeft: 15,
                paddingRight: 15,
                paddingTop: 25,
                marginBottom: -20,
              }}
            >
              <Text
                style={{
                  color: '#128FAF',
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                Lab Services
              </Text>
            </View>
            <Image
              source={require('../assets/images/img/lab.png')}
              style={{ width: '100%', height: 250 }}
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>

      <BottomPillNav />
    </SafeAreaProvider>
  );
}
