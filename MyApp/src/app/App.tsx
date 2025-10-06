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
  useWindowDimensions,
  Pressable,
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
import DoctorDetails from './DoctorDetails';
import BookingScreen from './BookingScreen';


type Specialty = { _id: string; name: string; iconUrl?: string };
const BRAND = '#13809D';

// Types (لو JS احذفها)
export type RootStackParamList = {
  Home: undefined;
  Specialties: undefined;
  DoctorsBySpecialty: { name: string };
  DoctorDetails: { id: string };
  Booking: { doctorId: string };
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
          <Stack.Screen name="DoctorDetails" component={DoctorDetails} />
          <Stack.Screen name="Booking" component={BookingScreen} />

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export function HomeScreen() {
  const navigation = useNavigation();

  const [specialtiesLoading, setSpecialtiesLoading] = useState(true);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  const [sixDoctorsLoading, setSixDoctorsLoading] = useState(true);
  const [sixDoctors, setSixDoctors] = useState([]);

  // ✅ احسب أبعاد الكارد داخل الكومبوننت
  const { width } = useWindowDimensions();
  const SIDE = 16;
  const GAP = 12;
  const CARD_H = 170;
  const CARD_W = (width - SIDE * 2 - GAP) / 2;

  // ل الخصصات
  const SPECIALTY_NUM_COLUMNS = 3;
  const SPECIALTY_GAP = 12;
  const SPECIALTY_H_PADDING = 12;

  const SPECIALTY_CARD_W =
    (width -
      SPECIALTY_H_PADDING * 2 -
      SPECIALTY_GAP * (SPECIALTY_NUM_COLUMNS - 1)) /
    SPECIALTY_NUM_COLUMNS;

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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${HOST}/get6Doctors`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const list = Array.isArray(json)
          ? json
          : json.items ?? json.doctors ?? json.data ?? [];

        console.log(
          'get6Doctors len=',
          Array.isArray(list) ? list.length : 0,
          list,
        );
        setSixDoctors(list);
      } catch (e) {
        console.log('Failed to load doctors:', e);
        setSixDoctors([]);
      } finally {
        setSixDoctorsLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaProvider style={{ backgroundColor: '#fff' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: BRAND }}>
        <View style={{ backgroundColor: '#ffffffff' }}>
          <HeaderCard
            name="Zaid Salah"
            avatar="https://img.freepik.com/free-photo/portrait-white-man-isolated_53876-40306.jpg?semt=ais_hybrid&w=740&q=80"
            onPressLang={() => {}}
            onPressBell={() => {}}
            hasNotification
          />
        </View>
      </SafeAreaView>

      <ScrollView>
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 6 }}>
          {/* Upcoming appointment Section */}
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

          {/* Top Specialists Section */}
          <View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 15,
                paddingTop: 25,
                paddingBottom: 15,
              }}
            >
              <Text
                style={{ color: '#128FAF', fontWeight: '600', fontSize: 16 }}
              >
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
                  numColumns={SPECIALTY_NUM_COLUMNS}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  columnWrapperStyle={{
                    justifyContent: 'space-between',
                    paddingHorizontal: SPECIALTY_H_PADDING,
                  }}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() =>
                        navigation.navigate('DoctorsBySpecialty', {
                          name: item.name,
                        })
                      }
                      android_ripple={{ color: '#e6f6fa', borderless: false }}
                      style={({ pressed }) => [
                        {
                          width: SPECIALTY_CARD_W,
                          backgroundColor: '#fff',
                          borderRadius: 12,
                          alignItems: 'center',
                          paddingVertical: 15,
                          marginBottom: SPECIALTY_GAP,

                          // ظل iOS
                          shadowColor: '#00000073',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.15,
                          shadowRadius: 5.5,

                          // ظل Android
                          elevation: 4,

                          // ✅ أهم تعديل: لا ترجع null/undefined أبداً
                          transform: pressed
                            ? [{ scale: 0.98 }]
                            : [{ scale: 1 }],
                          opacity: pressed ? 0.95 : 1,
                        },
                      ]}
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

                          shadowColor: '#00000077',
                          shadowOpacity: 0.08,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 3 },
                          elevation: 3,
                          overflow: 'hidden',
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
                          fontWeight: '500',
                          color: '#128FAF',
                          textAlign: 'center',
                        }}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  )}
                />
              )}
            </View>
          </View>

          {/* Lab Packages Section */}
          <View>
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

          {/* Our Doctors list */}
          <View>
            <View style={{ marginBottom: 150 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingHorizontal: 15,
                  paddingTop: 25,
                }}
              >
                <Text
                  style={{
                    color: '#128FAF',
                    fontWeight: '600',
                    fontSize: 16,
                  }}
                >
                  Top Doctors
                </Text>
                <Text style={{ color: '#1D90AF' }}>View All</Text>
              </View>

              {sixDoctorsLoading ? (
                <ActivityIndicator size="large" color="#13809D" />
              ) : sixDoctors.length === 0 ? (
                <Text style={{ padding: 16, color: '#666' }}>
                  لا يوجد أطباء.
                </Text>
              ) : (
                <FlatList
                  data={sixDoctors}
                  keyExtractor={(item: any) => item._id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    // paddingHorizontal: SIDE,
                    paddingTop: 52,
                  }}
                  ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
                  snapToInterval={CARD_W + GAP}
                  decelerationRate="fast"
                  snapToAlignment="start"
                  renderItem={({ item }: any) => {
                    const img = item?.photoUrl?.startsWith('http')
                      ? item.photoUrl
                      : `${HOST}${item.photoUrl || ''}`;
                    return (
                      <View
                        style={{
                          width: CARD_W,
                          height: CARD_H,
                          borderRadius: 14,
                          backgroundColor: BRAND,
                          padding: 12,
                          
                        }}
                      >
                        <Image
                          source={{ uri: img }}
                          style={{
                            width: 84,
                            height: 84,
                            borderRadius: 14,
                            position: 'relative',
                            top: -35,
                          }}
                        />
                        <View style={{ marginTop: -20 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              color: '#fff',
                              fontWeight: '700',
                              fontSize: 15,
                            }}
                          >
                            {item.name}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{
                              color: '#E9FCFF',
                              fontSize: 13,
                              marginTop: 4,
                            }}
                          >
                            {item?.specialtyId?.name ?? '—'}
                          </Text>
                        </View>
                      </View>
                    );
                  }}
                  ListFooterComponent={<View style={{ width: SIDE }} />}
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomPillNav />
    </SafeAreaProvider>
  );
}
